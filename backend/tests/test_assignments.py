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
            "name": f"{role.title()} Assignments",
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


def test_assignment_submission_and_grading_flow() -> None:
    instructor_token, _ = create_account(
        "assignments-instructor@example.com", "instructor"
    )
    other_instructor_token, _ = create_account(
        "assignments-other-instructor@example.com", "instructor"
    )
    student_token, student_id = create_account("assignments-student@example.com", "student")
    unsubmitted_student_token, unsubmitted_student_id = create_account(
        "assignments-unsubmitted-student@example.com", "student"
    )

    course_response = client.post(
        "/courses",
        headers=auth_headers(instructor_token),
        json={
            "title": "Assignments Course",
            "description": "Course with assignments.",
            "status": "published",
        },
    )
    assert course_response.status_code == 201
    course_id = course_response.json()["id"]

    assignment_response = client.post(
        f"/courses/{course_id}/assignments",
        headers=auth_headers(instructor_token),
        json={
            "title": "Reflection",
            "description": "Write a short reflection.",
            "due_date": "2026-08-01T12:00:00Z",
            "max_points": 50,
        },
    )
    assert assignment_response.status_code == 201
    assignment_id = assignment_response.json()["id"]
    assert assignment_response.json()["max_points"] == 50

    blocked_assignment = client.post(
        f"/courses/{course_id}/assignments",
        headers=auth_headers(other_instructor_token),
        json={"title": "Blocked", "description": "", "max_points": 10},
    )
    assert blocked_assignment.status_code == 403

    student_before_enrollment = client.get(
        f"/courses/{course_id}/assignments",
        headers=auth_headers(student_token),
    )
    assert student_before_enrollment.status_code == 403

    client.post(f"/courses/{course_id}/enroll", headers=auth_headers(student_token))
    client.post(f"/courses/{course_id}/enroll", headers=auth_headers(unsubmitted_student_token))

    student_assignments = client.get(
        f"/courses/{course_id}/assignments",
        headers=auth_headers(student_token),
    )
    assert student_assignments.status_code == 200
    assert student_assignments.json()[0]["submitted"] is False

    submission_response = client.post(
        f"/assignments/{assignment_id}/submit",
        headers=auth_headers(student_token),
        json={"content": "My submitted reflection."},
    )
    assert submission_response.status_code == 201
    submission_id = submission_response.json()["id"]
    assert submission_response.json()["student_id"] == student_id
    assert submission_response.json()["attempt_count"] == 1
    assert submission_response.json()["grade"] is None

    submissions_for_owner = client.get(
        f"/assignments/{assignment_id}/submissions",
        headers=auth_headers(instructor_token),
    )
    assert submissions_for_owner.status_code == 200
    assert submissions_for_owner.json()[0]["content"] == "My submitted reflection."

    student_submission_rows = client.get(
        f"/assignments/{assignment_id}/students",
        headers=auth_headers(instructor_token),
    )
    assert student_submission_rows.status_code == 200
    rows_by_student = {row["student_id"]: row for row in student_submission_rows.json()}
    assert rows_by_student[student_id]["submitted"] is True
    assert rows_by_student[student_id]["submission"]["content"] == "My submitted reflection."
    assert rows_by_student[unsubmitted_student_id]["submitted"] is False
    assert rows_by_student[unsubmitted_student_id]["submission"] is None

    submissions_for_other_instructor = client.get(
        f"/assignments/{assignment_id}/submissions",
        headers=auth_headers(other_instructor_token),
    )
    assert submissions_for_other_instructor.status_code == 403

    over_max_grade = client.put(
        f"/submissions/{submission_id}/grade",
        headers=auth_headers(instructor_token),
        json={"grade": 60, "feedback": "Too high."},
    )
    assert over_max_grade.status_code == 400

    grade_response = client.put(
        f"/submissions/{submission_id}/grade",
        headers=auth_headers(instructor_token),
        json={"grade": 44, "feedback": "Clear thinking."},
    )
    assert grade_response.status_code == 200
    assert grade_response.json()["grade"] == 44
    assert grade_response.json()["feedback"] == "Clear thinking."
    assert grade_response.json()["graded_at"] is not None

    student_grades = client.get("/submissions", headers=auth_headers(student_token))
    assert student_grades.status_code == 200
    assert student_grades.json()[0]["grade"] == 44
    assert student_grades.json()[0]["feedback"] == "Clear thinking."

    student_assignments_after_grade = client.get(
        f"/courses/{course_id}/assignments",
        headers=auth_headers(student_token),
    )
    assert student_assignments_after_grade.json()[0]["submitted"] is True
    assert student_assignments_after_grade.json()[0]["attempt_count"] == 1
    assert student_assignments_after_grade.json()[0]["grade"] == 44

    second_attempt = client.post(
        f"/assignments/{assignment_id}/submit",
        headers=auth_headers(student_token),
        json={"content": "Updated reflection attempt two."},
    )
    assert second_attempt.status_code == 201
    assert second_attempt.json()["attempt_count"] == 2

    third_attempt = client.post(
        f"/assignments/{assignment_id}/submit",
        headers=auth_headers(student_token),
        json={"content": "Updated reflection attempt three."},
    )
    assert third_attempt.status_code == 201
    assert third_attempt.json()["attempt_count"] == 3

    fourth_attempt = client.post(
        f"/assignments/{assignment_id}/submit",
        headers=auth_headers(student_token),
        json={"content": "Blocked attempt four."},
    )
    assert fourth_attempt.status_code == 400

    past_assignment = client.post(
        f"/courses/{course_id}/assignments",
        headers=auth_headers(instructor_token),
        json={
            "title": "Past Due",
            "description": "This should be locked.",
            "due_date": "2020-01-01T12:00:00Z",
            "max_points": 25,
        },
    )
    assert past_assignment.status_code == 201

    past_due_submit = client.post(
        f"/assignments/{past_assignment.json()['id']}/submit",
        headers=auth_headers(student_token),
        json={"content": "Too late."},
    )
    assert past_due_submit.status_code == 400
