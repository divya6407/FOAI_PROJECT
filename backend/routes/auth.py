"""
routes/auth.py
─────────────────────────────────────────────────────────────────────────────
JWT Authentication & Authorization, User Preferences, Admin Preference Reset
─────────────────────────────────────────────────────────────────────────────
"""
import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt

from db import get_db
from models import User, UserSignup, UserLogin, TokenResponse, StudentPreferenceSubmit

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-for-ai-timetable-project-2026")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer(auto_error=False)

router = APIRouter(tags=["auth"])


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def serialize_user(user_doc: dict) -> dict:
    if not user_doc:
        return None
    user_doc = dict(user_doc)
    user_doc.pop("_id", None)
    user_doc.pop("passwordHash", None)
    return user_doc


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    db = get_db()
    user = await db["users"].find_one({"id": user_id})
    if not user:
        from bson import ObjectId
        if ObjectId.is_valid(user_id):
            user = await db["users"].find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return serialize_user(user)


def require_role(roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {roles}",
            )
        return current_user
    return role_checker


# ─── Auth Endpoints ───────────────────────────────────────────────────────────

@router.post("/auth/signup", response_model=TokenResponse)
async def signup(payload: UserSignup):
    db = get_db()
    existing = await db["users"].find_one({"email": payload.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    count = await db["users"].count_documents({})
    user_id = f"usr_{count + 100:03d}"

    user_doc = {
        "id":               user_id,
        "email":            payload.email.lower().strip(),
        "name":             payload.name,
        "role":             payload.role,
        "teacherId":        payload.teacherId,
        "passwordHash":     hash_password(payload.password),
        "preferenceLocked": False,
        "preferences":      {},
        "createdAt":        datetime.utcnow(),
    }

    await db["users"].insert_one(user_doc)
    serialized = serialize_user(user_doc)
    token = create_access_token({"sub": user_id, "role": payload.role})
    return TokenResponse(access_token=token, user=serialized)


@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = get_db()
    user = await db["users"].find_one({"email": payload.email.lower().strip()})
    if not user or not verify_password(payload.password, user.get("passwordHash", "")):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    serialized = serialize_user(user)
    token = create_access_token({"sub": serialized["id"], "role": serialized["role"]})
    return TokenResponse(access_token=token, user=serialized)


@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


# ─── Preference Endpoints ──────────────────────────────────────────────────────

@router.post("/preferences/submit")
async def submit_preferences(
    payload: StudentPreferenceSubmit,
    current_user: dict = Depends(require_role(["student", "faculty"])),
):
    db = get_db()
    user_id = current_user["id"]

    db_user = await db["users"].find_one({"id": user_id})
    if db_user.get("preferenceLocked"):
        raise HTTPException(
            status_code=400,
            detail="Your preference is locked. Contact admin to change it."
        )

    await db["users"].update_one(
        {"id": user_id},
        {"$set": {
            "preferences":      payload.preferences,
            "preferenceLocked": True,
        }}
    )

    return {
        "success": True,
        "message": "Preferences locked and saved successfully.",
        "preferences": payload.preferences,
    }


@router.get("/preferences/my")
async def get_my_preferences(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db["users"].find_one({"id": current_user["id"]})
    return {
        "preferenceLocked": user.get("preferenceLocked", False),
        "preferences":      user.get("preferences", {}),
    }


# ─── Admin Preference Reset & User Management ───────────────────────────────

@router.post("/admin/users/{user_id}/reset-preference")
async def reset_user_preference(
    user_id: str,
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    user = await db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    await db["users"].update_one(
        {"id": user_id},
        {"$set": {"preferenceLocked": False}}
    )
    return {"success": True, "message": f"Preference lock reset for user {user_id}."}


@router.get("/admin/users")
async def list_users(current_user: dict = Depends(require_role(["admin"]))):
    db = get_db()
    users = await db["users"].find({}, {"_id": 0, "passwordHash": 0}).to_list(None)
    return {"users": users, "count": len(users)}
