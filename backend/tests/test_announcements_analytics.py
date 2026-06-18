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
            "name": f"{role.title()} Analytics",
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


def test_announcements_and_role_scoped_analytics() -> None:
    admin_token, _ = create_account("analytics-admin@example.com", "admin")
    instructor_token, instructor_id = create_account(
        "analytics-instructor@example.com", "instructor"
    )
    other_instructor_token, _ = create_account(
        "analytics-other-instructor@example.com", "instructor"
    )
    student_token, _ = create_account("analytics-student@example.com", "student")

    course_response = client.post(
        "/courses",
        headers=auth_headers(instructor_token),
        json={
            "title": "Analytics Course",
            "description": "Course with analytics data.",
            "status": "published",
        },
    )
    assert course_response.status_code == 201
    course_id = course_response.json()["id"]
    assert course_response.json()["instructor_id"] == instructor_id

    announcement_response = client.post(
        f"/courses/{course_id}/announcements",
        headers=auth_headers(instructor_token),
        json={"title": "Welcome", "message": "Start with module one."},
    )
    assert announcement_response.status_code == 201
    assert announcement_response.json()["title"] == "Welcome"

    blocked_announcement = client.post(
        f"/courses/{course_id}/announcements",
        headers=auth_headers(other_instructor_token),
        json={"title": "Blocked", "message": "Wrong instructor."},
    )
    assert blocked_announcement.status_code == 403

    student_announcements_before_enrollment = client.get(
        f"/courses/{course_id}/announcements",
        headers=auth_headers(student_token),
    )
    assert student_announcements_before_enrollment.status_code == 403

    client.post(f"/courses/{course_id}/enroll", headers=auth_headers(student_token))

    assignment_response = client.post(
        f"/courses/{course_id}/assignments",
        headers=auth_headers(instructor_token),
        json={"title": "Summary", "description": "Submit a summary.", "max_points": 20},
    )
    assert assignment_response.status_code == 201
    assignment_id = assignment_response.json()["id"]

    submission_response = client.post(
        f"/assignments/{assignment_id}/submit",
        headers=auth_headers(student_token),
        json={"content": "My summary."},
    )
    assert submission_response.status_code == 201

    client.put(
        f"/submissions/{submission_response.json()['id']}/grade",
        headers=auth_headers(instructor_token),
        json={"grade": 18, "feedback": "Solid work."},
    )

    student_announcements = client.get(
        f"/courses/{course_id}/announcements",
        headers=auth_headers(student_token),
    )
    assert student_announcements.status_code == 200
    assert student_announcements.json()[0]["message"] == "Start with module one."

    admin_announcement = client.post(
        f"/courses/{course_id}/announcements",
        headers=auth_headers(admin_token),
        json={"title": "Admin note", "message": "Platform-wide context."},
    )
    assert admin_announcement.status_code == 201

    admin_summary = client.get("/analytics/summary", headers=auth_headers(admin_token))
    assert admin_summary.status_code == 200
    assert admin_summary.json()["total_users"] >= 4
    assert admin_summary.json()["total_courses"] >= 1
    assert admin_summary.json()["total_graded_submissions"] >= 1

    instructor_summary = client.get(
        "/analytics/summary",
        headers=auth_headers(instructor_token),
    )
    assert instructor_summary.status_code == 200
    assert instructor_summary.json()["total_courses"] == 1
    assert instructor_summary.json()["total_submissions"] == 1

    student_summary = client.get("/analytics/summary", headers=auth_headers(student_token))
    assert student_summary.status_code == 200
    assert student_summary.json()["total_courses"] == 1
    assert student_summary.json()["total_assignments"] == 1
    assert student_summary.json()["total_graded_submissions"] == 1
