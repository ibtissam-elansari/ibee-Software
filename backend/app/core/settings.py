from pydantic import BaseModel
import os


class Settings(BaseModel):
    env: str = os.getenv("ENV", "local")
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg://ibee:ibee@localhost:5432/ibee"
    )


settings = Settings()

