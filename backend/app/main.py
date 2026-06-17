from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    analytics,
    announcements,
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


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        Base.metadata.create_all(bind=engine)
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
app.include_router(assignments.router)
app.include_router(content.router)
app.include_router(courses.router)
app.include_router(system.router)
app.include_router(users.router)
