from datetime import datetime

from pydantic import BaseModel, Field


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    message: str = Field(min_length=1, max_length=6000)


class AnnouncementRead(BaseModel):
    id: int
    course_id: int
    author_id: int
    title: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}
