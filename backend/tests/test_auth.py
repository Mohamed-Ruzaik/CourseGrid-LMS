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


def test_register_login_and_me_flow() -> None:
    payload = {
        "name": "Admin User",
        "email": "admin-auth-test@example.com",
        "password": "password123",
        "role": "admin",
    }

    register_response = client.post("/auth/register", json=payload)

    assert register_response.status_code == 201
    register_data = register_response.json()
    assert register_data["email"] == payload["email"]
    assert register_data["role"] == "admin"
    assert "password_hash" not in register_data

    duplicate_response = client.post("/auth/register", json=payload)
    assert duplicate_response.status_code == 409

    login_response = client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )

    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["token_type"] == "bearer"
    assert login_data["access_token"]
    assert login_data["user"]["role"] == "admin"

    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {login_data['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == payload["email"]
