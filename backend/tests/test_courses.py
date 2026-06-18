from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import db_session
from app.db.base import Base
from app.main import app

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


def create_account(email: str, role: str) -> str:
    client.post(
        "/auth/register",
        json={
            "name": f"{role.title()} User",
            "email": email,
            "password": "password123",
            "role": role,
        },
    )
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_course_crud_and_student_enrollment_flow() -> None:
    admin_token = create_account("course-admin@example.com", "admin")
    instructor_token = create_account("course-instructor@example.com", "instructor")
    other_instructor_token = create_account("other-instructor@example.com", "instructor")
    student_token = create_account("course-student@example.com", "student")

    instructor_response = client.get("/auth/me", headers=auth_headers(instructor_token))
    instructor_id = instructor_response.json()["id"]
    other_instructor_response = client.get("/auth/me", headers=auth_headers(other_instructor_token))
    other_instructor_id = other_instructor_response.json()["id"]

    create_response = client.post(
        "/courses",
        headers=auth_headers(admin_token),
        json={
            "title": "DevOps Foundations",
            "description": "Docker, APIs, and deployment basics.",
            "status": "published",
            "instructor_id": instructor_id,
        },
    )
    assert create_response.status_code == 201
    course = create_response.json()
    assert course["instructor_id"] == instructor_id

    instructor_courses = client.get("/courses", headers=auth_headers(instructor_token))
    assert instructor_courses.status_code == 200
    assert [item["id"] for item in instructor_courses.json()] == [course["id"]]

    blocked_update = client.put(
        f"/courses/{course['id']}",
        headers=auth_headers(other_instructor_token),
        json={"title": "Should Not Work"},
    )
    assert blocked_update.status_code == 403

    shared_course_response = client.post(
        "/courses",
        headers=auth_headers(admin_token),
        json={
            "title": "Shared Instructor Course",
            "description": "A course managed by multiple instructors.",
            "status": "draft",
            "instructor_ids": [instructor_id, other_instructor_id],
        },
    )
    assert shared_course_response.status_code == 201
    shared_course = shared_course_response.json()
    assert shared_course["instructor_id"] == instructor_id
    assert shared_course["instructor_ids"] == [instructor_id, other_instructor_id]

    shared_update = client.put(
        f"/courses/{shared_course['id']}",
        headers=auth_headers(other_instructor_token),
        json={"description": "Updated by the second instructor."},
    )
    assert shared_update.status_code == 200

    student_detail_before_enrollment = client.get(
        f"/courses/{course['id']}", headers=auth_headers(student_token)
    )
    assert student_detail_before_enrollment.status_code == 403

    enrollment_response = client.post(
        f"/courses/{course['id']}/enroll", headers=auth_headers(student_token)
    )
    assert enrollment_response.status_code == 201
    assert enrollment_response.json()["course_id"] == course["id"]

    duplicate_enrollment = client.post(
        f"/courses/{course['id']}/enroll", headers=auth_headers(student_token)
    )
    assert duplicate_enrollment.status_code == 201
    assert duplicate_enrollment.json()["id"] == enrollment_response.json()["id"]

    enrolled_courses = client.get(
        "/courses?enrolled=true", headers=auth_headers(student_token)
    )
    assert enrolled_courses.status_code == 200
    assert enrolled_courses.json()[0]["is_enrolled"] is True

    delete_response = client.delete(
        f"/courses/{course['id']}", headers=auth_headers(admin_token)
    )
    assert delete_response.status_code == 204
