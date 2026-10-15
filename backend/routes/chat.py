"""
routes/chat.py
─────────────────────────────────────────────────────────────────────────────
POST /chat
Flow:
  1. Gemini extracts intent + params (JSON)
  2. Backend runs real MongoDB query
  3. Gemini phrases a grounded natural-language answer
─────────────────────────────────────────────────────────────────────────────
"""
from datetime import datetime
from fastapi import APIRouter
from db import get_db
from models import ChatRequest, ChatResponse
from services.gemini_client import extract_intent, generate_answer

router = APIRouter(prefix="/chat", tags=["chat"])

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]


def _today_day() -> str:
    idx = datetime.today().weekday()
    return DAYS[idx] if idx < 5 else None


def _date_to_day(date_str: str):
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        idx = d.weekday()
        return DAYS[idx] if idx < 5 else None
    except Exception:
        return None


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    db       = get_db()
    question = payload.question

    intent_data = await extract_intent(question)
    intent      = intent_data.get("intent", "UNKNOWN")
    params      = intent_data.get("params", {})

    data = None

    # ── TODAY_TIMETABLE ────────────────────────────────────────────────────────
    if intent == "TODAY_TIMETABLE":
        day = _today_day()
        if day:
            entries  = await db["schedule"].find({"day": day}, {"_id": 0}).to_list(None)
            subjects = {s["id"]: s["name"] for s in await db["subjects"].find({}, {"_id": 0}).to_list(None)}
            teachers = {t["id"]: t["name"] for t in await db["teachers"].find({}, {"_id": 0}).to_list(None)}
            for e in entries:
                e["subjectName"] = subjects.get(e.get("subjectId"), "")
                e["teacherName"] = teachers.get(e.get("teacherId"), "")
            data = {"day": day, "entries": entries, "count": len(entries)}
        else:
            data = {"message": "Today is a weekend — no classes scheduled."}

    # ── FREE_ROOM ──────────────────────────────────────────────────────────────
    elif intent == "FREE_ROOM":
        raw_date  = params.get("date", "")
        raw_time  = params.get("time", "")
        block     = params.get("block")

        # Resolve "today" / "tomorrow"
        if "today" in raw_date.lower():
            day = _today_day()
        elif "tomorrow" in raw_date.lower():
            from datetime import timedelta
            tomorrow = datetime.today() + timedelta(days=1)
            day = DAYS[tomorrow.weekday()] if tomorrow.weekday() < 5 else None
        else:
            day = _date_to_day(raw_date)

        all_rooms = await db["rooms"].find({}, {"_id": 0}).to_list(None)
        busy = set()
        if day and raw_time:
            try:
                period = int(raw_time)
                booked = await db["schedule"].find(
                    {"day": day, "period": period}, {"_id": 0, "roomId": 1}
                ).to_list(None)
                busy = {b["roomId"] for b in booked}
            except Exception:
                pass

        free = [r for r in all_rooms if r["id"] not in busy]
        if block:
            free = [r for r in free if r.get("block") == block]
        data = {"freeRooms": free[:10], "totalFree": len(free)}

    # ── ROOM_DETAILS ───────────────────────────────────────────────────────────
    elif intent == "ROOM_DETAILS":
        room_id = params.get("roomId", "").strip()
        if room_id:
            room = await db["rooms"].find_one({"id": room_id}, {"_id": 0})
            data = room if room else {"message": f"No room found with id '{room_id}'."}
        else:
            data = {"message": "Could not identify which room you're asking about."}

    # ── CLASS_DETAILS ──────────────────────────────────────────────────────────
    elif intent == "CLASS_DETAILS":
        subject_name = params.get("subject", "")
        batch_name   = params.get("batch", "")
        query = {}
        if subject_name:
            sub = await db["subjects"].find_one(
                {"name": {"$regex": subject_name, "$options": "i"}}, {"_id": 0}
            )
            if sub:
                query["subjectId"] = sub["id"]
        if batch_name:
            batch = await db["batches"].find_one(
                {"name": {"$regex": batch_name, "$options": "i"}}, {"_id": 0}
            )
            if batch:
                query["batchId"] = batch["id"]

        if query:
            entries = await db["schedule"].find(query, {"_id": 0}).to_list(None)
            data    = {"entries": entries, "count": len(entries)}
        else:
            data = {"message": "Could not identify the class. Please provide more details."}

    # ── UNKNOWN ────────────────────────────────────────────────────────────────
    else:
        data = None

    answer = await generate_answer(question, data)
    return ChatResponse(answer=answer)
