# main.py
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_health   import router as health_router
from app.api.routes_hives    import router as hives_router
from app.api.routes_webhooks import router as webhooks_router
from app.core.settings       import settings
from app.db.engine           import create_db_and_tables
from app.api.routes_auth import router as auth_router
from app.api.routes_notifications import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_db_and_tables()
    yield
    # Shutdown — nothing to clean up for now


app = FastAPI(
    title       = "IBEE Backend",
    description = "Connected hive monitoring — LoRaWAN IoT backend",
    version     = "0.2.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",   # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",   # CRA dev server (if used)
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(health_router)
app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
app.include_router(hives_router,    prefix="/api",      tags=["api"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(notifications_router, prefix="/notifs", tags=['notifs'])


@app.get("/", tags=["root"])
async def root() -> dict:
    return {"name": app.title, "version": app.version, "env": settings.env}