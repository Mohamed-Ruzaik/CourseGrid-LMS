# CourseGrid LMS

CourseGrid LMS is a Dockerized full-stack Learning Management System prototype built as an internship-ready portfolio project. It is inspired by modern LMS workflows, but it is intentionally scoped as a realistic MVP rather than a full Canvas clone or university ERP.

## Why This Project Exists

The goal is to demonstrate practical full-stack engineering and DevOps readiness in one focused project:

- Authenticated React dashboards for admin, instructor, and student roles
- FastAPI REST APIs with SQLAlchemy models and PostgreSQL persistence
- Role-based access control across courses, content, assignments, grading, and analytics
- Docker Compose local development with health checks and seed/demo data
- CI/CD awareness through GitHub Actions
- Cloud deployment awareness through AWS documentation

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
- Backend: FastAPI, Python, SQLAlchemy, Pydantic
- Database: PostgreSQL
- Authentication: JWT and password hashing
- DevOps: Docker, Docker Compose, GitHub Actions, health/readiness/version endpoints
- Cloud plan: AWS EC2 or ECS, RDS PostgreSQL, Docker images, environment variables

## Features

- Login and registration
- JWT authentication
- Role-based dashboards
- Admin course management
- Instructor course management
- Course modules and lessons
- Student enrollment flow
- Lesson completion tracking
- Assignments and text submissions
- Basic grading and instructor feedback
- Course announcements
- Basic analytics summary
- System health UI backed by `/health`, `/ready`, and `/version`

## Roles

- Admin: global course/user perspective, global analytics, create announcements for any course
- Instructor: manage own courses, modules, lessons, assignments, announcements, submissions, and grades
- Student: browse/enroll in courses, read content and announcements, submit assignments, view grades

## Screenshots

Add screenshots here before publishing the portfolio:

- Login page
- Admin dashboard
- Instructor course builder
- Instructor submissions/grading
- Student course detail
- System health page

## Local Setup

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

For local backend development without Docker, provide a PostgreSQL database and set `DATABASE_URL`.

## Docker Setup

Create a local environment file and start the stack:

```bash
copy .env.example .env
docker compose up --build
```

Useful URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Readiness: http://localhost:8000/ready
- Version: http://localhost:8000/version

Seed demo data:

```bash
docker compose exec backend python -m app.seed_demo
```

## Demo Credentials

All seeded demo users use the same password:

```txt
password123
```

- Admin: `admin@example.com`
- Instructor: `instructor@example.com`
- Student: `student@example.com`

## API Overview

Core API groups:

- `/auth`: register, login, current user
- `/users`: user management foundation
- `/courses`: course CRUD and enrollments
- `/courses/{id}/modules`, `/modules/{id}/lessons`, `/lessons/{id}/complete`: course content
- `/courses/{id}/assignments`, `/assignments/{id}/submit`, `/submissions/{id}/grade`: assignment workflow
- `/courses/{id}/announcements`: course announcements
- `/analytics/summary`: role-scoped summary counts
- `/health`, `/ready`, `/version`: operational endpoints

## DevOps Highlights

- Three-service Docker Compose stack: frontend, backend, PostgreSQL
- Backend reads configuration from environment variables
- Frontend reads `VITE_API_BASE_URL` for API calls
- PostgreSQL and backend health checks
- Idempotent demo seed script
- GitHub Actions workflow for frontend build, backend tests, and Docker image builds
- AWS deployment plan documented without adding Kubernetes or Terraform implementation

## Deployment Notes

The recommended production path is:

1. Build frontend and backend Docker images.
2. Push images to a registry such as Amazon ECR.
3. Run PostgreSQL on Amazon RDS.
4. Deploy containers using EC2 with Docker Compose for a simple demo, or ECS for a more production-like setup.
5. Configure environment variables and secrets outside Git.
6. Expose backend health checks through `/health` and `/ready`.

See [docs/aws-deployment-plan.md](docs/aws-deployment-plan.md) for details.

## Folder Structure

```txt
coursegrid-lms/
├── .github/workflows/ci.yml
├── backend/
│   ├── app/
│   └── tests/
├── docs/
├── frontend/
├── .env.example
├── docker-compose.yml
└── README.md
```

## Roadmap

- Add migrations with Alembic
- Add frontend component tests or Playwright smoke tests
- Add screenshot assets for portfolio presentation
- Add production frontend hosting option such as S3 plus CloudFront
- Add refresh tokens and stronger production auth hardening
- Add notification, quiz, file upload, and richer analytics only after the MVP is stable

Not included in v1: Kubernetes, Terraform implementation, payments, chat, file uploads, AI assistant, video streaming, or mobile apps.
