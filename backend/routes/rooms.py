"""
routes/rooms.py
─────────────────────────────────────────────────────────────────────────────
GET /rooms/free?date=&time=&block=
GET /rooms/suitable?capacity=&type=&eboard=&block=  (Change 5: Returns ALL filtered suitable rooms)
GET /rooms/all
─────────────────────────────────────────────────────────────────────────────
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Query
from db import get_db
from services.room_allocation import rank_suitable_rooms

router = APIRouter(prefix="/rooms", tags=["rooms"])

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]


def _date_to_day(date_str: Optional[str]) -> Optional[str]:
    """Convert ISO date string to day abbreviation (Mon-Fri)."""
    if not date_str:
        return None
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        idx = d.weekday()
        if idx >= 5:
            return None   # weekend
        return DAYS[idx]
    except Exception:
        return None


@router.get("/suitable")
async def get_suitable_rooms(
    capacity: int = Query(1, description="Required capacity"),
    room_type: Optional[str] = Query(None, alias="type", description="classroom or lab"),
    eboard: Optional[bool] = Query(None, description="Require smart e-board"),
    block: Optional[str] = Query(None, description="Preferred block"),
):
    """
    Returns ALL rooms matching capacity, type, eboard, and block constraints,
    ranked by tightest capacity fit first. Used in Event Request form.
    """
    db = get_db()
    all_rooms = await db["rooms"].find({}, {"_id": 0}).to_list(None)

    ranked = rank_suitable_rooms(
        rooms=all_rooms,
        required_capacity=capacity,
        required_type=room_type,
        required_eboard=eboard if eboard else None,
        block=block if block else None,
    )

    # If block specified but returned 0, retry without block restriction to give options
    if not ranked and block:
        ranked = rank_suitable_rooms(
            rooms=all_rooms,
            required_capacity=capacity,
            required_type=room_type,
            required_eboard=eboard if eboard else None,
        )

    return {"rooms": ranked, "count": len(ranked)}


@router.get("/free")
async def get_free_rooms(
    date:  Optional[str] = Query(None, description="ISO date YYYY-MM-DD"),
    time:  Optional[str] = Query(None, description="Period number 1-6"),
    block: Optional[str] = Query(None, description="Block name: A, B, Techlounge, Ideafactory"),
):
    """Return rooms that have no scheduled session at the given date/time/block."""
    db = get_db()

    all_rooms = await db["rooms"].find({}, {"_id": 0}).to_list(None)

    # Determine occupied rooms at this slot
    occupied_ids = set()
    if date and time:
        day = _date_to_day(date)
        if day:
            period = int(time)
            booked = await db["schedule"].find(
                {"day": day, "period": period}, {"_id": 0, "roomId": 1}
            ).to_list(None)
            occupied_ids = {b["roomId"] for b in booked}

    # Filter free rooms
    free_rooms = [r for r in all_rooms if r["id"] not in occupied_ids]

    # Apply block filter if requested
    if block:
        free_rooms = [r for r in free_rooms if r.get("block") == block]

    # Sort by capacity descending (most capacity first for discovery)
    free_rooms.sort(key=lambda r: r["capacity"], reverse=True)

    return {
        "date": date,
        "period": time,
        "block": block,
        "freeRooms": free_rooms,
        "count": len(free_rooms),
    }


@router.get("/all")
async def get_all_rooms(block: Optional[str] = Query(None)):
    """Return all rooms, optionally filtered by block."""
    db = get_db()
    query = {}
    if block:
        query["block"] = block
    rooms = await db["rooms"].find(query, {"_id": 0}).to_list(None)
    return {"rooms": rooms, "count": len(rooms)}


@router.get("/{room_id}")
async def get_room_details(room_id: str):
    """Return a single room's details."""
    db = get_db()
    room = await db["rooms"].find_one({"id": room_id}, {"_id": 0})
    if not room:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found.")
    return room
