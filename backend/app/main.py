from __future__ import annotations

import re
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.api.routes_health        import router as health_router
from app.api.routes_hives         import router as hives_router
from app.api.routes_webhooks      import router as webhooks_router
from app.core.settings            import settings
from app.db.engine                import create_db_and_tables
from app.api.routes_auth          import router as auth_router
from app.api.routes_notifications import router as notifications_router
from app.api.routes_alert_stats   import router as alert_stats_router
from app.api.routes_apiculteurs   import router as apiculteurs_router
from app.api.routes_support       import router as support_router


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


# ── CORS ──────────────────────────────────────────────────────────────────────
# Vercel creates a new preview URL on every deployment (e.g. ibee-software-abc123.vercel.app)
# We can't list all of them in ALLOWED_ORIGINS, so we use a custom middleware
# that dynamically checks the Origin header against:
#   1. The explicit list in settings.allowed_origins
#   2. Any *.vercel.app subdomain (when ALLOW_VERCEL_PREVIEWS=true on Railway)

# Regex matching any Vercel preview or production URL for your project
VERCEL_PREVIEW_RE = re.compile(r"^https://ibee-software(-[a-z0-9]+)*\.vercel\.app$")


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        origin = request.headers.get("origin", "")

        # Check if this origin is allowed
        allowed = (
            origin in settings.allowed_origins
            or (
                settings.allow_vercel_previews
                and VERCEL_PREVIEW_RE.match(origin)
            )
        )

        # Handle preflight OPTIONS request
        if request.method == "OPTIONS" and allowed:
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin"     : origin,
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods"    : "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers"    : "Authorization, Content-Type, Accept",
                    "Access-Control-Max-Age"          : "600",
                },
            )

        response = await call_next(request)

        if allowed:
            response.headers["Access-Control-Allow-Origin"]      = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"]     = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"]     = "Authorization, Content-Type, Accept"

        return response


app.add_middleware(DynamicCORSMiddleware)


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