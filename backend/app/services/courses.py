from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.models.course import Course, CourseInstructor, CourseStatus, Enrollment
from app.models.user import User, UserRole
from app.schemas.course import CourseCreate, CourseUpdate


def get_enrolled_course_ids(db: Session, user_id: int) -> set[int]:
    return set(
        db.scalars(select(Enrollment.course_id).where(Enrollment.user_id == user_id)).all()
    )


def list_courses_for_user(
    db: Session, current_user: User, enrolled_only: bool = False
) -> list[Course]:
    statement = select(Course).order_by(Course.created_at.desc())

    if current_user.role == UserRole.admin:
        return list(db.scalars(statement))

    if current_user.role == UserRole.instructor:
        return list(
            db.scalars(
                statement.outerjoin(CourseInstructor, CourseInstructor.course_id == Course.id)
                .where(
                    or_(
                        Course.instructor_id == current_user.id,
                        CourseInstructor.instructor_id == current_user.id,
                    )
                )
                .distinct()
            )
        )

    if enrolled_only:
        statement = statement.join(Enrollment).where(Enrollment.user_id == current_user.id)
    else:
        statement = statement.where(Course.status == CourseStatus.published)

    return list(db.scalars(statement))


def get_course(db: Session, course_id: int) -> Course | None:
    return db.get(Course, course_id)


def user_can_access_course(db: Session, user: User, course: Course) -> bool:
    if user.role == UserRole.admin:
        return True
    if user.role == UserRole.instructor:
        return user_is_course_instructor(db, course.id, user.id)
    return (
        db.scalar(
            select(Enrollment.id).where(
                Enrollment.user_id == user.id,
                Enrollment.course_id == course.id,
            )
        )
        is not None
    )


def user_is_course_instructor(db: Session, course_id: int, instructor_id: int) -> bool:
    return (
        db.scalar(
            select(Course.id).where(
                Course.id == course_id,
                Course.instructor_id == instructor_id,
            )
        )
        is not None
        or db.scalar(
            select(CourseInstructor.id).where(
                CourseInstructor.course_id == course_id,
                CourseInstructor.instructor_id == instructor_id,
            )
        )
        is not None
    )


def create_course(db: Session, course_data: CourseCreate, current_user: User) -> Course:
    instructor_id = (
        course_data.instructor_id
        if current_user.role == UserRole.admin and course_data.instructor_id is not None
        else current_user.id
    )
    course = Course(
        title=course_data.title.strip(),
        description=course_data.description.strip(),
        status=course_data.status,
        instructor_id=instructor_id,
    )
    db.add(course)
    db.flush()
    db.add(CourseInstructor(course_id=course.id, instructor_id=instructor_id))
    db.commit()
    db.refresh(course)
    return course


def update_course(db: Session, course: Course, course_data: CourseUpdate, current_user: User) -> Course:
    updates = course_data.model_dump(exclude_unset=True)
    if "title" in updates and updates["title"] is not None:
        course.title = updates["title"].strip()
    if "description" in updates and updates["description"] is not None:
        course.description = updates["description"].strip()
    if "status" in updates and updates["status"] is not None:
        course.status = updates["status"]
    if (
        "instructor_id" in updates
        and updates["instructor_id"] is not None
        and current_user.role == UserRole.admin
    ):
        course.instructor_id = updates["instructor_id"]
        existing = db.scalar(
            select(CourseInstructor).where(
                CourseInstructor.course_id == course.id,
                CourseInstructor.instructor_id == updates["instructor_id"],
            )
        )
        if existing is None:
            db.add(
                CourseInstructor(
                    course_id=course.id,
                    instructor_id=updates["instructor_id"],
                )
            )

    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def delete_course(db: Session, course: Course) -> None:
    db.execute(delete(Enrollment).where(Enrollment.course_id == course.id))
    db.execute(delete(CourseInstructor).where(CourseInstructor.course_id == course.id))
    db.delete(course)
    db.commit()


def enroll_student(db: Session, course: Course, student: User) -> Enrollment:
    existing_enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.course_id == course.id,
            Enrollment.user_id == student.id,
        )
    )
    if existing_enrollment:
        return existing_enrollment

    enrollment = Enrollment(user_id=student.id, course_id=course.id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment
