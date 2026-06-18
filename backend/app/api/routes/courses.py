from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import db_session, get_current_user, require_admin_or_instructor
from app.models.course import Course, CourseStatus, Enrollment, InstructorCourseRequest
from app.models.user import User, UserRole
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate, EnrollmentRead, InstructorCourseRequestRead
from app.services.courses import (
    create_course,
    delete_course,
    enroll_student,
    get_course,
    get_course_instructor_ids,
    get_instructor_request_status,
    get_enrolled_course_ids,
    list_courses_for_user,
    request_instructor_course_access,
    update_course,
    user_can_access_course,
    user_is_course_instructor,
)

router = APIRouter(prefix="/courses", tags=["courses"])


def serialize_course(course: Course, enrolled_ids: set[int] | None = None) -> CourseRead:
    course_read = CourseRead.model_validate(course)
    course_read.is_enrolled = course.id in (enrolled_ids or set())
    return course_read


def serialize_course_with_instructors(
    db: Session,
    course: Course,
    enrolled_ids: set[int] | None = None,
    current_user: User | None = None,
) -> CourseRead:
    course_read = serialize_course(course, enrolled_ids)
    course_read.instructor_ids = get_course_instructor_ids(db, course)
    if current_user and current_user.role == UserRole.instructor:
        if user_is_course_instructor(db, course.id, current_user.id):
            course_read.instructor_request_status = "approved"
        else:
            request_status = get_instructor_request_status(db, course.id, current_user.id)
            course_read.instructor_request_status = request_status.value if request_status else None
    return course_read


@router.get("", response_model=list[CourseRead])
def list_courses(
    enrolled: bool = Query(default=False),
    available: bool = Query(default=False),
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> list[CourseRead]:
    courses = list_courses_for_user(db, current_user, enrolled_only=enrolled, available=available)
    enrolled_ids = (
        get_enrolled_course_ids(db, current_user.id)
        if current_user.role == UserRole.student
        else set()
    )
    return [serialize_course_with_instructors(db, course, enrolled_ids, current_user) for course in courses]


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course_route(
    course_data: CourseCreate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> CourseRead:
    course = create_course(db, course_data, current_user)
    return serialize_course_with_instructors(db, course)


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
    return serialize_course_with_instructors(db, course, enrolled_ids)


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
    if current_user.role == UserRole.instructor and not user_is_course_instructor(db, course.id, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")

    return serialize_course_with_instructors(db, update_course(db, course, course_data, current_user))


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_route(
    course_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> None:
    course = get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role == UserRole.instructor and not user_is_course_instructor(db, course.id, current_user.id):
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


@router.post(
    "/{course_id}/request-instructor",
    response_model=InstructorCourseRequestRead,
    status_code=status.HTTP_201_CREATED,
)
def request_instructor_course_route(
    course_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> InstructorCourseRequest:
    if current_user.role != UserRole.instructor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can request course access",
        )

    course = get_course(db, course_id)
    if course is None or course.status != CourseStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if user_is_course_instructor(db, course.id, current_user.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instructor already assigned")

    return request_instructor_course_access(db, course, current_user)
