from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment, Submission
from app.models.content import Lesson, LessonProgress, Module
from app.models.course import Course, CourseInstructor, Enrollment
from app.models.user import User, UserRole
from app.schemas.analytics import AnalyticsSummary


def _count(db: Session, statement) -> int:
    return int(db.scalar(statement) or 0)


def _average_grade(db: Session, statement) -> float | None:
    value = db.scalar(statement)
    return round(float(value), 1) if value is not None else None


def get_analytics_summary(db: Session, current_user: User) -> AnalyticsSummary:
    if current_user.role == UserRole.admin:
        return AnalyticsSummary(
            total_users=_count(db, select(func.count(User.id))),
            total_courses=_count(db, select(func.count(Course.id))),
            total_enrollments=_count(db, select(func.count(Enrollment.id))),
            total_assignments=_count(db, select(func.count(Assignment.id))),
            total_submissions=_count(db, select(func.count(Submission.id))),
            total_graded_submissions=_count(
                db,
                select(func.count(Submission.id)).where(Submission.grade.is_not(None)),
            ),
            completed_lessons=_count(
                db,
                select(func.count(LessonProgress.id)).where(LessonProgress.completed.is_(True)),
            ),
            average_grade=_average_grade(
                db,
                select(func.avg(Submission.grade)).where(Submission.grade.is_not(None)),
            ),
        )

    if current_user.role == UserRole.instructor:
        instructor_courses = (
            select(Course.id)
            .outerjoin(CourseInstructor, CourseInstructor.course_id == Course.id)
            .where(
                (Course.instructor_id == current_user.id)
                | (CourseInstructor.instructor_id == current_user.id)
            )
            .distinct()
        )
        instructor_assignments = (
            select(Assignment.id)
            .join(Course, Course.id == Assignment.course_id)
            .where(Assignment.course_id.in_(instructor_courses))
        )
        instructor_submissions = (
            select(Submission.id)
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .where(Assignment.course_id.in_(instructor_courses))
        )

        return AnalyticsSummary(
            total_users=0,
            total_courses=_count(db, select(func.count()).select_from(instructor_courses.subquery())),
            total_enrollments=_count(
                db,
                select(func.count(Enrollment.id)).where(Enrollment.course_id.in_(instructor_courses)),
            ),
            total_assignments=_count(
                db,
                select(func.count()).select_from(instructor_assignments.subquery()),
            ),
            total_submissions=_count(
                db,
                select(func.count()).select_from(instructor_submissions.subquery()),
            ),
            total_graded_submissions=_count(
                db,
                select(func.count(Submission.id))
                .where(Submission.grade.is_not(None), Submission.id.in_(instructor_submissions)),
            ),
            average_grade=_average_grade(
                db,
                select(func.avg(Submission.grade))
                .where(Submission.grade.is_not(None), Submission.id.in_(instructor_submissions)),
            ),
        )

    enrolled_courses = select(Enrollment.course_id).where(Enrollment.user_id == current_user.id)
    enrolled_assignments = select(Assignment.id).where(Assignment.course_id.in_(enrolled_courses))
    submitted_assignments = select(Submission.assignment_id).where(
        Submission.student_id == current_user.id
    )

    return AnalyticsSummary(
        total_users=1,
        total_courses=_count(
            db,
            select(func.count(Enrollment.id)).where(Enrollment.user_id == current_user.id),
        ),
        total_enrollments=_count(
            db,
            select(func.count(Enrollment.id)).where(Enrollment.user_id == current_user.id),
        ),
        total_assignments=_count(
            db,
            select(func.count()).select_from(enrolled_assignments.subquery()),
        ),
        total_submissions=_count(
            db,
            select(func.count(Submission.id)).where(Submission.student_id == current_user.id),
        ),
        total_graded_submissions=_count(
            db,
            select(func.count(Submission.id)).where(
                Submission.student_id == current_user.id,
                Submission.grade.is_not(None),
            ),
        ),
        pending_assignments=_count(
            db,
            select(func.count(Assignment.id)).where(
                Assignment.id.in_(enrolled_assignments),
                Assignment.id.not_in(submitted_assignments),
            ),
        ),
        completed_lessons=_count(
            db,
            select(func.count(LessonProgress.id)).where(
                LessonProgress.user_id == current_user.id,
                LessonProgress.completed.is_(True),
                LessonProgress.lesson_id.in_(
                    select(Lesson.id)
                    .join(Module, Module.id == Lesson.module_id)
                    .where(Module.course_id.in_(enrolled_courses))
                ),
            ),
        ),
        average_grade=_average_grade(
            db,
            select(func.avg(Submission.grade)).where(
                Submission.student_id == current_user.id,
                Submission.grade.is_not(None),
            ),
        ),
    )
