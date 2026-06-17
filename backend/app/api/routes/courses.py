from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import db_session, get_current_user, require_admin_or_instructor
from app.models.course import Course, CourseStatus, Enrollment
from app.models.user import User, UserRole
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate, EnrollmentRead
from app.services.courses import (
    create_course,
    delete_course,
    enroll_student,
    get_course,
    get_enrolled_course_ids,
    list_courses_for_user,
    update_course,
    user_can_access_course,
)

router = APIRouter(prefix="/courses", tags=["courses"])


def serialize_course(course: Course, enrolled_ids: set[int] | None = None) -> CourseRead:
    course_read = CourseRead.model_validate(course)
    course_read.is_enrolled = course.id in (enrolled_ids or set())
    return course_read


@router.get("", response_model=list[CourseRead])
def list_courses(
    enrolled: bool = Query(default=False),
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> list[CourseRead]:
    courses = list_courses_for_user(db, current_user, enrolled_only=enrolled)
    enrolled_ids = (
        get_enrolled_course_ids(db, current_user.id)
        if current_user.role == UserRole.student
        else set()
    )
    return [serialize_course(course, enrolled_ids) for course in courses]


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course_route(
    course_data: CourseCreate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> CourseRead:
    course = create_course(db, course_data, current_user)
    return serialize_course(course)


@router.get("/{course_id}", response_model=CourseRead)
def get_course_route(
    course_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> CourseRead:
    course = get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role == UserRole.student and course.status != CourseStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if not user_can_access_course(db, current_user, course):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")

    enrolled_ids = (
        get_enrolled_course_ids(db, current_user.id)
        if current_user.role == UserRole.student
        else set()
    )
    return serialize_course(course, enrolled_ids)


@router.put("/{course_id}", response_model=CourseRead)
def update_course_route(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> CourseRead:
    course = get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role == UserRole.instructor and course.instructor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")

    return serialize_course(update_course(db, course, course_data, current_user))


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_route(
    course_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> None:
    course = get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role == UserRole.instructor and course.instructor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")

    delete_course(db, course)


@router.post("/{course_id}/enroll", response_model=EnrollmentRead, status_code=status.HTTP_201_CREATED)
def enroll_course_route(
    course_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> Enrollment:
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can enroll in courses",
        )

    course = get_course(db, course_id)
    if course is None or course.status != CourseStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    return enroll_student(db, course, current_user)
