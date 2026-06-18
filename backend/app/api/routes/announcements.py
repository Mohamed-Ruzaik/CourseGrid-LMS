from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import db_session, get_current_user, require_admin_or_instructor
from app.models.course import Course
from app.models.user import User, UserRole
from app.schemas.announcement import AnnouncementCreate, AnnouncementRead
from app.services.announcements import create_announcement, list_announcements_for_course
from app.services.courses import get_course, user_can_access_course, user_is_course_instructor

router = APIRouter(tags=["announcements"])


def require_course(course_id: int, db: Session) -> Course:
    course = get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.get("/courses/{course_id}/announcements", response_model=list[AnnouncementRead])
def get_course_announcements(
    course_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> list[AnnouncementRead]:
    course = require_course(course_id, db)
    if not user_can_access_course(db, current_user, course):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")
    return list_announcements_for_course(db, course_id)


@router.post(
    "/courses/{course_id}/announcements",
    response_model=AnnouncementRead,
    status_code=status.HTTP_201_CREATED,
)
def create_course_announcement(
    course_id: int,
    data: AnnouncementCreate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> AnnouncementRead:
    course = require_course(course_id, db)
    if current_user.role == UserRole.instructor and not user_is_course_instructor(db, course.id, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")
    return create_announcement(db, course.id, current_user.id, data)
