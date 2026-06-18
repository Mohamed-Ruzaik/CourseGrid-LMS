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


def create_account(email: str, role: str) -> tuple[str, int]:
    response = client.post(
        "/auth/register",
        json={
            "name": f"{role.title()} User",
            "email": email,
            "password": "password123",
            "role": role,
        },
    )
    assert response.status_code == 201
    user_id = response.json()["id"]
    login_response = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert login_response.status_code == 200
    return login_response.json()["access_token"], user_id


def test_admin_user_management_flow() -> None:
    admin_token, _ = create_account("users-admin@example.com", "admin")
    _, instructor_id = create_account("users-instructor@example.com", "instructor")

    course_response = client.post(
        "/courses",
        json={
            "title": "Admin Managed Course",
            "description": "Course for user management tests",
            "status": "published",
            "instructor_id": instructor_id,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert course_response.status_code == 201
    course_id = course_response.json()["id"]

    create_response = client.post(
        "/users",
        json={
            "name": "Managed Instructor",
            "email": "managed-instructor@example.com",
            "password": "password123",
            "role": "instructor",
            "is_active": True,
            "enrolled_course_ids": [course_id],
            "instructor_course_ids": [course_id],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert create_response.status_code == 201
    managed_user = create_response.json()
    assert managed_user["email"] == "managed-instructor@example.com"
    assert managed_user["enrolled_course_ids"] == [course_id]
    assert managed_user["instructor_course_ids"] == [course_id]
    assert "password_hash" not in managed_user

    search_response = client.get(
        "/users",
        params={"search": str(managed_user["id"])},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert search_response.status_code == 200
    assert [user["id"] for user in search_response.json()] == [managed_user["id"]]

    update_response = client.put(
        f"/users/{managed_user['id']}",
        json={
            "name": "Managed Student",
            "email": "managed-student@example.com",
            "password": "",
            "role": "student",
            "is_active": False,
            "enrolled_course_ids": [course_id],
            "instructor_course_ids": [course_id],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert update_response.status_code == 200
    updated_user = update_response.json()
    assert updated_user["name"] == "Managed Student"
    assert updated_user["email"] == "managed-student@example.com"
    assert updated_user["role"] == "student"
    assert updated_user["is_active"] is False
    assert updated_user["enrolled_course_ids"] == [course_id]
    assert updated_user["instructor_course_ids"] == []
