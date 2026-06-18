# CourseGrid LMS

CourseGrid LMS is a Dockerized full-stack Learning Management System prototype built as an internship-ready portfolio project. It is inspired by modern LMS workflows, but it is intentionally scoped as a realistic MVP rather than a full Canvas clone or university ERP.

## Current Status

CourseGrid LMS currently runs as a local development stack with a React frontend, FastAPI backend, and PostgreSQL database through Docker Compose. The app includes authentication, role-based dashboards, course/content workflows, assignment submission and grading, account approval flows, seed/demo data, health endpoints, and a simple GitHub Actions CI workflow.

This is not a production deployment yet. The project is positioned as a DevOps-aligned internship portfolio project that demonstrates full-stack implementation, containerization, CI awareness, and cloud deployment planning.

## Why This Project Exists

The goal is to demonstrate practical full-stack engineering and DevOps readiness in one focused project:

- Authenticated React dashboards for admin, instructor, and student roles
- FastAPI REST APIs with SQLAlchemy models and PostgreSQL persistence
- Role-based access control across users, courses, content, assignments, grading, approvals, and analytics
- Docker Compose local development with health checks and seed/demo data
- CI/CD awareness through GitHub Actions
- Cloud deployment awareness through AWS documentation

## Tech Stack

- Frontend: React 19, TypeScript, Vite 6, Tailwind CSS, React Router 7, Axios
- Backend: FastAPI, Python, SQLAlchemy, Pydantic
- Database: PostgreSQL
- Authentication: JWT access tokens and password hashing
- DevOps: Docker, Docker Compose, GitHub Actions, health/readiness/version endpoints
- Cloud plan: AWS EC2 or ECS, RDS PostgreSQL, Docker images, environment variables

## Implemented Features

- JWT login and registration
- Role-based dashboards
- Admin approvals
- Pending admin/instructor approval before login
- User activate/suspend controls
- Instructor course access request flow
- Multi-instructor course access
- Admin user management
- Admin course management
- Instructor course workspace
- Student enrollment from My Courses
- Modules, lessons, and lesson completion
- Assignments and text submissions
- Three-attempt submission limit
- Overdue assignment lock
- Instructor submissions workflow
- Grading and feedback
- Student grades grouped by course
- Announcements
- Settings/profile name update
- Role-scoped analytics summaries
- System health page backed by `/health`, `/ready`, and `/version`

## Implemented Vs Planned

Implemented today:

- Local Docker Compose development stack
- Auth, roles, approvals, courses, enrollments, modules, lessons, assignments, submissions, grading, announcements, settings, analytics, and health checks
- Demo seed script with active demo users and sample LMS data
- GitHub Actions workflow for frontend build, backend tests, and Docker build validation

Planned later:

- Alembic migrations
- Production backend command instead of development `--reload`
- PostgreSQL integration tests in CI
- Linting, formatting, frontend tests, and Playwright smoke tests
- Docker image publishing and deployment pipeline
- Refresh tokens and stronger production auth hardening
- Optional file upload support if needed after the MVP is stable

Not included in v1: Kubernetes, Terraform implementation, payments, chat, AI assistant, quiz engine, rubrics, video streaming, notifications, audit logs, or mobile apps.

## Roles

- Admin: handles approvals, user management, course management, activation/suspension, global analytics, and announcements for any course.
- Instructor: can create courses, request access to existing courses, manage assigned course content, create assignments, review submissions, grade work, and post announcements.
- Student: can enroll in available courses, read course content, complete lessons, submit assignments, and view grades grouped by course.

## Screenshots

Add screenshots here before publishing the portfolio:

- Login/Register
- Admin Dashboard
- Admin Approvals
- Admin Courses
- Instructor Dashboard
- Instructor Course Workspace
- Instructor Submissions
- Student Dashboard
- Student My Courses
- Student Assignments
- Student Grades
- System Health

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

The seed script creates active demo users and sample course data. All seeded demo users use the same password:

```txt
password123
```

- Admin: `admin@example.com`
- Instructor: `instructor@example.com`
- Student: `student@example.com`

Note: `.env.example` documents `DEMO_*` values for reviewer clarity, but the current seed script uses hardcoded demo values in `backend/app/seed_demo.py`.

## API Overview

Core API groups:

- `/auth`: register, login, current user, profile update through `PATCH /auth/me`
- `/approvals`: pending user approvals, user suspension, instructor course request approval/rejection
- `/users`: admin user list, create, detail, and edit
- `/courses`: course CRUD, student enrollment, and instructor course access requests
- `/courses/{id}/modules`, `/modules/{id}/lessons`, `/lessons/{id}/complete`: course content and progress
- `/courses/{id}/assignments`, `/assignments/{id}/submit`, `/assignments/{id}/submissions`, `/assignments/{id}/students`, `/submissions`, `/submissions/{id}/grade`: assignment, submission, and grading workflow
- `/courses/{id}/announcements`: course announcements
- `/analytics/summary`: role-scoped summary counts
- `/health`, `/ready`, `/version`: operational endpoints

## DevOps Highlights

- Three-service Docker Compose stack: frontend, backend, PostgreSQL
- Useful container names: `coursegrid-frontend`, `coursegrid-backend`, `coursegrid-postgres`
- Backend reads configuration from environment variables
- Frontend reads `VITE_API_BASE_URL` for API calls
- PostgreSQL and backend health checks
- Demo seed script for reviewer data
- GitHub Actions workflow for frontend build, backend pytest, and Docker build validation
- AWS deployment plan documented without adding Kubernetes or Terraform implementation

Limitations are intentional and documented: the Compose stack is development-mode, backend tests currently use SQLite, deployment is planned but not automated, and production migrations are not implemented yet.

## Deployment Notes

The recommended production path is:

1. Build frontend and backend Docker images.
2. Push images to a registry such as Amazon ECR.
3. Run PostgreSQL on Amazon RDS.
4. Deploy containers using EC2 with Docker Compose for a simple demo, or ECS for a more production-like setup.
5. Configure environment variables and secrets outside Git.
6. Configure production CORS and replace development-only backend `--reload`.
7. Expose backend health checks through `/health` and `/ready`.

See [docs/aws-deployment-plan.md](docs/aws-deployment-plan.md) for details.

## Folder Structure

```txt
coursegrid-lms/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── analytics.py
│   │   │       ├── announcements.py
│   │   │       ├── approvals.py
│   │   │       ├── assignments.py
│   │   │       ├── auth.py
│   │   │       ├── content.py
│   │   │       ├── courses.py
│   │   │       ├── system.py
│   │   │       └── users.py
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── main.py
│   │   └── seed_demo.py
│   └── tests/
├── docs/
├── frontend/
│   └── src/
│       ├── api/
│       ├── auth/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       │   ├── admin/
│       │   ├── instructor/
│       │   ├── public/
│       │   ├── settings/
│       │   ├── student/
│       │   └── system/
│       ├── routes/
│       ├── types/
│       └── utils/
├── images/
├── .env.example
├── docker-compose.yml
└── README.md
```

## Roadmap

- Add migrations with Alembic
- Replace development backend `--reload` command for production images
- Add PostgreSQL integration tests in CI
- Add linting and frontend tests
- Add Playwright smoke tests for login and dashboards
- Add deployment pipeline after the AWS target is chosen
- Add screenshot assets for portfolio presentation
- Add production frontend hosting option such as S3 plus CloudFront
- Add refresh tokens and stronger production auth hardening
- Add file upload later only if the LMS scope needs it
