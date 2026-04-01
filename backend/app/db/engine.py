from sqlmodel import Session, SQLModel, create_engine

from app.core.settings import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session

