"""
routes/events.py
─────────────────────────────────────────────────────────────────────────────
POST /events/request       — create event request (status: PENDING)
GET  /events/requests      — list requests, optional ?status= filter
GET  /events/requests/{id} — single request detail
─────────────────────────────────────────────────────────────────────────────
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from db import get_db
from models import EventRequestCreate
from routes.auth import require_role

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/request")
async def create_event_request(
    payload: EventRequestCreate,
    current_user: dict = Depends(require_role(["faculty", "admin"])),
):
    db = get_db()

    # Change 4: Server-side safety net check for weekend dates
    try:
        req_date = datetime.strptime(payload.date, "%Y-%m-%d")
        if req_date.weekday() >= 5:  # 5 = Saturday, 6 = Sunday
            raise HTTPException(
                status_code=400,
                detail="Events cannot be requested for weekends."
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    # Auto-generate an id
    count = await db["events"].count_documents({})
    new_id = f"evt_{count + 100:03d}"

    doc = payload.model_dump()
    doc["id"]              = new_id
    doc["status"]          = "PENDING"
    doc["assignedRoomId"]  = payload.assignedRoomId  # Change 5: Teacher-selected room
    doc["rejectionReason"] = None
    doc["createdAt"]       = datetime.utcnow()

    await db["events"].insert_one(doc)
    doc.pop("_id", None)

    return {"success": True, "event": doc}


@router.get("/requests")
async def list_event_requests(status: Optional[str] = Query(None)):
    db = get_db()
    query = {}
    if status:
        query["status"] = status.upper()

    events = await db["events"].find(query, {"_id": 0}).to_list(None)
    events.sort(key=lambda e: e.get("createdAt") or datetime.min, reverse=True)
    return {"requests": events, "count": len(events)}


@router.get("/requests/{event_id}")
async def get_event_request(event_id: str):
    db = get_db()
    event = await db["events"].find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")
    return event
