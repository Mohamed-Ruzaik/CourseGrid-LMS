from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate


def list_announcements_for_course(db: Session, course_id: int) -> list[Announcement]:
    return list(
        db.scalars(
            select(Announcement)
            .where(Announcement.course_id == course_id)
            .order_by(Announcement.created_at.desc())
        )
    )


def create_announcement(
    db: Session,
    course_id: int,
    author_id: int,
    data: AnnouncementCreate,
) -> Announcement:
    announcement = Announcement(
        course_id=course_id,
        author_id=author_id,
        title=data.title.strip(),
        message=data.message.strip(),
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement
