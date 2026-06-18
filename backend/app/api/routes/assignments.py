from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import db_session, get_current_user, require_admin_or_instructor
from app.models.assignment import Assignment, Submission
from app.models.course import Course
from app.models.user import User, UserRole
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentRead,
    AssignmentStudentSubmissionRead,
    AssignmentUpdate,
    SubmissionCreate,
    SubmissionGrade,
    SubmissionRead,
)
from app.services.assignments import (
    can_manage_assignment,
    create_assignment,
    delete_assignment,
    get_assignment,
    get_submission,
    get_submission_for_student,
    grade_submission,
    list_assignment_student_submissions,
    list_all_submissions,
    list_assignments_for_course,
    list_submissions_for_assignment,
    list_submissions_for_instructor,
    list_submissions_for_student,
    student_is_enrolled,
    submit_assignment,
    update_assignment,
)
from app.services.courses import get_course

router = APIRouter(tags=["assignments"])


def require_course(course_id: int, db: Session) -> Course:
    course = get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def require_assignment_with_course(db: Session, assignment_id: int) -> tuple[Assignment, Course]:
    assignment = get_assignment(db, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment, require_course(assignment.course_id, db)


def serialize_assignment(db: Session, assignment: Assignment, current_user: User) -> AssignmentRead:
    assignment_read = AssignmentRead.model_validate(assignment)
    if current_user.role == UserRole.student:
        submission = get_submission_for_student(db, assignment.id, current_user.id)
        assignment_read.submitted = submission is not None
        assignment_read.grade = submission.grade if submission else None
        assignment_read.feedback = submission.feedback if submission else None
    return assignment_read


@router.get("/courses/{course_id}/assignments", response_model=list[AssignmentRead])
def list_course_assignments(
    course_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> list[AssignmentRead]:
    course = require_course(course_id, db)
    if current_user.role == UserRole.student and not student_is_enrolled(db, course_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")
    if current_user.role == UserRole.instructor and not can_manage_assignment(db, course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")
    assignments = list_assignments_for_course(db, course_id)
    return [serialize_assignment(db, assignment, current_user) for assignment in assignments]


@router.post("/courses/{course_id}/assignments", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_course_assignment(
    course_id: int,
    data: AssignmentCreate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> AssignmentRead:
    course = require_course(course_id, db)
    if not can_manage_assignment(db, course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")
    return serialize_assignment(db, create_assignment(db, course_id, data), current_user)


@router.put("/assignments/{assignment_id}", response_model=AssignmentRead)
def update_course_assignment(
    assignment_id: int,
    data: AssignmentUpdate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> AssignmentRead:
    assignment, course = require_assignment_with_course(db, assignment_id)
    if not can_manage_assignment(db, course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assignment access denied")
    return serialize_assignment(db, update_assignment(db, assignment, data), current_user)


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_assignment(
    assignment_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> None:
    assignment, course = require_assignment_with_course(db, assignment_id)
    if not can_manage_assignment(db, course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assignment access denied")
    delete_assignment(db, assignment)


@router.post("/assignments/{assignment_id}/submit", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
def submit_course_assignment(
    assignment_id: int,
    data: SubmissionCreate,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> Submission:
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can submit assignments")
    assignment, _ = require_assignment_with_course(db, assignment_id)
    if not student_is_enrolled(db, assignment.course_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")
    return submit_assignment(db, assignment.id, current_user.id, data)


@router.get("/assignments/{assignment_id}/submissions", response_model=list[SubmissionRead])
def list_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> list[Submission]:
    _, course = require_assignment_with_course(db, assignment_id)
    if not can_manage_assignment(db, course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assignment access denied")
    return list_submissions_for_assignment(db, assignment_id)


@router.get("/assignments/{assignment_id}/students", response_model=list[AssignmentStudentSubmissionRead])
def list_assignment_students(
    assignment_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> list[AssignmentStudentSubmissionRead]:
    assignment, course = require_assignment_with_course(db, assignment_id)
    if not can_manage_assignment(db, course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assignment access denied")

    return [
        AssignmentStudentSubmissionRead(
            student_id=student.id,
            student_name=student.name,
            student_email=student.email,
            submitted=submission is not None,
            submission=SubmissionRead.model_validate(submission) if submission else None,
        )
        for student, submission in list_assignment_student_submissions(db, assignment)
    ]


@router.get("/submissions", response_model=list[SubmissionRead])
def list_submissions(
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> list[Submission]:
    if current_user.role == UserRole.admin:
        return list_all_submissions(db)
    if current_user.role == UserRole.instructor:
        return list_submissions_for_instructor(db, current_user.id)
    return list_submissions_for_student(db, current_user.id)


@router.put("/submissions/{submission_id}/grade", response_model=SubmissionRead)
def grade_assignment_submission(
    submission_id: int,
    data: SubmissionGrade,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> Submission:
    submission = get_submission(db, submission_id)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    assignment, course = require_assignment_with_course(db, submission.assignment_id)
    if not can_manage_assignment(db, course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Submission access denied")
    if data.grade > assignment.max_points:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Grade exceeds max points")
    return grade_submission(db, submission, data)
