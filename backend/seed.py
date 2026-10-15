"""
seed.py — Populates MongoDB with baseline data:
  subjects, teachers (3–4 per subject with availability & workload info),
  batches (non-uniform per teacher), rooms, pending event requests,
  1 pre-approved event, demo users (admin, students, faculty), and MongoDB indexes.
Run once: python seed.py
"""
import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import bcrypt

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "timetable_db")

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

random.seed(42)


# ─────────────────────────────────────────────────────────────────────────────
# SUBJECTS
# ─────────────────────────────────────────────────────────────────────────────
SUBJECTS = [
    {
        "id": "sub_lowcode",
        "name": "Low Code",
        "theoryPeriodsPerWeek": 3,
        "labPeriodsPerWeek": 2,
        "totalPeriodsPerWeek": 5,
        "requiresLab": True,
    },
    {
        "id": "sub_toc",
        "name": "Theory of Computation",
        "theoryPeriodsPerWeek": 4,
        "labPeriodsPerWeek": 0,
        "totalPeriodsPerWeek": 4,
        "requiresLab": False,
    },
    {
        "id": "sub_mc",
        "name": "Mobile Computing",
        "theoryPeriodsPerWeek": 3,
        "labPeriodsPerWeek": 0,
        "totalPeriodsPerWeek": 3,
        "requiresLab": False,
    },
    {
        "id": "sub_wp",
        "name": "Web Programming",
        "theoryPeriodsPerWeek": 3,
        "labPeriodsPerWeek": 4,
        "totalPeriodsPerWeek": 7,
        "requiresLab": True,
    },
    {
        "id": "sub_cn",
        "name": "Computer Networks",
        "theoryPeriodsPerWeek": 2,
        "labPeriodsPerWeek": 4,
        "totalPeriodsPerWeek": 6,
        "requiresLab": True,
    },
    {
        "id": "sub_foai",
        "name": "Foundation of AI",
        "theoryPeriodsPerWeek": 2,
        "labPeriodsPerWeek": 2,
        "totalPeriodsPerWeek": 4,
        "requiresLab": True,
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# TEACHERS — Expanded to 3–4 teachers per subject (Requirement 3)
# ─────────────────────────────────────────────────────────────────────────────
TEACHER_NAMES_BY_SUBJECT = {
    "sub_lowcode": [
        "Dr. Priya Nair",
        "Prof. Karthik Menon",
        "Dr. Sanjay Verma",
        "Prof. Ritu Saxena",
    ],
    "sub_toc": [
        "Dr. Ananya Sharma",
        "Prof. Rajesh Kumar",
        "Dr. Amit Shah",
        "Prof. Neha Gupta",
    ],
    "sub_mc": [
        "Dr. Sunita Iyer",
        "Prof. Vikram Bhat",
        "Dr. Rahul Rao",
        "Prof. Pooja Hegde",
    ],
    "sub_wp": [
        "Dr. Meera Pillai",
        "Prof. Arun Desai",
        "Dr. Siddharth Malhotra",
        "Prof. Swati Joshi",
    ],
    "sub_cn": [
        "Dr. Kavitha Reddy",
        "Prof. Suresh Nambiar",
        "Dr. Alok Tripathi",
        "Prof. Maya Fernandez",
    ],
    "sub_foai": [
        "Dr. Deepa Krishnamurthy",
        "Prof. Naveen Joshi",
        "Dr. Rohan Kulkarni",
        "Prof. Divya Menon",
    ],
}


def build_teachers():
    teachers = []
    for sub_id, names in TEACHER_NAMES_BY_SUBJECT.items():
        for idx, name in enumerate(names):
            tid = f"t_{sub_id}_{idx+1}"
            teachers.append({
                "id": tid,
                "name": name,
                "subjectId": sub_id,
                "availability": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                "maxWeeklyHours": 18,
            })
    return teachers


# ─────────────────────────────────────────────────────────────────────────────
# BATCHES — Explicit, Non-Uniform Per Teacher
# ─────────────────────────────────────────────────────────────────────────────
REALISTIC_COUNTS = [38, 41, 45, 47, 48, 52, 55, 58, 59, 61, 63, 65]

BATCH_CONFIG_PER_TEACHER = {
    # Low Code
    "t_sub_lowcode_1": ["A"],
    "t_sub_lowcode_2": ["B"],
    "t_sub_lowcode_3": ["C"],
    "t_sub_lowcode_4": ["D"],
    # TOC
    "t_sub_toc_1": ["A"],
    "t_sub_toc_2": ["B"],
    "t_sub_toc_3": ["C"],
    "t_sub_toc_4": ["D"],
    # Mobile Computing
    "t_sub_mc_1": ["A"],
    "t_sub_mc_2": ["B"],
    "t_sub_mc_3": ["C"],
    "t_sub_mc_4": ["D"],
    # Web Programming
    "t_sub_wp_1": ["A"],
    "t_sub_wp_2": ["B"],
    "t_sub_wp_3": ["C"],
    "t_sub_wp_4": ["D"],
    # Computer Networks
    "t_sub_cn_1": ["A"],
    "t_sub_cn_2": ["B"],
    "t_sub_cn_3": ["C"],
    "t_sub_cn_4": ["D"],
    # Foundation of AI
    "t_sub_foai_1": ["A"],
    "t_sub_foai_2": ["B"],
    "t_sub_foai_3": ["C"],
    "t_sub_foai_4": ["D"],
}

SUBJECT_SHORT = {
    "sub_lowcode": "LC",
    "sub_toc":     "TC",
    "sub_mc":      "MC",
    "sub_wp":      "WP",
    "sub_cn":      "CN",
    "sub_foai":    "AI",
}


def build_batches(teachers):
    batches = []
    for teacher in teachers:
        tid    = teacher["id"]
        sub_id = teacher["subjectId"]
        short  = SUBJECT_SHORT[sub_id]
        letters = BATCH_CONFIG_PER_TEACHER.get(tid, ["A"])

        for letter in letters:
            bid  = f"batch_{sub_id}_{letter}"
            name = f"{short}-{letter}"
            count = random.choice(REALISTIC_COUNTS)
            batches.append({
                "id":                  bid,
                "name":                name,
                "subjectId":           sub_id,
                "teacherId":           tid,
                "preferredTeacherId":  tid,
                "preferredRoomBlock":  "A" if letter in ["A", "B"] else "B",
                "studentCount":        count,
            })
    return batches


# ─────────────────────────────────────────────────────────────────────────────
# ROOMS
# ─────────────────────────────────────────────────────────────────────────────
A_SMALL_CAPS  = [52, 58, 63, 68, 74, 80, 85, 90, 95]
B_CAPS        = [48, 55, 60, 65, 70, 75, 82, 88]
TL_CAPS       = [35, 40, 45, 50, 55, 60]
IF_CAPS       = [35, 40, 45, 50, 55, 60]


def _eboard(pct=0.80):
    return random.random() < pct


def build_rooms():
    rooms = []
    fixed_large_classrooms = {"A101", "A102", "A103", "A104", "A201", "A202"}
    labs_a2                = {"A203", "A204"}

    for floor in range(1, 5):
        for num in range(1, 11):
            rid = f"A{floor}{num:02d}"
            if rid in fixed_large_classrooms:
                cap   = 200
                rtype = "classroom"
            elif rid in labs_a2:
                cap   = 120
                rtype = "lab"
            else:
                cap   = random.choice(A_SMALL_CAPS)
                rtype = "classroom"
            rooms.append({
                "id": rid, "block": "A", "roomType": rtype, "capacity": cap, "hasEboard": _eboard()
            })

    for floor in range(1, 5):
        for num in range(1, 11):
            rid = f"B{floor}{num:02d}"
            rooms.append({
                "id": rid, "block": "B", "roomType": "classroom", "capacity": random.choice(B_CAPS), "hasEboard": _eboard()
            })

    for i in range(1, 10):
        rooms.append({
            "id": f"TL{i}", "block": "Techlounge", "roomType": "lab", "capacity": random.choice(TL_CAPS), "hasEboard": _eboard()
        })

    for i in range(1, 6):
        rooms.append({
            "id": f"IF{i}", "block": "Ideafactory", "roomType": "lab", "capacity": random.choice(IF_CAPS), "hasEboard": _eboard()
        })

    return rooms


# ─────────────────────────────────────────────────────────────────────────────
# EVENT REQUESTS
# ─────────────────────────────────────────────────────────────────────────────
def build_event_requests():
    today = datetime.today()

    def future_weekday(days):
        d = today + timedelta(days=days)
        while d.weekday() >= 5:
            d += timedelta(days=1)
        return d.strftime("%Y-%m-%d")

    pending = [
        {
            "id": "evt_001",
            "title": "National Symposium on AI & Society",
            "description": "A full-day academic symposium inviting speakers from industry.",
            "requestedBy": "Dr. Deepa Krishnamurthy",
            "date": future_weekday(7),
            "startPeriod": 1,
            "endPeriod": 6,
            "expectedParticipants": 180,
            "block": "A",
            "requiresLab": False,
            "requiresEboard": True,
            "status": "PENDING",
            "assignedRoomId": "A101",
            "rejectionReason": None,
            "createdAt": datetime.utcnow(),
        },
        {
            "id": "evt_002",
            "title": "Hands-On Workshop: Full-Stack Web Development",
            "description": "Practical workshop covering React and FastAPI.",
            "requestedBy": "Prof. Arun Desai",
            "date": future_weekday(10),
            "startPeriod": 2,
            "endPeriod": 4,
            "expectedParticipants": 35,
            "block": "Techlounge",
            "requiresLab": True,
            "requiresEboard": True,
            "status": "PENDING",
            "assignedRoomId": "TL1",
            "rejectionReason": None,
            "createdAt": datetime.utcnow(),
        },
        {
            "id": "evt_003",
            "title": "Seminar: Industry Trends in Computer Networks",
            "description": "Invited seminar by Cisco network engineers.",
            "requestedBy": "Dr. Kavitha Reddy",
            "date": future_weekday(14),
            "startPeriod": 3,
            "endPeriod": 5,
            "expectedParticipants": 75,
            "block": "B",
            "requiresLab": False,
            "requiresEboard": True,
            "status": "PENDING",
            "assignedRoomId": "B101",
            "rejectionReason": None,
            "createdAt": datetime.utcnow(),
        },
    ]
    return pending


def build_pre_approved_event():
    today = datetime.today()
    next_mon = today + timedelta(days=(7 - today.weekday()))
    event_date = next_mon.strftime("%Y-%m-%d")

    event_request = {
        "id": "evt_000",
        "title": "Orientation: Cloud Computing Bootcamp",
        "description": "Pre-approved orientation session for final-year students.",
        "requestedBy": "Prof. Naveen Joshi",
        "date": event_date,
        "startPeriod": 1,
        "endPeriod": 2,
        "expectedParticipants": 60,
        "block": "A",
        "requiresLab": False,
        "requiresEboard": True,
        "status": "APPROVED",
        "assignedRoomId": "A201",
        "rejectionReason": None,
        "createdAt": datetime.utcnow(),
    }

    schedule_entry = {
        "id": "sch_evt_000",
        "batchId":     "event",
        "teacherId":   "t_sub_foai_2",
        "subjectId":   "sub_foai",
        "roomId":      "A201",
        "day":         "Mon",
        "period":      1,
        "sessionType": "theory",
        "isEvent":     True,
        "eventId":     "evt_000",
        "startTime":   "09:00",
        "endTime":     "09:50",
        "durationMinutes": 50,
        "slotLabel":   "09:00 – 09:50",
        "constraintExplanation": "Pre-approved administrative event booking.",
    }
    return event_request, schedule_entry


# ─────────────────────────────────────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────────────────────────────────────
def build_users():
    return [
        {
            "id": "usr_admin",
            "email": "admin@college.edu",
            "name": "System Administrator",
            "role": "admin",
            "passwordHash": hash_pw("admin123"),
            "preferenceLocked": False,
            "preferences": {},
            "createdAt": datetime.utcnow(),
        },
        {
            "id": "usr_student1",
            "email": "student@college.edu",
            "name": "Aarav Sharma (Student)",
            "role": "student",
            "passwordHash": hash_pw("student123"),
            "preferenceLocked": True,
            "preferences": {
                "sub_lowcode": "batch_sub_lowcode_A",
                "sub_toc":     "batch_sub_toc_A",
                "sub_mc":      "batch_sub_mc_A",
                "sub_wp":      "batch_sub_wp_A",
                "sub_cn":      "batch_sub_cn_A",
                "sub_foai":    "batch_sub_foai_A",
            },
            "createdAt": datetime.utcnow(),
        },
        {
            "id": "usr_student2",
            "email": "student2@college.edu",
            "name": "Diya Patel (Student)",
            "role": "student",
            "passwordHash": hash_pw("student123"),
            "preferenceLocked": False,
            "preferences": {},
            "createdAt": datetime.utcnow(),
        },
        {
            "id": "usr_faculty1",
            "email": "priya.nair@college.edu",
            "name": "Dr. Priya Nair",
            "role": "faculty",
            "teacherId": "t_sub_lowcode_1",
            "passwordHash": hash_pw("faculty123"),
            "preferenceLocked": False,
            "preferences": {},
            "createdAt": datetime.utcnow(),
        },
        {
            "id": "usr_faculty2",
            "email": "deepa.k@college.edu",
            "name": "Dr. Deepa Krishnamurthy",
            "role": "faculty",
            "teacherId": "t_sub_foai_1",
            "passwordHash": hash_pw("faculty123"),
            "preferenceLocked": False,
            "preferences": {},
            "createdAt": datetime.utcnow(),
        },
    ]


# ─────────────────────────────────────────────────────────────────────────────
# MAIN SEED & INDEXES
# ─────────────────────────────────────────────────────────────────────────────
async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]

    for col in ["subjects", "teachers", "batches", "rooms", "events", "schedule", "users"]:
        await db[col].drop()
        print(f"  Dropped collection: {col}")

    # Subjects
    await db["subjects"].insert_many(SUBJECTS)
    print(f"  Inserted {len(SUBJECTS)} subjects")

    # Teachers
    teachers = build_teachers()
    await db["teachers"].insert_many(teachers)
    print(f"  Inserted {len(teachers)} teachers (4 per subject)")

    # Batches
    batches = build_batches(teachers)
    await db["batches"].insert_many(batches)
    print(f"  Inserted {len(batches)} batches")

    # Rooms
    rooms = build_rooms()
    await db["rooms"].insert_many(rooms)
    print(f"  Inserted {len(rooms)} rooms")

    # Events
    events = build_event_requests()
    pre_approved, pre_schedule = build_pre_approved_event()
    events.append(pre_approved)
    await db["events"].insert_many(events)
    print(f"  Inserted {len(events)} event requests")

    # Pre-approved schedule entry
    await db["schedule"].insert_one(pre_schedule)

    # Users
    users = build_users()
    await db["users"].insert_many(users)
    print(f"  Inserted {len(users)} demo users")

    # Indexes (Requirement 13)
    await db["schedule"].create_index([("teacherId", 1), ("day", 1), ("period", 1)])
    await db["schedule"].create_index([("roomId", 1), ("day", 1), ("period", 1)])
    await db["schedule"].create_index([("batchId", 1), ("day", 1), ("period", 1)])
    print("  Created MongoDB compound indexes on schedule collection")

    client.close()
    print("\n[SUCCESS] Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
