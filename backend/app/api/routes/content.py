from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import db_session, get_current_user, require_admin_or_instructor
from app.models.content import Lesson, Module
from app.models.course import Course
from app.models.user import User, UserRole
from app.schemas.content import (
    LessonCreate,
    LessonProgressRead,
    LessonRead,
    LessonUpdate,
    ModuleCreate,
    ModuleRead,
    ModuleUpdate,
)
from app.services.content import (
    complete_lesson,
    create_lesson,
    create_module,
    delete_lesson,
    delete_module,
    get_completed_lesson_ids,
    get_lesson,
    get_module,
    list_lessons_for_module,
    list_modules_for_course,
    update_lesson,
    update_module,
)
from app.services.courses import get_course, user_can_access_course

router = APIRouter(tags=["content"])


def require_course_access(db: Session, course_id: int, current_user: User) -> Course:
    course = get_course(db, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if not user_can_access_course(db, current_user, course):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")
    return course


def require_course_manager(course: Course, current_user: User) -> None:
    if current_user.role == UserRole.admin:
        return
    if current_user.role == UserRole.instructor and course.instructor_id == current_user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course access denied")


def module_course(db: Session, module: Module) -> Course:
    course = get_course(db, module.course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def lesson_module(db: Session, lesson: Lesson) -> Module:
    module = get_module(db, lesson.module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module


def serialize_lesson(lesson: Lesson, completed_ids: set[int] | None = None) -> LessonRead:
    lesson_read = LessonRead.model_validate(lesson)
    lesson_read.is_completed = lesson.id in (completed_ids or set())
    return lesson_read


@router.get("/courses/{course_id}/modules", response_model=list[ModuleRead])
def get_course_modules(
    course_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> list[Module]:
    require_course_access(db, course_id, current_user)
    return list_modules_for_course(db, course_id)


@router.post("/courses/{course_id}/modules", response_model=ModuleRead, status_code=status.HTTP_201_CREATED)
def create_course_module(
    course_id: int,
    module_data: ModuleCreate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> Module:
    course = require_course_access(db, course_id, current_user)
    require_course_manager(course, current_user)
    return create_module(db, course_id, module_data)


@router.put("/modules/{module_id}", response_model=ModuleRead)
def update_course_module(
    module_id: int,
    module_data: ModuleUpdate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> Module:
    module = get_module(db, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    require_course_manager(module_course(db, module), current_user)
    return update_module(db, module, module_data)


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_module(
    module_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> None:
    module = get_module(db, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    require_course_manager(module_course(db, module), current_user)
    delete_module(db, module)


@router.get("/modules/{module_id}/lessons", response_model=list[LessonRead])
def get_module_lessons(
    module_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> list[LessonRead]:
    module = get_module(db, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    require_course_access(db, module.course_id, current_user)
    completed_ids = (
        get_completed_lesson_ids(db, current_user.id)
        if current_user.role == UserRole.student
        else set()
    )
    return [serialize_lesson(lesson, completed_ids) for lesson in list_lessons_for_module(db, module_id)]


@router.post("/modules/{module_id}/lessons", response_model=LessonRead, status_code=status.HTTP_201_CREATED)
def create_module_lesson(
    module_id: int,
    lesson_data: LessonCreate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> LessonRead:
    module = get_module(db, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    require_course_manager(module_course(db, module), current_user)
    return serialize_lesson(create_lesson(db, module_id, lesson_data))


@router.put("/lessons/{lesson_id}", response_model=LessonRead)
def update_module_lesson(
    lesson_id: int,
    lesson_data: LessonUpdate,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> LessonRead:
    lesson = get_lesson(db, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    require_course_manager(module_course(db, lesson_module(db, lesson)), current_user)
    return serialize_lesson(update_lesson(db, lesson, lesson_data))


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module_lesson(
    lesson_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(require_admin_or_instructor),
) -> None:
    lesson = get_lesson(db, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    require_course_manager(module_course(db, lesson_module(db, lesson)), current_user)
    delete_lesson(db, lesson)


@router.post("/lessons/{lesson_id}/complete", response_model=LessonProgressRead)
def complete_module_lesson(
    lesson_id: int,
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> LessonProgressRead:
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can complete lessons",
        )
    lesson = get_lesson(db, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    module = lesson_module(db, lesson)
    require_course_access(db, module.course_id, current_user)
    return complete_lesson(db, lesson, current_user.id)
