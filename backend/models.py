from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Literal
from datetime import datetime, date


# ─── User & Auth ──────────────────────────────────────────────────────────────
class User(BaseModel):
    id: Optional[str] = None
    email: str
    name: str
    role: Literal["student", "faculty", "admin"]
    teacherId: Optional[str] = None       # If faculty, linked teacherId
    preferenceLocked: bool = False
    preferences: Optional[Dict[str, str]] = None  # { subjectId: batchId }
    createdAt: Optional[datetime] = None


class UserSignup(BaseModel):
    email: str
    password: str
    name: str
    role: Literal["student", "faculty", "admin"] = "student"
    teacherId: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


# ─── Subject ───────────────────────────────────────────────────────────────────
class Subject(BaseModel):
    id: str                       # e.g. "sub_lowcode"
    name: str
    theoryPeriodsPerWeek: int
    labPeriodsPerWeek: int        # each lab period = 2 hours = counted as 2 periods
    totalPeriodsPerWeek: int
    requiresLab: bool             # True if labPeriodsPerWeek > 0


# ─── Teacher ───────────────────────────────────────────────────────────────────
class Teacher(BaseModel):
    id: str
    name: str
    subjectId: str


# ─── Batch ─────────────────────────────────────────────────────────────────────
class Batch(BaseModel):
    id: str
    name: str                     # e.g. "LC-A"
    subjectId: str
    teacherId: str
    studentCount: int


# ─── Room ──────────────────────────────────────────────────────────────────────
class Room(BaseModel):
    id: str                       # e.g. "A101", "TL1"
    block: str                    # "A", "B", "Techlounge", "Ideafactory"
    roomType: Literal["classroom", "lab"]
    capacity: int
    hasEboard: bool


# ─── Schedule Entry ────────────────────────────────────────────────────────────
class ScheduleEntry(BaseModel):
    id: Optional[str] = None
    batchId: str
    teacherId: str
    subjectId: str
    roomId: str
    day: Literal["Mon", "Tue", "Wed", "Thu", "Fri"]
    period: int                   # 1-6
    sessionType: Literal["theory", "lab"]
    isEvent: bool = False
    eventId: Optional[str] = None


class ScheduleEntryDB(ScheduleEntry):
    """Same as ScheduleEntry but with Mongo _id serialized to id"""
    pass


# ─── Event Request ─────────────────────────────────────────────────────────────
class EventRequest(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    requestedBy: str              # faculty name or id
    date: str                     # ISO date string "YYYY-MM-DD"
    startPeriod: int
    endPeriod: int
    expectedParticipants: int
    block: Optional[str] = None   # preferred block
    requiresLab: bool = False
    requiresEboard: bool = False
    status: Literal["PENDING", "APPROVED", "REJECTED"] = "PENDING"
    assignedRoomId: Optional[str] = None
    rejectionReason: Optional[str] = None
    createdAt: Optional[datetime] = None


# ─── Request/Response schemas ──────────────────────────────────────────────────
class EventRequestCreate(BaseModel):
    title: str
    description: str
    requestedBy: str
    date: str
    startPeriod: int
    endPeriod: int
    expectedParticipants: int
    block: Optional[str] = None
    requiresLab: bool = False
    requiresEboard: bool = False
    assignedRoomId: str           # Explicit room selection chosen by teacher


class ApproveRequest(BaseModel):
    pass


class RejectRequest(BaseModel):
    reason: str


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


class StudentPreferenceItem(BaseModel):
    subjectId: str
    batchId: str                  # Selected batch matching chosen teacher


class StudentPreferenceSubmit(BaseModel):
    preferences: Dict[str, str]   # { subjectId: batchId }
