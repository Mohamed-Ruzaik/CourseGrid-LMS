from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.routes import (
    analytics,
    announcements,
    approvals,
    assignments,
    auth,
    content,
    courses,
    system,
    users,
)
from app.core.config import settings
from app.db.base import Base
from app.db.database import engine
from app.models import User


def ensure_dev_schema() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    if "submissions" not in inspector.get_table_names():
        return
    submission_columns = {column["name"] for column in inspector.get_columns("submissions")}
    if "attempt_count" in submission_columns:
        return

    if engine.dialect.name == "postgresql":
        statement = "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1"
    else:
        statement = "ALTER TABLE submissions ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 1"

    with engine.begin() as connection:
        connection.execute(text(statement))


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        ensure_dev_schema()
    except Exception:
        # /ready reports database availability; auth routes require the database.
        pass
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="CourseGrid LMS backend scaffold",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(announcements.router)
app.include_router(approvals.router)
app.include_router(assignments.router)
app.include_router(content.router)
app.include_router(courses.router)
app.include_router(system.router)
app.include_router(users.router)
