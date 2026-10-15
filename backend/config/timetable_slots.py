"""
config/timetable_slots.py
─────────────────────────────────────────────────────────────────────────────
Centralized timetable slot configuration.

Theory sessions = 50 minutes each.
Lab sessions    = 100 minutes (double period).

The schedule runs Mon–Sat with 6 theory-length slots per day.
Each slot has a fixed start / end time used across the entire application.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, TypedDict


class SlotInfo(TypedDict):
    period: int
    startTime: str     # "HH:MM" 24-hour
    endTime: str       # "HH:MM" 24-hour
    label: str         # human-readable label, e.g. "09:00 – 09:50"
    durationMinutes: int


# ─── Slot definitions ─────────────────────────────────────────────────────────
# 6 periods per day, each 50 minutes, with a lunch break before period 5.
# The college day starts at 08:00; all sessions finish before 17:00.

TIMETABLE_SLOTS: Dict[int, SlotInfo] = {
    1: {"period": 1, "startTime": "08:00", "endTime": "08:50", "label": "08:00 – 08:50", "durationMinutes": 50},
    2: {"period": 2, "startTime": "09:00", "endTime": "09:50", "label": "09:00 – 09:50", "durationMinutes": 50},
    3: {"period": 3, "startTime": "10:00", "endTime": "10:50", "label": "10:00 – 10:50", "durationMinutes": 50},
    4: {"period": 4, "startTime": "11:00", "endTime": "11:50", "label": "11:00 – 11:50", "durationMinutes": 50},
    5: {"period": 5, "startTime": "13:00", "endTime": "13:50", "label": "13:00 – 13:50", "durationMinutes": 50},
    6: {"period": 6, "startTime": "14:00", "endTime": "14:50", "label": "14:00 – 14:50", "durationMinutes": 50},
}

# Lab sessions span 2 consecutive periods → 100 minutes
LAB_DURATION_MINUTES = 100
THEORY_DURATION_MINUTES = 50

# Days of the week (Mon–Sat)
WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

# Allowed periods per day
ALL_PERIODS = [1, 2, 3, 4, 5, 6]

# A lab spans two instructional periods. Period 4 cannot pair with 5 across
# lunch, and period 6 has no following period within the college day.
LAB_START_PERIODS = [1, 2, 3, 5]


def get_slot_info(period: int) -> SlotInfo:
    """Return the SlotInfo for a given period number (1-6)."""
    return TIMETABLE_SLOTS.get(period, TIMETABLE_SLOTS[1])


def enrich_entry_with_times(entry: dict) -> dict:
    """
    Add startTime, endTime, durationMinutes, and slotLabel to a schedule entry dict.
    Mutates and returns the entry.
    """
    period = entry.get("period", 1)
    session_type = entry.get("sessionType", "theory")
    slot = get_slot_info(period)

    entry["startTime"] = slot["startTime"]
    entry["slotLabel"] = slot["label"]

    if session_type == "lab":
        # Labs use 2 consecutive periods; endTime = next period's end (or 100 min offset)
        next_period = period + 1
        next_slot = get_slot_info(min(next_period, 6))
        entry["endTime"] = next_slot["endTime"]
        entry["durationMinutes"] = LAB_DURATION_MINUTES
    else:
        entry["endTime"] = slot["endTime"]
        entry["durationMinutes"] = THEORY_DURATION_MINUTES

    return entry
