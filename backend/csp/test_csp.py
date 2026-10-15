"""
csp/test_csp.py
─────────────────────────────────────────────────────────────────────────────
Standalone script: loads seeded data from MongoDB, runs the CSP, and prints
the full timetable to console. Run BEFORE wiring into any API endpoint.

Usage:
    cd backend
    python -m csp.test_csp
─────────────────────────────────────────────────────────────────────────────
"""
import asyncio
import sys
import os

# Ensure parent package is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from csp.engine import run_csp, DAYS, PERIODS

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "timetable_db")


async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]

    subjects = await db["subjects"].find({}, {"_id": 0}).to_list(None)
    teachers = await db["teachers"].find({}, {"_id": 0}).to_list(None)
    batches  = await db["batches"].find({},  {"_id": 0}).to_list(None)
    rooms    = await db["rooms"].find({},    {"_id": 0}).to_list(None)
    client.close()

    if not batches:
        print("[ERROR] No data found — run `python seed.py` first.")
        return

    print(f"\n{'='*70}")
    print(f"  AI TIMETABLE CSP SOLVER — Standalone Test")
    print(f"{'='*70}")
    print(f"  Subjects: {len(subjects)}  Teachers: {len(teachers)}")
    print(f"  Batches:  {len(batches)}   Rooms: {len(rooms)}")
    print()

    import random
    random.seed(7)   # deterministic run for testing

    entries, conflicts = run_csp(batches, subjects, rooms)

    if not entries:
        print("[ERROR] CSP found NO solution.")
        for c in conflicts:
            print(f"  {c}")
        return

    if conflicts:
        print(f"\n[ERROR] {len(conflicts)} CONFLICTS DETECTED:")
        for c in conflicts:
            print(f"  {c}")
    else:
        print(f"\n[SUCCESS] No conflicts — {len(entries)} sessions scheduled cleanly.\n")

    # Build lookup maps
    subject_map = {s["id"]: s["name"] for s in subjects}
    teacher_map = {t["id"]: t["name"] for t in teachers}
    batch_map   = {b["id"]: b["name"] for b in batches}

    # Group by batch for display
    from collections import defaultdict
    by_batch = defaultdict(list)
    for e in entries:
        by_batch[e["batchId"]].append(e)

    for batch_id in sorted(by_batch.keys()):
        batch_name  = batch_map.get(batch_id, batch_id)
        sessions    = sorted(by_batch[batch_id], key=lambda x: (DAYS.index(x["day"]), x["period"]))

        sub_id      = sessions[0]["subjectId"]
        sub_name    = subject_map.get(sub_id, sub_id)
        teacher_id  = sessions[0]["teacherId"]
        teacher_name = teacher_map.get(teacher_id, teacher_id)

        print(f"\n  Batch: {batch_name:8s}  |  {sub_name:30s}  |  {teacher_name}")
        print(f"  {'Day':<5} {'Period':>6}  {'Room':<10}  {'Type'}")
        print(f"  {'-'*45}")
        for s in sessions:
            print(f"  {s['day']:<5} P{s['period']:>5}  {s['roomId']:<10}  {s['sessionType']}")

    # Verify daily break constraint for every batch across all days
    break_violations = 0
    for batch_id, sess_list in by_batch.items():
        for d in DAYS:
            count = sum(1 for s in sess_list if s["day"] == d)
            if count >= len(PERIODS):
                break_violations += 1
                print(f"  [VIOLATION] Batch {batch_id} has no break on {d} ({count}/{len(PERIODS)} periods)")

    print(f"\n{'='*70}")
    print(f"  Total sessions: {len(entries)}")
    print(f"  Conflicts:      {len(conflicts)}")
    print(f"  Break Check:    {'PASSED (All batches have >= 1 daily break)' if break_violations == 0 else f'FAILED ({break_violations} violations)'}")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    asyncio.run(main())
