from datetime import datetime

from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    description: str = Field(default="", max_length=6000)
    due_date: datetime | None = None
    max_points: float = Field(default=100, ge=0)


class AssignmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=6000)
    due_date: datetime | None = None
    max_points: float | None = Field(default=None, ge=0)


class AssignmentRead(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    due_date: datetime | None
    max_points: float
    submitted: bool = False
    grade: float | None = None
    feedback: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubmissionCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class SubmissionGrade(BaseModel):
    grade: float = Field(ge=0)
    feedback: str = Field(default="", max_length=4000)


class SubmissionRead(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    content: str
    grade: float | None
    feedback: str | None
    submitted_at: datetime
    graded_at: datetime | None

    model_config = {"from_attributes": True}
