from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import db_session, require_admin
from app.models.course import Course, CourseInstructor, InstructorCourseRequest, InstructorCourseRequestStatus
from app.models.user import User, UserRole
from app.schemas.approval import ApprovalSummaryRead, ApprovalUserRead, InstructorCourseApprovalRead

router = APIRouter(prefix="/approvals", tags=["approvals"])


def serialize_request(row: tuple[InstructorCourseRequest, Course, User]) -> InstructorCourseApprovalRead:
    request, course, instructor = row
    return InstructorCourseApprovalRead(
        id=request.id,
        course_id=course.id,
        course_title=course.title,
        instructor_id=instructor.id,
        instructor_name=instructor.name,
        instructor_email=instructor.email,
        status=request.status.value,
        requested_at=request.requested_at,
        reviewed_at=request.reviewed_at,
    )


@router.get("", response_model=ApprovalSummaryRead)
def list_approvals(
    db: Session = Depends(db_session),
    _: User = Depends(require_admin),
) -> ApprovalSummaryRead:
    users = list(
        db.scalars(
            select(User)
            .where(User.role.in_([UserRole.admin, UserRole.instructor]))
            .order_by(User.is_active.asc(), User.created_at.desc())
        )
    )
    request_rows = list(
        db.execute(
            select(InstructorCourseRequest, Course, User)
            .join(Course, Course.id == InstructorCourseRequest.course_id)
            .join(User, User.id == InstructorCourseRequest.instructor_id)
            .order_by(InstructorCourseRequest.requested_at.desc())
        )
    )
    return ApprovalSummaryRead(
        users=[ApprovalUserRead.model_validate(user) for user in users],
        instructor_course_requests=[serialize_request(row) for row in request_rows],
    )


@router.post("/users/{user_id}/approve", response_model=ApprovalUserRead)
def approve_user(
    user_id: int,
    db: Session = Depends(db_session),
    _: User = Depends(require_admin),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/suspend", response_model=ApprovalUserRead)
def suspend_user(
    user_id: int,
    db: Session = Depends(db_session),
    current_admin: User = Depends(require_admin),
) -> User:
    if user_id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot suspend themselves")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/instructor-course-requests/{request_id}/approve", response_model=InstructorCourseApprovalRead)
def approve_instructor_course_request(
    request_id: int,
    db: Session = Depends(db_session),
    _: User = Depends(require_admin),
) -> InstructorCourseApprovalRead:
    request = db.get(InstructorCourseRequest, request_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    existing = db.scalar(
        select(CourseInstructor).where(
            CourseInstructor.course_id == request.course_id,
            CourseInstructor.instructor_id == request.instructor_id,
        )
    )
    if existing is None:
        db.add(CourseInstructor(course_id=request.course_id, instructor_id=request.instructor_id))
    request.status = InstructorCourseRequestStatus.approved
    request.reviewed_at = datetime.now(timezone.utc)
    db.add(request)
    db.commit()

    row = db.execute(
        select(InstructorCourseRequest, Course, User)
        .join(Course, Course.id == InstructorCourseRequest.course_id)
        .join(User, User.id == InstructorCourseRequest.instructor_id)
        .where(InstructorCourseRequest.id == request_id)
    ).one()
    return serialize_request(row)


@router.post("/instructor-course-requests/{request_id}/reject", response_model=InstructorCourseApprovalRead)
def reject_instructor_course_request(
    request_id: int,
    db: Session = Depends(db_session),
    _: User = Depends(require_admin),
) -> InstructorCourseApprovalRead:
    request = db.get(InstructorCourseRequest, request_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    request.status = InstructorCourseRequestStatus.rejected
    request.reviewed_at = datetime.now(timezone.utc)
    db.add(request)
    db.commit()

    row = db.execute(
        select(InstructorCourseRequest, Course, User)
        .join(Course, Course.id == InstructorCourseRequest.course_id)
        .join(User, User.id == InstructorCourseRequest.instructor_id)
        .where(InstructorCourseRequest.id == request_id)
    ).one()
    return serialize_request(row)
