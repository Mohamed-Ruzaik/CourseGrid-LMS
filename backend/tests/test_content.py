from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import db_session
from app.db.base import Base
from app.main import app
from app.models.user import User

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_db_session() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[db_session] = override_db_session
client = TestClient(app)


def create_account(email: str, role: str) -> tuple[str, int]:
    client.post(
        "/auth/register",
        json={
            "name": f"{role.title()} Content",
            "email": email,
            "password": "password123",
            "role": role,
        },
    )
    db_generator = app.dependency_overrides[db_session]()
    db = next(db_generator)
    try:
        user = db.scalar(select(User).where(User.email == email))
        assert user is not None
        user.is_active = True
        db.add(user)
        db.commit()
    finally:
        db.close()
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"], response.json()["user"]["id"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_modules_lessons_and_progress_flow() -> None:
    instructor_token, instructor_id = create_account(
        "content-instructor@example.com", "instructor"
    )
    other_instructor_token, _ = create_account(
        "content-other-instructor@example.com", "instructor"
    )
    student_token, _ = create_account("content-student@example.com", "student")

    course_response = client.post(
        "/courses",
        headers=auth_headers(instructor_token),
        json={
            "title": "Content Course",
            "description": "Course with modules and lessons.",
            "status": "published",
        },
    )
    assert course_response.status_code == 201
    course_id = course_response.json()["id"]
    assert course_response.json()["instructor_id"] == instructor_id

    module_response = client.post(
        f"/courses/{course_id}/modules",
        headers=auth_headers(instructor_token),
        json={"title": "Week 1", "position": 1},
    )
    assert module_response.status_code == 201
    module_id = module_response.json()["id"]

    blocked_module_response = client.post(
        f"/courses/{course_id}/modules",
        headers=auth_headers(other_instructor_token),
        json={"title": "Should fail", "position": 2},
    )
    assert blocked_module_response.status_code == 403

    lesson_response = client.post(
        f"/modules/{module_id}/lessons",
        headers=auth_headers(instructor_token),
        json={"title": "Intro", "content": "Read this first.", "position": 1},
    )
    assert lesson_response.status_code == 201
    lesson_id = lesson_response.json()["id"]

    student_modules_before_enrollment = client.get(
        f"/courses/{course_id}/modules",
        headers=auth_headers(student_token),
    )
    assert student_modules_before_enrollment.status_code == 403

    client.post(f"/courses/{course_id}/enroll", headers=auth_headers(student_token))

    student_modules = client.get(
        f"/courses/{course_id}/modules",
        headers=auth_headers(student_token),
    )
    assert student_modules.status_code == 200
    assert student_modules.json()[0]["title"] == "Week 1"

    student_lessons = client.get(
        f"/modules/{module_id}/lessons",
        headers=auth_headers(student_token),
    )
    assert student_lessons.status_code == 200
    assert student_lessons.json()[0]["is_completed"] is False

    progress_response = client.post(
        f"/lessons/{lesson_id}/complete",
        headers=auth_headers(student_token),
    )
    assert progress_response.status_code == 200
    assert progress_response.json()["completed"] is True

    completed_lessons = client.get(
        f"/modules/{module_id}/lessons",
        headers=auth_headers(student_token),
    )
    assert completed_lessons.json()[0]["is_completed"] is True

    delete_response = client.delete(
        f"/modules/{module_id}",
        headers=auth_headers(instructor_token),
    )
    assert delete_response.status_code == 204
