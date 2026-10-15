import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
import random
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import connect_db, close_db, get_db
from csp.engine import run_csp

load_dotenv()

async def main():
    await connect_db()
    db = get_db()

    subjects = await db["subjects"].find({}, {"_id": 0}).to_list(None)
    batches  = await db["batches"].find({},  {"_id": 0}).to_list(None)
    rooms    = await db["rooms"].find({},    {"_id": 0}).to_list(None)

    random.seed(7)
    entries, conflicts = run_csp(batches, subjects, rooms)

    await db["schedule"].delete_many({"isEvent": False})
    res = await db["schedule"].insert_many(entries)

    print(f"[SUCCESS] Populated schedule collection with {len(res.inserted_ids)} entries.")
    print(f"Conflicts: {len(conflicts)}")
    await close_db()

if __name__ == "__main__":
    asyncio.run(main())
