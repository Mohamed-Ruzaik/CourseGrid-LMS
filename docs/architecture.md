# Architecture

CourseGrid LMS uses a focused three-service architecture for local development and portfolio demonstration. It is intentionally scoped as an internship-ready LMS MVP, not a full Canvas clone or university ERP.

## Current Services

- Frontend: React 19, TypeScript, Vite 6, Tailwind CSS, React Router 7, Axios API layer
- Backend: FastAPI, SQLAlchemy, Pydantic, JWT authentication, role-based dependencies
- Database: PostgreSQL in Docker Compose

## Request Flow

1. The user opens the React app at `http://localhost:5173`.
2. The frontend routes users through public pages, protected role pages, and shared settings/system pages.
3. The frontend calls the backend through `VITE_API_BASE_URL`.
4. The backend validates JWT access tokens and role permissions.
5. SQLAlchemy reads and writes LMS data in PostgreSQL.
6. Health endpoints expose operational status for local checks and future deployment.

## Current Project Structure

```txt
coursegrid-lms/
├── .github/workflows/ci.yml
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py
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
├── docker-compose.yml
└── README.md
```

## Domain Model

Current tables:

- `users`: identity, role, active/suspended state
- `courses`: course metadata and primary instructor
- `enrollments`: student course enrollment
- `course_instructors`: additional instructor access to courses
- `instructor_course_requests`: pending/approved/rejected instructor access requests
- `modules`: ordered course modules
- `lessons`: ordered module lessons
- `lesson_progress`: per-student lesson completion
- `assignments`: course assignments with due dates and max points
- `submissions`: student text submissions, attempt count, grade, and feedback
- `announcements`: course announcements authored by admins or instructors

The model is intentionally small but includes enough relationships to demonstrate realistic LMS behavior.

## Account And Approval Lifecycle

- Student registrations are active by default.
- Admin and instructor self-registrations are created as inactive pending users.
- Inactive users are blocked from login.
- Admins can approve users, activate/suspend users, and review instructor course access requests.
- Instructors can request access to existing courses.
- Approved instructor course access is represented through `course_instructors`.

## Roles And Access

- Admin can manage users, approvals, courses, content, announcements, and global summaries.
- Instructor can create courses, request access to existing courses, and manage assigned course content, assignments, submissions, grades, and announcements.
- Student can view available courses, enroll, access enrolled course content, complete lessons, submit assignments, and view personal grades.

## Assignment Workflow

- Instructors create text-based assignments for their courses.
- Students can submit text content for assignments in enrolled courses.
- Submissions track `attempt_count`.
- The current MVP enforces a three-attempt submission limit.
- Overdue assignments are locked from student submission.
- Instructors can view enrolled students for an assignment, see submitted/not submitted status, and grade submissions with feedback.

## API Groups

- `auth`
- `approvals`
- `users`
- `courses`
- `content`
- `assignments`
- `announcements`
- `analytics`
- `system`

## Operational Endpoints

- `GET /health`: API liveness
- `GET /ready`: database readiness
- `GET /version`: app name, version, and environment

## Design Tradeoffs

- SQLAlchemy `Base.metadata.create_all` is used for MVP simplicity. Alembic migrations are not implemented yet.
- JWT access tokens are enough for the portfolio MVP. A production version should add refresh token rotation and stronger session handling.
- Tests currently use SQLite with `StaticPool`, not PostgreSQL integration tests.
- Analytics are simple role-scoped counts, not a complex reporting system.
- Docker Compose is used for local development. Kubernetes and Terraform are intentionally excluded from v1.
