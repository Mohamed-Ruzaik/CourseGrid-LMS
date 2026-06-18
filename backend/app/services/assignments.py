from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment, Submission
from app.models.course import Course, CourseInstructor, Enrollment
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, SubmissionCreate, SubmissionGrade


def list_assignments_for_course(db: Session, course_id: int) -> list[Assignment]:
    return list(
        db.scalars(
            select(Assignment)
            .where(Assignment.course_id == course_id)
            .order_by(Assignment.due_date.asc().nulls_last(), Assignment.created_at.desc())
        )
    )


def get_assignment(db: Session, assignment_id: int) -> Assignment | None:
    return db.get(Assignment, assignment_id)


def create_assignment(db: Session, course_id: int, data: AssignmentCreate) -> Assignment:
    assignment = Assignment(
        course_id=course_id,
        title=data.title.strip(),
        description=data.description.strip(),
        due_date=data.due_date,
        max_points=data.max_points,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def update_assignment(db: Session, assignment: Assignment, data: AssignmentUpdate) -> Assignment:
    updates = data.model_dump(exclude_unset=True)
    if "title" in updates and updates["title"] is not None:
        assignment.title = updates["title"].strip()
    if "description" in updates and updates["description"] is not None:
        assignment.description = updates["description"].strip()
    if "due_date" in updates:
        assignment.due_date = updates["due_date"]
    if "max_points" in updates and updates["max_points"] is not None:
        assignment.max_points = updates["max_points"]
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def delete_assignment(db: Session, assignment: Assignment) -> None:
    db.execute(delete(Submission).where(Submission.assignment_id == assignment.id))
    db.delete(assignment)
    db.commit()


def get_submission_for_student(db: Session, assignment_id: int, student_id: int) -> Submission | None:
    return db.scalar(
        select(Submission).where(
            Submission.assignment_id == assignment_id,
            Submission.student_id == student_id,
        )
    )


def list_submissions_for_assignment(db: Session, assignment_id: int) -> list[Submission]:
    return list(
        db.scalars(
            select(Submission)
            .where(Submission.assignment_id == assignment_id)
            .order_by(Submission.submitted_at.desc())
        )
    )


def list_assignment_student_submissions(db: Session, assignment: Assignment) -> list[tuple[User, Submission | None]]:
    enrolled_students = list(
        db.scalars(
            select(User)
            .join(Enrollment, Enrollment.user_id == User.id)
            .where(
                Enrollment.course_id == assignment.course_id,
                User.role == UserRole.student,
            )
            .order_by(User.name.asc())
        )
    )
    submissions = {
        submission.student_id: submission
        for submission in db.scalars(
            select(Submission).where(Submission.assignment_id == assignment.id)
        )
    }
    return [(student, submissions.get(student.id)) for student in enrolled_students]


def list_submissions_for_student(db: Session, student_id: int) -> list[Submission]:
    return list(
        db.scalars(
            select(Submission)
            .where(Submission.student_id == student_id)
            .order_by(Submission.submitted_at.desc())
        )
    )


def list_submissions_for_instructor(db: Session, instructor_id: int) -> list[Submission]:
    return list(
        db.scalars(
            select(Submission)
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .join(Course, Course.id == Assignment.course_id)
            .outerjoin(CourseInstructor, CourseInstructor.course_id == Course.id)
            .where(
                (Course.instructor_id == instructor_id)
                | (CourseInstructor.instructor_id == instructor_id)
            )
            .distinct()
            .order_by(Submission.submitted_at.desc())
        )
    )


def list_all_submissions(db: Session) -> list[Submission]:
    return list(db.scalars(select(Submission).order_by(Submission.submitted_at.desc())))


def is_past_due(due_date: datetime | None) -> bool:
    if due_date is None:
        return False
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)
    return due_date < datetime.now(timezone.utc)


def submit_assignment(db: Session, assignment_id: int, student_id: int, data: SubmissionCreate) -> Submission:
    assignment = get_assignment(db, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    if is_past_due(assignment.due_date):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assignment due date has passed")

    existing = get_submission_for_student(db, assignment_id, student_id)
    if existing:
        if existing.attempt_count >= 3:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Submission attempt limit reached")
        existing.content = data.content.strip()
        existing.attempt_count += 1
        existing.submitted_at = datetime.now(timezone.utc)
        existing.grade = None
        existing.feedback = None
        existing.graded_at = None
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    submission = Submission(
        assignment_id=assignment_id,
        student_id=student_id,
        content=data.content.strip(),
        attempt_count=1,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def get_submission(db: Session, submission_id: int) -> Submission | None:
    return db.get(Submission, submission_id)


def grade_submission(db: Session, submission: Submission, data: SubmissionGrade) -> Submission:
    submission.grade = data.grade
    submission.feedback = data.feedback.strip()
    submission.graded_at = datetime.now(timezone.utc)
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def student_is_enrolled(db: Session, course_id: int, student_id: int) -> bool:
    return (
        db.scalar(
            select(Enrollment.id).where(
                Enrollment.course_id == course_id,
                Enrollment.user_id == student_id,
            )
        )
        is not None
    )


def can_manage_assignment(db: Session, course: Course, user: User) -> bool:
    if user.role == UserRole.admin:
        return True
    return (
        user.role == UserRole.instructor
        and (
            course.instructor_id == user.id
            or db.scalar(
                select(CourseInstructor.id).where(
                    CourseInstructor.course_id == course.id,
                    CourseInstructor.instructor_id == user.id,
                )
            )
            is not None
        )
    )
