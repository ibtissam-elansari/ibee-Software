from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event, text
from sqlmodel import SQLModel

from app.core.settings import settings

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.env == "local",
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def create_db_and_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        # Ensure the partial index exists on SQLite (dev) — Postgres creates it
        # automatically via Index(..., postgresql_where=...) above, but SQLite
        # needs an explicit CREATE INDEX ... WHERE statement.
        dialect = conn.dialect.name
        if dialect == "sqlite":
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_hive_apiculteur_active "
                "ON hive (apiculteur_id) WHERE deleted_at IS NULL"
            ))


async def get_session():
    async with AsyncSessionLocal() as session:
        yield session