from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class ApprovalUserRead(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class InstructorCourseApprovalRead(BaseModel):
    id: int
    course_id: int
    course_title: str
    instructor_id: int
    instructor_name: str
    instructor_email: str
    status: str
    requested_at: datetime
    reviewed_at: datetime | None


class ApprovalSummaryRead(BaseModel):
    users: list[ApprovalUserRead]
    instructor_course_requests: list[InstructorCourseApprovalRead]
