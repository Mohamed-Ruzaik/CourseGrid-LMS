from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.content import Lesson, LessonProgress, Module
from app.schemas.content import LessonCreate, LessonUpdate, ModuleCreate, ModuleUpdate


def list_modules_for_course(db: Session, course_id: int) -> list[Module]:
    return list(
        db.scalars(
            select(Module)
            .where(Module.course_id == course_id)
            .order_by(Module.position.asc(), Module.created_at.asc())
        )
    )


def get_module(db: Session, module_id: int) -> Module | None:
    return db.get(Module, module_id)


def create_module(db: Session, course_id: int, module_data: ModuleCreate) -> Module:
    module = Module(
        course_id=course_id,
        title=module_data.title.strip(),
        position=module_data.position,
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


def update_module(db: Session, module: Module, module_data: ModuleUpdate) -> Module:
    updates = module_data.model_dump(exclude_unset=True)
    if "title" in updates and updates["title"] is not None:
        module.title = updates["title"].strip()
    if "position" in updates and updates["position"] is not None:
        module.position = updates["position"]
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


def delete_module(db: Session, module: Module) -> None:
    lesson_ids = list(db.scalars(select(Lesson.id).where(Lesson.module_id == module.id)))
    if lesson_ids:
        db.execute(delete(LessonProgress).where(LessonProgress.lesson_id.in_(lesson_ids)))
        db.execute(delete(Lesson).where(Lesson.id.in_(lesson_ids)))
    db.delete(module)
    db.commit()


def list_lessons_for_module(db: Session, module_id: int) -> list[Lesson]:
    return list(
        db.scalars(
            select(Lesson)
            .where(Lesson.module_id == module_id)
            .order_by(Lesson.position.asc(), Lesson.created_at.asc())
        )
    )


def get_lesson(db: Session, lesson_id: int) -> Lesson | None:
    return db.get(Lesson, lesson_id)


def create_lesson(db: Session, module_id: int, lesson_data: LessonCreate) -> Lesson:
    lesson = Lesson(
        module_id=module_id,
        title=lesson_data.title.strip(),
        content=lesson_data.content.strip(),
        position=lesson_data.position,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def update_lesson(db: Session, lesson: Lesson, lesson_data: LessonUpdate) -> Lesson:
    updates = lesson_data.model_dump(exclude_unset=True)
    if "title" in updates and updates["title"] is not None:
        lesson.title = updates["title"].strip()
    if "content" in updates and updates["content"] is not None:
        lesson.content = updates["content"].strip()
    if "position" in updates and updates["position"] is not None:
        lesson.position = updates["position"]
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def delete_lesson(db: Session, lesson: Lesson) -> None:
    db.execute(delete(LessonProgress).where(LessonProgress.lesson_id == lesson.id))
    db.delete(lesson)
    db.commit()


def get_completed_lesson_ids(db: Session, user_id: int) -> set[int]:
    return set(
        db.scalars(
            select(LessonProgress.lesson_id).where(
                LessonProgress.user_id == user_id,
                LessonProgress.completed.is_(True),
            )
        )
    )


def complete_lesson(db: Session, lesson: Lesson, user_id: int) -> LessonProgress:
    progress = db.scalar(
        select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id == lesson.id,
        )
    )
    if progress:
        progress.completed = True
        progress.completed_at = datetime.now(timezone.utc)
    else:
        progress = LessonProgress(user_id=user_id, lesson_id=lesson.id, completed=True)
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress
