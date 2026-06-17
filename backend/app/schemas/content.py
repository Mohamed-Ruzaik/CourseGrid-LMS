from datetime import datetime

from pydantic import BaseModel, Field


class ModuleCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    position: int = Field(default=1, ge=1)


class ModuleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    position: int | None = Field(default=None, ge=1)


class ModuleRead(BaseModel):
    id: int
    course_id: int
    title: str
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LessonCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    content: str = Field(default="", max_length=10000)
    position: int = Field(default=1, ge=1)


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    content: str | None = Field(default=None, max_length=10000)
    position: int | None = Field(default=None, ge=1)


class LessonRead(BaseModel):
    id: int
    module_id: int
    title: str
    content: str
    position: int
    is_completed: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LessonProgressRead(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    completed: bool
    completed_at: datetime

    model_config = {"from_attributes": True}
