from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_health import router as health_router
from app.api.routes_hives import router as hives_router
from app.api.routes_webhooks import router as webhooks_router
from app.core.settings import settings
from app.db.engine import create_db_and_tables


app = FastAPI(title="IBEE Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


app.include_router(health_router, tags=["health"])
app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
app.include_router(hives_router, prefix="/api", tags=["api"])


@app.get("/")
def root() -> dict:
    return {"name": app.title, "env": settings.env}

