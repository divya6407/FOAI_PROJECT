"""
routes/admin.py
─────────────────────────────────────────────────────────────────────────────
POST /admin/requests/{id}/approve
POST /admin/requests/{id}/reject
GET  /admin/stats?date=
GET  /admin/workload                  (Requirement 6: Teacher Workload)
POST /admin/timetable/alternative    (Requirement 8: Alternative Timetable Generator)
GET  /admin/conflicts
GET  /admin/timetable/month?month=
─────────────────────────────────────────────────────────────────────────────
"""
from datetime import datetime, date, timedelta
import calendar
import random
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from db import get_db
from models import RejectRequest
from services.room_allocation import rank_suitable_rooms
from routes.auth import require_role
from csp.engine import run_csp
from config.timetable_slots import WORKING_DAYS

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(["admin"]))],
)

DAYS = WORKING_DAYS


def _date_to_day(date_str: str) -> Optional[str]:
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        idx = d.weekday()
        return DAYS[idx] if idx < len(DAYS) else None
    except Exception:
        return None


@router.post("/requests/{event_id}/approve")
async def approve_event_request(event_id: str):
    """
    Approve event request by reserving the teacher-selected room (assignedRoomId).
    Re-checks if the requested room is still free at approval time.
    """
    db = get_db()

    event = await db["events"].find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")
    if event["status"] != "PENDING":
        raise HTTPException(status_code=400, detail=f"Event is already {event['status']}.")

    target_room_id = event.get("assignedRoomId")
    if not target_room_id:
        raise HTTPException(status_code=400, detail="Event request has no room specified.")

    day = _date_to_day(event["date"])
    if day is None:
        raise HTTPException(status_code=400, detail="Event date falls on a weekend.")

    # Re-check availability of target_room_id during event's periods
    for period in range(event["startPeriod"], event["endPeriod"] + 1):
        conflict = await db["schedule"].find_one({"day": day, "period": period, "roomId": target_room_id})
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Room '{target_room_id}' is occupied on {day} during Period {period}."
            )

    # Insert schedule entries for each period
    schedule_entries = []
    for period in range(event["startPeriod"], event["endPeriod"] + 1):
        schedule_entries.append({
            "batchId":     "event",
            "teacherId":   "",
            "subjectId":   "",
            "roomId":      target_room_id,
            "day":         day,
            "period":      period,
            "sessionType": "theory",
            "isEvent":     True,
            "eventId":     event_id,
            "startTime":   f"09:00",
            "endTime":     f"09:50",
            "durationMinutes": 50,
            "constraintExplanation": "Approved special event booking.",
        })

    await db["schedule"].insert_many(schedule_entries)

    await db["events"].update_one(
        {"id": event_id},
        {"$set": {
            "status":         "APPROVED",
            "assignedRoomId": target_room_id,
        }}
    )

    return {
        "success":          True,
        "assignedRoom":     target_room_id,
        "periodsScheduled": len(schedule_entries),
    }


@router.post("/requests/{event_id}/reject")
async def reject_event_request(event_id: str, payload: RejectRequest):
    db = get_db()

    event = await db["events"].find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")
    if event["status"] != "PENDING":
        raise HTTPException(status_code=400, detail=f"Event is already {event['status']}.")

    await db["events"].update_one(
        {"id": event_id},
        {"$set": {"status": "REJECTED", "rejectionReason": payload.reason}}
    )
    return {"success": True, "reason": payload.reason}


@router.get("/workload")
async def get_teacher_workload(overload_threshold_hours: float = 12.0):
    """
    Teacher Workload view (Requirement 6).
    Calculates Theory Hours, Lab Hours, Total Weekly Hours, and Class Count per teacher.
    """
    db = get_db()
    teachers = await db["teachers"].find({}, {"_id": 0}).to_list(None)
    subjects = {s["id"]: s["name"] for s in await db["subjects"].find({}, {"_id": 0}).to_list(None)}
    entries  = await db["schedule"].find({"isEvent": False}, {"_id": 0}).to_list(None)

    # Aggregate by teacherId
    workload_by_teacher = {}
    for t in teachers:
        workload_by_teacher[t["id"]] = {
            "teacherId": t["id"],
            "teacherName": t["name"],
            "subjectId": t["subjectId"],
            "subjectName": subjects.get(t["subjectId"], t["subjectId"]),
            "theoryCount": 0,
            "labCount": 0,
            "totalClasses": 0,
            "theoryMinutes": 0,
            "labMinutes": 0,
            "totalMinutes": 0,
            "theoryHours": 0.0,
            "labHours": 0.0,
            "totalHours": 0.0,
            "isOverloaded": False,
        }

    for e in entries:
        tid = e.get("teacherId")
        if tid in workload_by_teacher:
            stype = e.get("sessionType", "theory")
            if stype == "lab":
                workload_by_teacher[tid]["labCount"] += 1
                workload_by_teacher[tid]["labMinutes"] += 100   # 1 hr 40 min = 100 min
            else:
                workload_by_teacher[tid]["theoryCount"] += 1
                workload_by_teacher[tid]["theoryMinutes"] += 50  # 50 min

            workload_by_teacher[tid]["totalClasses"] += 1

    result = []
    for tid, info in workload_by_teacher.items():
        info["theoryHours"] = round(info["theoryMinutes"] / 60.0, 1)
        info["labHours"]    = round(info["labMinutes"] / 60.0, 1)
        info["totalHours"]  = round((info["theoryMinutes"] + info["labMinutes"]) / 60.0, 1)
        info["isOverloaded"] = info["totalHours"] > overload_threshold_hours
        result.append(info)

    result.sort(key=lambda x: x["totalHours"], reverse=True)
    return {"workload": result, "count": len(result)}


@router.post("/timetable/alternative")
async def generate_alternative_timetable():
    """
    Generate an alternative timetable (Requirement 8) using CSP with a different random seed.
    Guarantees 0 conflicts; if no alternative satisfies constraints, returns 400.
    """
    db = get_db()
    subjects = await db["subjects"].find({}, {"_id": 0}).to_list(None)
    batches  = await db["batches"].find({},  {"_id": 0}).to_list(None)
    rooms    = await db["rooms"].find({},    {"_id": 0}).to_list(None)

    if not batches or not subjects or not rooms:
        raise HTTPException(status_code=400, detail="Database not seeded. Run seed.py first.")

    # Use a different random seed for alternative solution space exploration
    alt_seed = random.randint(100, 99999)
    random.seed(alt_seed)

    entries, conflicts = run_csp(batches, subjects, rooms)

    if not entries or len(conflicts) > 0:
        raise HTTPException(
            status_code=400,
            detail="No alternative timetable satisfying all constraints was found."
        )

    # Save alternative timetable
    await db["schedule"].delete_many({"isEvent": False})
    result = await db["schedule"].insert_many(entries)

    return {
        "success": True,
        "isAlternative": True,
        "seedUsed": alt_seed,
        "sessionsScheduled": len(result.inserted_ids),
        "conflicts": conflicts,
        "conflictCount": 0,
        "message": "Alternative timetable successfully generated and applied.",
    }


@router.get("/stats")
async def get_admin_stats(date: Optional[str] = Query(None)):
    """
    Return comprehensive dashboard stats (Requirement 11).
    """
    db = get_db()

    target_date_str = date or datetime.today().strftime("%Y-%m-%d")
    day = _date_to_day(target_date_str)

    # Counts
    total_subjects = await db["subjects"].count_documents({})
    total_teachers = await db["teachers"].count_documents({})
    total_rooms    = await db["rooms"].count_documents({})
    total_scheduled_classes = await db["schedule"].count_documents({"isEvent": False})

    classes_today = 0
    events_today  = 0
    if day:
        all_entries = await db["schedule"].find({"day": day}, {"_id": 0}).to_list(None)
        classes_today = sum(1 for e in all_entries if not e.get("isEvent"))
        events_today  = sum(1 for e in all_entries if e.get("isEvent"))

    all_rooms = await db["rooms"].find({}, {"_id": 0}).to_list(None)
    if day:
        booked = await db["schedule"].find(
            {"day": day, "period": 1}, {"_id": 0, "roomId": 1}
        ).to_list(None)
        occupied = {b["roomId"] for b in booked}
        free_rooms = sum(1 for r in all_rooms if r["id"] not in occupied)
        room_utilization_pct = round(((len(all_rooms) - free_rooms) / len(all_rooms) * 100), 1) if all_rooms else 0
    else:
        free_rooms = len(all_rooms)
        room_utilization_pct = 0.0

    pending = await db["events"].count_documents({"status": "PENDING"})
    conflicts = await _detect_conflicts(db)

    # Preference lock stats
    students_total = await db["users"].count_documents({"role": "student"})
    students_locked = await db["users"].count_documents({"role": "student", "preferenceLocked": True})

    return {
        "date":                  target_date_str,
        "day":                   day or "Weekend",
        "totalSubjects":         total_subjects,
        "totalTeachers":         total_teachers,
        "totalRooms":            total_rooms,
        "totalScheduledClasses": total_scheduled_classes,
        "classes":               classes_today,
        "events":                events_today,
        "freeRooms":             free_rooms,
        "roomUtilizationPct":    room_utilization_pct,
        "pendingRequests":       pending,
        "conflicts":             len(conflicts),
        "preferenceLockStatus":  f"{students_locked}/{students_total} Students Locked",
    }


@router.get("/conflicts")
async def get_conflicts():
    """Re-scan the entire schedule for double-bookings."""
    db = get_db()
    conflicts = await _detect_conflicts(db)
    return {"conflicts": conflicts, "count": len(conflicts)}


@router.get("/timetable/month")
async def get_month_timetable(month: Optional[str] = Query(None)):
    """
    Return per-day class counts for a calendar month.
    """
    db = get_db()

    target = datetime.today()
    if month:
        try:
            target = datetime.strptime(month, "%Y-%m")
        except Exception:
            pass

    year  = target.year
    m     = target.month
    _, num_days = calendar.monthrange(year, m)

    result = {}
    for day_num in range(1, num_days + 1):
        d      = date(year, m, day_num)
        idx    = d.weekday()
        if idx >= len(DAYS):
            result[str(d)] = {"classes": 0, "events": 0, "isWeekend": True}
            continue

        day_name = DAYS[idx]
        entries  = await db["schedule"].find({"day": day_name}, {"_id": 0}).to_list(None)
        result[str(d)] = {
            "classes":   sum(1 for e in entries if not e.get("isEvent")),
            "events":    sum(1 for e in entries if e.get("isEvent")),
            "isWeekend": False,
        }

    return {"month": f"{year}-{m:02d}", "days": result}


# ─── Internal: conflict detection ─────────────────────────────────────────────

async def _detect_conflicts(db) -> list:
    """Scan schedule for teacher/room/batch double-bookings. Returns conflict list."""
    entries = await db["schedule"].find({}, {"_id": 0}).to_list(None)

    from collections import defaultdict
    slots: dict = defaultdict(list)
    for e in entries:
        key = (e["day"], e["period"])
        slots[key].append(e)

    conflicts = []
    for (day, period), group in slots.items():
        seen_teachers = {}
        seen_rooms    = {}
        seen_batches  = {}
        for e in group:
            tid = e.get("teacherId", "")
            rid = e.get("roomId",    "")
            bid = e.get("batchId",   "")

            if tid and tid in seen_teachers and not e.get("isEvent"):
                conflicts.append({
                    "type":      "TEACHER_CLASH",
                    "day":       day,
                    "period":    period,
                    "teacherId": tid,
                })
            if tid:
                seen_teachers[tid] = True

            if rid in seen_rooms:
                conflicts.append({
                    "type":   "ROOM_CLASH",
                    "day":    day,
                    "period": period,
                    "roomId": rid,
                })
            seen_rooms[rid] = True

            if bid != "event" and bid in seen_batches:
                conflicts.append({
                    "type":      "BATCH_CLASH",
                    "day":       day,
                    "period":    period,
                    "batchId":   bid,
                })
            if bid:
                seen_batches[bid] = True

    return conflicts
