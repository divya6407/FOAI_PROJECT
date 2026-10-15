"""
services/room_allocation.py
─────────────────────────────────────────────────────────────────────────────
Shared room ranking function used in:
  a) CSP domain filtering
  b) GET /rooms/free
  c) POST /admin/requests/{id}/approve
─────────────────────────────────────────────────────────────────────────────
"""
from typing import List, Optional, Dict


def rank_suitable_rooms(
    rooms: List[Dict],
    required_capacity: int,
    required_type: Optional[str] = None,      # "classroom" | "lab" | None
    required_eboard: Optional[bool] = None,   # True | None (None = don't filter)
    block: Optional[str] = None,              # "A" | "B" | "Techlounge" | etc.
) -> List[Dict]:
    """
    Filter and rank rooms by fit:
      1. capacity >= required_capacity
      2. roomType == required_type (if specified)
      3. hasEboard == True (if required_eboard is True)
      4. block match (if block is specified)
      5. Sort by (capacity - required_capacity) ascending (tightest fit first)
    Returns filtered, sorted list of room dicts.
    """
    filtered = []
    for room in rooms:
        # 1. Capacity
        if room["capacity"] < required_capacity:
            continue
        # 2. Room type
        if required_type and room["roomType"] != required_type:
            continue
        # 3. Eboard
        if required_eboard and not room.get("hasEboard", False):
            continue
        # 4. Block
        if block and room.get("block") != block:
            continue
        filtered.append(room)

    # Sort by how little space is wasted (ascending slack)
    filtered.sort(key=lambda r: r["capacity"] - required_capacity)
    return filtered
