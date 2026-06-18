from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.api.deps import db_session, require_admin
from app.core.security import hash_password
from app.models.course import Course, CourseInstructor, Enrollment
from app.models.user import User, UserRole
from app.schemas.user import AdminUserCreate, AdminUserRead, AdminUserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _dedupe_ids(values: list[int]) -> list[int]:
    return list(dict.fromkeys(values))


def _validate_course_ids(db: Session, course_ids: list[int]) -> None:
    unique_ids = _dedupe_ids(course_ids)
    if not unique_ids:
        return
    found_ids = set(db.scalars(select(Course.id).where(Course.id.in_(unique_ids))).all())
    missing_ids = sorted(set(unique_ids) - found_ids)
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown course ids: {', '.join(str(course_id) for course_id in missing_ids)}",
        )


def _serialize_user(db: Session, user: User) -> AdminUserRead:
    enrolled_course_ids = list(
        db.scalars(
            select(Enrollment.course_id)
            .where(Enrollment.user_id == user.id)
            .order_by(Enrollment.course_id)
        )
    )
    instructor_course_ids: list[int] = []
    if user.role == UserRole.instructor:
        assigned_course_ids = list(
            db.scalars(
                select(CourseInstructor.course_id)
                .where(CourseInstructor.instructor_id == user.id)
                .order_by(CourseInstructor.course_id)
            )
        )
        primary_course_ids = list(
            db.scalars(
                select(Course.id).where(Course.instructor_id == user.id).order_by(Course.id)
            )
        )
        instructor_course_ids = _dedupe_ids(primary_course_ids + assigned_course_ids)
    return AdminUserRead(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        enrolled_course_ids=_dedupe_ids(enrolled_course_ids),
        instructor_course_ids=instructor_course_ids,
    )


def _sync_enrollments(db: Session, user: User, course_ids: list[int]) -> None:
    db.execute(delete(Enrollment).where(Enrollment.user_id == user.id))
    for course_id in _dedupe_ids(course_ids):
        db.add(Enrollment(user_id=user.id, course_id=course_id))


def _sync_instructor_courses(db: Session, user: User, course_ids: list[int]) -> None:
    db.execute(delete(CourseInstructor).where(CourseInstructor.instructor_id == user.id))
    for course_id in _dedupe_ids(course_ids):
        db.add(CourseInstructor(instructor_id=user.id, course_id=course_id))


@router.get("", response_model=list[AdminUserRead])
def list_users(
    search: str | None = Query(default=None),
    db: Session = Depends(db_session),
    _: User = Depends(require_admin),
) -> list[AdminUserRead]:
    statement = select(User).order_by(User.created_at.desc())
    if search:
        term = search.strip()
        filters = [
            User.name.ilike(f"%{term}%"),
            User.email.ilike(f"%{term}%"),
        ]
        if term.isdigit():
            filters.append(User.id == int(term))
        statement = statement.where(or_(*filters))
    return [_serialize_user(db, user) for user in db.scalars(statement)]


@router.post("", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(db_session),
    _: User = Depends(require_admin),
) -> AdminUserRead:
    existing_user = db.scalar(select(User).where(User.email == payload.email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    _validate_course_ids(db, payload.enrolled_course_ids + payload.instructor_course_ids)
    user = User(
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()
    _sync_enrollments(db, user, payload.enrolled_course_ids)
    if payload.role == UserRole.instructor:
        _sync_instructor_courses(db, user, payload.instructor_course_ids)
    db.commit()
    db.refresh(user)
    return _serialize_user(db, user)


@router.get("/{user_id}", response_model=AdminUserRead)
def get_user(
    user_id: int,
    db: Session = Depends(db_session),
    _: User = Depends(require_admin),
) -> AdminUserRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _serialize_user(db, user)


@router.put("/{user_id}", response_model=AdminUserRead)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(db_session),
    _: User = Depends(require_admin),
) -> AdminUserRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing_user = db.scalar(select(User).where(User.email == payload.email, User.id != user_id))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    _validate_course_ids(db, payload.enrolled_course_ids + payload.instructor_course_ids)
    user.name = payload.name.strip()
    user.email = str(payload.email).lower()
    user.role = payload.role
    user.is_active = payload.is_active
    if payload.password and len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    if payload.password:
        user.password_hash = hash_password(payload.password)

    _sync_enrollments(db, user, payload.enrolled_course_ids)
    _sync_instructor_courses(
        db,
        user,
        payload.instructor_course_ids if payload.role == UserRole.instructor else [],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _serialize_user(db, user)
