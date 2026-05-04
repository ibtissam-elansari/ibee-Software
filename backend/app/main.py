from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_health        import router as health_router
from app.api.routes_hives         import router as hives_router
from app.api.routes_webhooks      import router as webhooks_router
from app.core.settings            import settings
from app.db.engine                import create_db_and_tables
from app.api.routes_auth          import router as auth_router
from app.api.routes_notifications import router as notifications_router
from app.api.routes_alert_stats   import router as alert_stats_router
from app.api.routes_apiculteurs   import router as apiculteurs_router  
from app.api.routes_support import router as support_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield

app = FastAPI(
    title       = "IBEE Backend",
    description = "Connected hive monitoring — LoRaWAN IoT backend",
    version     = "0.2.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(webhooks_router,      prefix="/webhooks", tags=["webhooks"])
app.include_router(hives_router,         prefix="/api",      tags=["api"])
app.include_router(auth_router,          prefix="/auth",     tags=["auth"])
app.include_router(notifications_router, prefix="/api",      tags=["notifications"])
app.include_router(alert_stats_router,   prefix="/api",      tags=["alert-stats"])
app.include_router(apiculteurs_router,   prefix="/api",      tags=["apiculteurs"])
app.include_router(support_router,       prefix="/api",      tags=["support"])

@app.get("/", tags=["root"])
async def root() -> dict:
    return {"name": app.title, "version": app.version, "env": settings.env}