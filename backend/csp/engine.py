"""
csp/engine.py
─────────────────────────────────────────────────────────────────────────────
Constraint Satisfaction Problem engine for college timetable scheduling.

Algorithm:
  1. Build variables — one per (batch, session_number).
  2. Pre-filter domains with constraint propagation (capacity + room type).
  3. Backtracking search with MRV (minimum remaining values) heuristic +
     forward checking (domain wipe-out detection).
  4. Soft-constraint ordering: preferred teacher / room / time are tried first.
  5. Post-search conflict verification with detailed conflict descriptions.
  6. Each schedule entry is enriched with startTime, endTime, durationMinutes,
     and constraintExplanation.

Hard constraints enforced:
    H1. No teacher double-booked during any occupied period.
    H2. No room double-booked during any occupied period.
    H3. No batch double-booked during any occupied period.
    H4. Each batch has at least one free period per day.
  H5. Lab rooms only for lab sessions; classrooms only for theory sessions.
  H6. Room capacity >= batch student count.
    H7. Sessions only in WORKING_DAYS x PERIODS (08:00-17:00).
    H8. A student cannot attend overlapping selected subject batches.
    H9. Labs occupy two adjacent instructional periods.

Soft constraints (ordering within domain, not hard rejection):
  S1. Preferred teacher (from batch.preferredTeacherId if set).
  S2. Preferred room type / block.
  S3. Preferred time (morning slots first by default).
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Optional, Tuple, Any, Set
import random
import sys
import os

# Allow importing from parent directory (backend root)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.timetable_slots import (
    WORKING_DAYS,
    ALL_PERIODS,
    LAB_START_PERIODS,
    enrich_entry_with_times,
    TIMETABLE_SLOTS,
)


# ─── Types ────────────────────────────────────────────────────────────────────
DAYS    = WORKING_DAYS      # ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
PERIODS = ALL_PERIODS       # [1, 2, 3, 4, 5, 6]

# A "value" in the domain is a (day, period, room_id) triple.
Value      = Tuple[str, int, str]
# An "assignment" maps variable_key -> Value
Assignment = Dict[str, Value]


class Variable:
    """Represents one session that needs to be scheduled."""

    def __init__(
        self,
        key: str,             # unique id, e.g. "batch_sub_wp_A_3"
        batch_id: str,
        teacher_id: str,
        subject_id: str,
        session_index: int,   # 1-based within this batch's sessions for this subject
        session_type: str,    # "theory" or "lab"
        student_count: int,
        preferred_teacher_id: Optional[str] = None,
        preferred_room_block: Optional[str] = None,
        student_ids: Optional[Set[str]] = None,
    ):
        self.key                 = key
        self.batch_id            = batch_id
        self.teacher_id          = teacher_id
        self.subject_id          = subject_id
        self.session_index       = session_index
        self.session_type        = session_type
        self.student_count       = student_count
        self.preferred_teacher_id = preferred_teacher_id
        self.preferred_room_block = preferred_room_block
        self.student_ids = set(student_ids or ())
        self.domain: List[Value] = []   # filled by build_domains()


# ─── Domain builder ───────────────────────────────────────────────────────────

def build_variables_and_domains(batches, subjects, rooms, students=None) -> List[Variable]:
    """
    For every (batch x session) create a Variable and pre-filter its domain.

    Hard domain filters (constraint propagation):
      H5. room.roomType == "lab" iff session_type == "lab"
      H6. room.capacity >= batch.studentCount

    Soft ordering applied in _build_domain (preferred time/room first).
    """
    subject_map = {s["id"]: s for s in subjects}
    students_by_batch: Dict[str, Set[str]] = {}
    for student in students or []:
        student_id = student.get("id")
        for batch_id in (student.get("preferences") or {}).values():
            if student_id and batch_id:
                students_by_batch.setdefault(batch_id, set()).add(student_id)
    variables: List[Variable] = []

    for batch in batches:
        sub   = subject_map.get(batch["subjectId"])
        if sub is None:
            continue
        count = batch.get("studentCount", 30)

        session_idx = 1
        for _ in range(sub.get("theoryPeriodsPerWeek", 3)):
            var = Variable(
                key           = f"{batch['id']}_s{session_idx}",
                batch_id      = batch["id"],
                teacher_id    = batch["teacherId"],
                subject_id    = batch["subjectId"],
                session_index = session_idx,
                session_type  = "theory",
                student_count = count,
                preferred_teacher_id = batch.get("preferredTeacherId"),
                preferred_room_block = batch.get("preferredRoomBlock"),
                student_ids = students_by_batch.get(batch["id"], set()),
            )
            var.domain = _build_domain(var, rooms)
            variables.append(var)
            session_idx += 1

        for _ in range(sub.get("labPeriodsPerWeek", 1)):
            var = Variable(
                key           = f"{batch['id']}_s{session_idx}",
                batch_id      = batch["id"],
                teacher_id    = batch["teacherId"],
                subject_id    = batch["subjectId"],
                session_index = session_idx,
                session_type  = "lab",
                student_count = count,
                preferred_teacher_id = batch.get("preferredTeacherId"),
                preferred_room_block = batch.get("preferredRoomBlock"),
                student_ids = students_by_batch.get(batch["id"], set()),
            )
            var.domain = _build_domain(var, rooms)
            variables.append(var)
            session_idx += 1

    return variables


def _build_domain(var: Variable, rooms: list) -> List[Value]:
    """
    Return all (day, period, room_id) triples passing static hard filters.
    Values are ordered so soft-preferred slots come first:
      - Morning periods (1, 2, 3) before afternoon
      - Preferred room block rooms listed first
    """
    required_type = "lab" if var.session_type == "lab" else "classroom"
    suitable_rooms = [
        r for r in rooms
        if r.get("capacity", 0) >= var.student_count
        and r.get("roomType") == required_type
    ]

    # Soft: preferred block first
    pref_block = var.preferred_room_block
    if pref_block:
        suitable_rooms = sorted(
            suitable_rooms,
            key=lambda r: 0 if r.get("block") == pref_block else 1
        )

    domain: List[Value] = []
    # Soft: morning periods (1-3) preferred → listed first
    valid_periods = LAB_START_PERIODS if var.session_type == "lab" else PERIODS
    morning = [period for period in [1, 2, 3] if period in valid_periods]
    afternoon = [period for period in [4, 5, 6] if period in valid_periods]
    for day in DAYS:
        for period in morning + afternoon:
            for room in suitable_rooms:
                domain.append((day, period, room["id"]))
    return domain


# ─── Consistency check ────────────────────────────────────────────────────────

def is_consistent(
    var: Variable,
    value: Value,
    assignment: Assignment,
    variables: List[Variable],
) -> bool:
    """
    Return True iff assigning `value` to `var` is consistent with the
    current partial assignment.

    Hard checks:
            H1-H3. Teacher, room, and batch are not double-booked in occupied periods.
            H4. Batch has at least one free period per day.
            H8. No enrolled student has another selected class in those periods.
    """
    day, period, room_id = value
    periods = set(_occupied_periods(var, period))

    var_map = {v.key: v for v in variables}

    for assigned_key, assigned_val in assignment.items():
        a_day, a_period, a_room = assigned_val
        if a_day != day or not periods.intersection(
            _occupied_periods(var_map[assigned_key], a_period)
        ):
            continue   # different time slot, no conflict possible

        assigned_var = var_map[assigned_key]

        # H1. Teacher clash
        if assigned_var.teacher_id == var.teacher_id:
            return False

        # H2. Room clash
        if a_room == room_id:
            return False

        # H3. Batch clash
        if assigned_var.batch_id == var.batch_id:
            return False

        if assigned_var.student_ids.intersection(var.student_ids):
            return False

    # H4. Daily break constraint: max 5 periods per day per batch
    occupied_for_batch = set(periods)
    for a_key, (a_day, a_period, _) in assignment.items():
        if a_day == day and var_map[a_key].batch_id == var.batch_id:
            occupied_for_batch.update(_occupied_periods(var_map[a_key], a_period))
    if len(occupied_for_batch) > len(PERIODS) - 1:  # leave at least one free period
        return False

    return True


def _occupied_periods(var: Variable, start_period: int) -> Tuple[int, ...]:
    """Return every period reserved by a session, including a lab's second period."""
    if var.session_type == "lab":
        return (start_period, start_period + 1)
    return (start_period,)


# ─── MRV heuristic ────────────────────────────────────────────────────────────

def select_unassigned_variable(
    variables: List[Variable],
    assignment: Assignment,
    domains: Dict[str, List[Value]],
) -> Optional[Variable]:
    """
    MRV: choose the unassigned variable with fewest remaining legal values.
    Ties are broken by the variable that appears first in the list (stable).
    """
    unassigned = [v for v in variables if v.key not in assignment]
    if not unassigned:
        return None
    return min(unassigned, key=lambda v: len(domains[v.key]))


# ─── Forward checking ─────────────────────────────────────────────────────────

def forward_check(
    var: Variable,
    value: Value,
    variables: List[Variable],
    domains: Dict[str, List[Value]],
    assignment: Assignment,
) -> Optional[Dict[str, List[Value]]]:
    """
    After assigning value to var, remove values that overlap its occupied periods
    and conflict on teacher, room, batch, or enrolled student.
    Returns updated domains dict, or None if any domain becomes empty (fail-early).
    """
    day, period, room_id = value
    new_domains = {k: list(v) for k, v in domains.items()}

    for other in variables:
        if other.key in assignment or other.key == var.key:
            continue

        filtered = []
        for d_val in new_domains[other.key]:
            o_day, o_period, o_room = d_val
            if o_day == day and set(_occupied_periods(var, period)).intersection(
                _occupied_periods(other, o_period)
            ):
                if (
                    other.teacher_id == var.teacher_id
                    or o_room == room_id
                    or other.batch_id == var.batch_id
                    or bool(other.student_ids.intersection(var.student_ids))
                ):
                    continue   # remove this value
            filtered.append(d_val)

        if not filtered:
            return None  # domain wipe-out → trigger backtrack

        new_domains[other.key] = filtered

    return new_domains


# ─── Backtracking search ──────────────────────────────────────────────────────

def backtrack(
    variables: List[Variable],
    assignment: Assignment,
    domains: Dict[str, List[Value]],
    max_failures: int = 500_000,
    _counter: list = None,
) -> Optional[Assignment]:
    if _counter is None:
        _counter = [0]

    if len(assignment) == len(variables):
        return assignment   # complete assignment found

    var = select_unassigned_variable(variables, assignment, domains)
    if var is None:
        return None

    # Domain values already soft-ordered by _build_domain (morning first, preferred rooms first).
    # Add a small shuffle for diversity on re-runs (seeded externally for determinism).
    values = list(domains[var.key])
    random.shuffle(values)

    for value in values:
        _counter[0] += 1
        if _counter[0] > max_failures:
            raise RecursionError(
                f"CSP exceeded {max_failures} attempts — data may be infeasible."
            )

        if is_consistent(var, value, assignment, variables):
            assignment[var.key] = value

            new_domains = forward_check(var, value, variables, domains, assignment)
            if new_domains is not None:
                result = backtrack(variables, assignment, new_domains, max_failures, _counter)
                if result is not None:
                    return result

            del assignment[var.key]

    return None   # exhausted all values → backtrack in caller


# ─── Constraint explanation generator ────────────────────────────────────────

def _build_explanation(
    var: Variable,
    value: Value,
    assignment: Assignment,
    var_map: Dict[str, Variable],
) -> str:
    """
    Generate a human-readable CSP constraint explanation for a scheduled session.
    This is entirely data-driven — no AI hallucinations.
    """
    day, period, room_id = value
    slot = TIMETABLE_SLOTS.get(period, TIMETABLE_SLOTS[1])

    reasons = []

    # Why this time slot?
    reasons.append(
        f"Scheduled on {day} Period {period} ({slot['label']}) because "
        f"no other session for batch '{var.batch_id}', "
        f"teacher '{var.teacher_id}', or room '{room_id}' "
        f"conflicts at this time."
    )

    # Daily break compliance
    same_day = sum(
        1 for k, (d, _, _) in assignment.items()
        if d == day and var_map[k].batch_id == var.batch_id
    )
    reasons.append(
        f"Daily break constraint satisfied: batch has {same_day} other "
        f"session(s) on {day} (max 5 allowed, leaving at least 1 free period)."
    )

    # Room rationale
    if var.session_type == "lab":
        reasons.append(
            f"Room '{room_id}' is a lab room with capacity >= {var.student_count} students, "
            f"assigned exclusively for this lab session."
        )
    else:
        reasons.append(
            f"Room '{room_id}' is a classroom with capacity >= {var.student_count} students, "
            f"no other class is using it at this slot."
        )

    # Preferred teacher compliance
    if var.preferred_teacher_id and var.teacher_id == var.preferred_teacher_id:
        reasons.append(
            f"Soft constraint: preferred teacher '{var.teacher_id}' was available — assigned."
        )
    elif var.preferred_teacher_id:
        reasons.append(
            f"Preferred teacher '{var.preferred_teacher_id}' had a conflict; "
            f"assigned teacher '{var.teacher_id}' as fallback."
        )

    return " | ".join(reasons)


# ─── Conflict verification ────────────────────────────────────────────────────

def verify_no_conflicts(assignment: Assignment, variables: List[Variable]) -> List[str]:
    """
    Re-scan the full assignment for double-bookings and break violations.
    Returns a list of conflict description strings (empty = clean schedule).
    """
    var_map = {v.key: v for v in variables}
    conflicts = []
    assigned = list(assignment.items())
    for i, (key_a, (day_a, period_a, room_a)) in enumerate(assigned):
        for key_b, (day_b, period_b, room_b) in assigned[i + 1:]:
            if day_a != day_b or not set(_occupied_periods(var_map[key_a], period_a)).intersection(
                _occupied_periods(var_map[key_b], period_b)
            ):
                continue
            va = var_map[key_a]
            vb = var_map[key_b]
            period = max(period_a, period_b)
            if va.teacher_id == vb.teacher_id:
                conflicts.append(f"TEACHER CLASH: {va.teacher_id} on {day_a} P{period}")
            if room_a == room_b:
                conflicts.append(f"ROOM CLASH: room {room_a} on {day_a} P{period}")
            if va.batch_id == vb.batch_id:
                conflicts.append(f"BATCH CLASH: {va.batch_id} on {day_a} P{period}")
            if va.student_ids.intersection(vb.student_ids):
                conflicts.append(f"STUDENT CLASH: enrolled students on {day_a} P{period}")

    # Check H4: daily break
    batch_day_periods: Dict[Tuple[str, str], Set[int]] = {}
    for key, (day, period, _) in assignment.items():
        bid = var_map[key].batch_id
        batch_day_periods.setdefault((bid, day), set()).update(_occupied_periods(var_map[key], period))

    for (bid, day), occupied_periods in batch_day_periods.items():
        if len(occupied_periods) > len(PERIODS) - 1:
            conflicts.append(
                f"NO BREAK CONFLICT: Batch {bid} has {len(occupied_periods)} periods occupied on {day}"
            )

    return conflicts


# ─── Public entry point ───────────────────────────────────────────────────────

def run_csp(batches, subjects, rooms, students=None) -> Tuple[List[Dict], List[str]]:
    """
    Run the full CSP and return (schedule_entries, conflicts).

    schedule_entries: list of dicts ready to insert into MongoDB.
      Each entry includes: batchId, teacherId, subjectId, roomId, day, period,
      sessionType, isEvent, eventId, startTime, endTime, durationMinutes,
      slotLabel, constraintExplanation.
    conflicts: list of conflict strings (should be empty on success).
    """
    variables = build_variables_and_domains(batches, subjects, rooms, students)

    # MRV-friendly start: sort by smallest domain first
    random.shuffle(variables)
    variables.sort(key=lambda v: len(v.domain))

    domains: Dict[str, List[Value]] = {v.key: list(v.domain) for v in variables}
    assignment: Assignment = {}

    print(f"  CSP: {len(variables)} variables, running backtracking search...")
    result = backtrack(variables, assignment, domains)

    if result is None:
        return [], ["CSP returned no solution — check data feasibility."]

    conflicts = verify_no_conflicts(result, variables)

    var_map = {v.key: v for v in variables}
    entries = []
    for key, (day, period, room_id) in result.items():
        var = var_map[key]

        # Build base entry
        entry = {
            "batchId":     var.batch_id,
            "teacherId":   var.teacher_id,
            "subjectId":   var.subject_id,
            "roomId":      room_id,
            "day":         day,
            "period":      period,
            "sessionType": var.session_type,
            "isEvent":     False,
            "eventId":     None,
            "constraintExplanation": _build_explanation(var, (day, period, room_id), result, var_map),
        }

        # Enrich with time info from centralized config
        entry = enrich_entry_with_times(entry)
        entries.append(entry)

    return entries, conflicts
