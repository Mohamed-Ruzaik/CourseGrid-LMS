from datetime import datetime

from pydantic import BaseModel, Field

from app.models.course import CourseStatus


class CourseBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(default="", max_length=4000)
    status: CourseStatus = CourseStatus.published


class CourseCreate(CourseBase):
    instructor_id: int | None = None


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, max_length=4000)
    status: CourseStatus | None = None
    instructor_id: int | None = None


class CourseRead(BaseModel):
    id: int
    title: str
    description: str
    status: CourseStatus
    instructor_id: int
    created_at: datetime
    updated_at: datetime
    is_enrolled: bool = False

    model_config = {"from_attributes": True}


class EnrollmentRead(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime

    model_config = {"from_attributes": True}
