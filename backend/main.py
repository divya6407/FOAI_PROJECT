"""
main.py — FastAPI application entrypoint
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db import connect_db, close_db
from routes.auth      import router as auth_router
from routes.timetable import router as timetable_router
from routes.rooms      import router as rooms_router
from routes.events     import router as events_router
from routes.admin      import router as admin_router
from routes.chat       import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="AI College Timetable & Resource Scheduler",
    description="CSP-based timetable generation with room allocation and AI chat.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React dev server on localhost or 127.0.0.1 across all ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(timetable_router)
app.include_router(rooms_router)
app.include_router(events_router)
app.include_router(admin_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "message": "AI College Timetable & Resource Scheduler API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
