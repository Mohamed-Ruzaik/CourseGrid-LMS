# Architecture

CourseGrid LMS uses a focused three-service architecture for local development and portfolio demonstration.

## Services

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router
- Backend: FastAPI, SQLAlchemy, Pydantic, JWT authentication
- Database: PostgreSQL

## Request Flow

1. The user opens the React app at `http://localhost:5173`.
2. The frontend calls the backend through `VITE_API_BASE_URL`.
3. The backend validates JWT access tokens and role permissions.
4. SQLAlchemy reads and writes LMS data in PostgreSQL.
5. Health endpoints expose operational status for local checks and future deployment.

## Domain Model

Core tables:

- `users`
- `courses`
- `enrollments`
- `modules`
- `lessons`
- `lesson_progress`
- `assignments`
- `submissions`
- `announcements`

The model is intentionally small. It demonstrates realistic LMS relationships without expanding into a large ERP.

## Roles And Access

- Admin can see global data and manage courses.
- Instructor can manage only their own courses and related content.
- Student can view published courses, enroll, access enrolled course content, submit work, and view their own grades.

## API Groups

- `auth`
- `users`
- `courses`
- `enrollments`
- `modules`
- `lessons`
- `assignments`
- `submissions`
- `announcements`
- `analytics`
- `system`

## Operational Endpoints

- `GET /health`: API liveness
- `GET /ready`: database readiness
- `GET /version`: app name, version, and environment

## Design Tradeoffs

- SQLAlchemy `create_all` is used for MVP simplicity. A production version should add Alembic migrations.
- JWT access tokens are enough for the portfolio MVP. A production version should add refresh token rotation and stronger cookie/session strategy.
- Analytics are simple counts, not a complex reporting system.
- Docker Compose is used for local development. Kubernetes and Terraform are intentionally excluded from v1.
