from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class AdminUserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.student
    is_active: bool = True
    enrolled_course_ids: list[int] = Field(default_factory=list)
    instructor_course_ids: list[int] = Field(default_factory=list)


class AdminUserUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str | None = Field(default=None, max_length=128)
    role: UserRole
    is_active: bool
    enrolled_course_ids: list[int] = Field(default_factory=list)
    instructor_course_ids: list[int] = Field(default_factory=list)


class AdminUserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    enrolled_course_ids: list[int] = Field(default_factory=list)
    instructor_course_ids: list[int] = Field(default_factory=list)

    model_config = {"from_attributes": True}
