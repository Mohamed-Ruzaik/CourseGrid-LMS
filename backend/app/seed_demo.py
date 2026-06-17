from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.database import SessionLocal, engine
from app.models import (
    Announcement,
    Assignment,
    Course,
    CourseStatus,
    Enrollment,
    Lesson,
    LessonProgress,
    Module,
    Submission,
    User,
    UserRole,
)

DEMO_PASSWORD = "password123"


def upsert_user(db: Session, name: str, email: str, role: UserRole) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            name=name,
            email=email,
            role=role,
            password_hash=hash_password(DEMO_PASSWORD),
            is_active=True,
        )
        db.add(user)
    else:
        user.name = name
        user.role = role
        user.is_active = True
        user.password_hash = hash_password(DEMO_PASSWORD)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_course(db: Session, instructor: User) -> Course:
    course = db.scalar(select(Course).where(Course.title == "Full-Stack Foundations"))
    if course is None:
        course = Course(
            title="Full-Stack Foundations",
            description=(
                "A demo course showing modules, lessons, assignments, announcements, "
                "submissions, and grading in CourseGrid LMS."
            ),
            status=CourseStatus.published,
            instructor_id=instructor.id,
        )
        db.add(course)
    else:
        course.instructor_id = instructor.id
        course.status = CourseStatus.published
    db.commit()
    db.refresh(course)
    return course


def ensure_enrollment(db: Session, student: User, course: Course) -> Enrollment:
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == student.id,
            Enrollment.course_id == course.id,
        )
    )
    if enrollment is None:
        enrollment = Enrollment(user_id=student.id, course_id=course.id)
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
    return enrollment


def get_or_create_module(db: Session, course: Course, title: str, position: int) -> Module:
    module = db.scalar(
        select(Module).where(Module.course_id == course.id, Module.title == title)
    )
    if module is None:
        module = Module(course_id=course.id, title=title, position=position)
        db.add(module)
    else:
        module.position = position
    db.commit()
    db.refresh(module)
    return module


def get_or_create_lesson(
    db: Session,
    module: Module,
    title: str,
    content: str,
    position: int,
) -> Lesson:
    lesson = db.scalar(
        select(Lesson).where(Lesson.module_id == module.id, Lesson.title == title)
    )
    if lesson is None:
        lesson = Lesson(
            module_id=module.id,
            title=title,
            content=content,
            position=position,
        )
        db.add(lesson)
    else:
        lesson.content = content
        lesson.position = position
    db.commit()
    db.refresh(lesson)
    return lesson


def ensure_lesson_progress(db: Session, student: User, lesson: Lesson) -> LessonProgress:
    progress = db.scalar(
        select(LessonProgress).where(
            LessonProgress.user_id == student.id,
            LessonProgress.lesson_id == lesson.id,
        )
    )
    if progress is None:
        progress = LessonProgress(user_id=student.id, lesson_id=lesson.id, completed=True)
        db.add(progress)
    else:
        progress.completed = True
        progress.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(progress)
    return progress


def get_or_create_assignment(db: Session, course: Course) -> Assignment:
    assignment = db.scalar(
        select(Assignment).where(
            Assignment.course_id == course.id,
            Assignment.title == "Reflection: Build a Small API",
        )
    )
    due_date = datetime.now(timezone.utc) + timedelta(days=14)
    if assignment is None:
        assignment = Assignment(
            course_id=course.id,
            title="Reflection: Build a Small API",
            description="Write a short reflection on designing and testing a REST API.",
            due_date=due_date,
            max_points=100,
        )
        db.add(assignment)
    else:
        assignment.description = "Write a short reflection on designing and testing a REST API."
        assignment.due_date = due_date
        assignment.max_points = 100
    db.commit()
    db.refresh(assignment)
    return assignment


def ensure_submission(db: Session, student: User, assignment: Assignment) -> Submission:
    submission = db.scalar(
        select(Submission).where(
            Submission.student_id == student.id,
            Submission.assignment_id == assignment.id,
        )
    )
    if submission is None:
        submission = Submission(
            student_id=student.id,
            assignment_id=assignment.id,
            content=(
                "I designed a small API with clear resource boundaries, tested the main "
                "permission paths, and documented how it runs in Docker."
            ),
            grade=92,
            feedback="Strong reflection with practical engineering detail.",
            graded_at=datetime.now(timezone.utc),
        )
        db.add(submission)
    else:
        submission.content = (
            "I designed a small API with clear resource boundaries, tested the main "
            "permission paths, and documented how it runs in Docker."
        )
        submission.grade = 92
        submission.feedback = "Strong reflection with practical engineering detail."
        submission.graded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(submission)
    return submission


def get_or_create_announcement(db: Session, course: Course, author: User) -> Announcement:
    announcement = db.scalar(
        select(Announcement).where(
            Announcement.course_id == course.id,
            Announcement.title == "Welcome to Full-Stack Foundations",
        )
    )
    if announcement is None:
        announcement = Announcement(
            course_id=course.id,
            author_id=author.id,
            title="Welcome to Full-Stack Foundations",
            message="Start with Module 1, complete the intro lesson, and review the assignment brief.",
        )
        db.add(announcement)
    else:
        announcement.author_id = author.id
        announcement.message = (
            "Start with Module 1, complete the intro lesson, and review the assignment brief."
        )
    db.commit()
    db.refresh(announcement)
    return announcement


def seed_demo_data() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = upsert_user(db, "CourseGrid Admin", "admin@example.com", UserRole.admin)
        instructor = upsert_user(
            db,
            "Demo Instructor",
            "instructor@example.com",
            UserRole.instructor,
        )
        student = upsert_user(db, "Demo Student", "student@example.com", UserRole.student)

        course = get_or_create_course(db, instructor)
        ensure_enrollment(db, student, course)

        module_one = get_or_create_module(db, course, "Module 1: Platform Basics", 1)
        module_two = get_or_create_module(db, course, "Module 2: Backend APIs", 2)
        first_lesson = get_or_create_lesson(
            db,
            module_one,
            "CourseGrid Orientation",
            "Review the CourseGrid dashboard, course modules, announcements, and assignments.",
            1,
        )
        get_or_create_lesson(
            db,
            module_one,
            "Learning Workflow",
            "Use lessons, progress, and assignments to move through a course.",
            2,
        )
        get_or_create_lesson(
            db,
            module_two,
            "API Design Basics",
            "Think in resources, permissions, validation, and predictable responses.",
            1,
        )
        ensure_lesson_progress(db, student, first_lesson)

        assignment = get_or_create_assignment(db, course)
        ensure_submission(db, student, assignment)
        get_or_create_announcement(db, course, admin)
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
    print("Demo data seeded.")
