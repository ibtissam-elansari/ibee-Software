from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_alert_stats        import router as alert_stats_router
from app.api.routes_apiculteurs        import router as apiculteurs_router
from app.api.routes_auth               import router as auth_router
from app.api.routes_health             import router as health_router
from app.api.routes_hives              import router as hives_router
from app.api.routes_notifications      import router as notifications_router
from app.api.routes_support            import router as support_router
from app.api.routes_threshold_profiles import router as threshold_profiles_router
from app.api.routes_webhooks           import router as webhooks_router
from app.core.settings                 import settings
from app.db.engine                     import create_db_and_tables
from app.ai.predict                    import warm_up

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    await create_db_and_tables()
    warm_up()

    # ── Kafka consumer (primary ingestion path) ───────────────────────────────
    # Guarded by KAFKA_ENABLED so local dev without a Kafka stack still works.
    # The HTTP webhook route stays active regardless as a fallback.
    kafka_task = None
    if settings.kafka_enabled:
        from app.kafka.consumer import start_kafka_consumer
        kafka_task = asyncio.create_task(start_kafka_consumer())
        logger.info("Kafka consumer task created (brokers=%s, topic=%s)",
                    settings.kafka_brokers, settings.kafka_topic)
    else:
        logger.info("Kafka disabled (KAFKA_ENABLED=false) — webhook-only mode.")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    if kafka_task is not None:
        kafka_task.cancel()
        try:
            await kafka_task
        except asyncio.CancelledError:
            pass
        logger.info("Kafka consumer stopped.")


app = FastAPI(
    title       = "IBEE Backend",
    description = "Connected hive monitoring — LoRaWAN IoT backend",
    version     = "0.2.0",
    lifespan    = lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_origins=["*"] works fine with JWT (Authorization header).
# credentials=False is required when allow_origins=["*"].
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = False,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(health_router)
app.include_router(webhooks_router,             prefix="/webhooks",   tags=["webhooks"])
app.include_router(hives_router,                prefix="/api",        tags=["api"])
app.include_router(auth_router,                 prefix="/auth",       tags=["auth"])
app.include_router(notifications_router,        prefix="/api",        tags=["notifications"])
app.include_router(alert_stats_router,          prefix="/api",        tags=["alert-stats"])
app.include_router(apiculteurs_router,          prefix="/api",        tags=["apiculteurs"])
app.include_router(support_router,              prefix="/api",        tags=["support"])
app.include_router(threshold_profiles_router,   prefix="/api")


@app.get("/", tags=["root"])
async def root() -> dict:
    return {"name": app.title, "version": app.version, "env": settings.env}