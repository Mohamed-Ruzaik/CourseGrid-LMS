# DevOps Alignment

CourseGrid LMS is designed to show that the developer understands more than feature implementation. It connects application code, database design, containers, validation, documentation, and deployment planning.

## Containerization

- Frontend, backend, and PostgreSQL run through Docker Compose.
- Services have clear container names: `coursegrid-frontend`, `coursegrid-backend`, and `coursegrid-postgres`.
- PostgreSQL and backend have health checks.
- Restart behavior uses `unless-stopped`, which is reasonable for local development demos.
- The current Compose setup is development-oriented; the backend uses a reload workflow and the frontend uses the Vite dev server.

## Environment-Based Configuration

- Backend reads database, JWT, CORS, version, and environment values from environment variables.
- Frontend reads `VITE_API_BASE_URL`.
- `.env.example` documents required variables and demo credentials.
- Secrets should be provided through environment configuration outside Git for real deployments.

## Operational Readiness

- `/health` confirms API liveness.
- `/ready` confirms database readiness.
- `/version` confirms app version and environment.
- The frontend `/system-health` page displays these checks for reviewers.
- The system health page exists, but it is not currently linked in the role sidebars.

## Database Readiness

- PostgreSQL is part of the Compose stack.
- SQLAlchemy models cover realistic LMS entities such as users, courses, enrollments, instructor access requests, modules, lessons, assignments, submissions, and announcements.
- Demo data can be seeded with `python -m app.seed_demo`.
- SQLAlchemy `Base.metadata.create_all` is used for MVP setup.
- Future production work should add Alembic migrations.

## CI/CD Awareness

- GitHub Actions installs and builds the frontend.
- GitHub Actions installs backend dependencies and runs tests.
- Docker image builds are validated for backend and frontend production target.
- Deployment automation is documented as a future step instead of being faked.

Current CI limitations:

- No deployment pipeline yet
- No Docker image push yet
- No linting yet
- No frontend/browser tests yet
- Backend tests use SQLite, not PostgreSQL
- Docker images are built but not run in CI

## Cloud Deployment Awareness

- AWS EC2 plus Docker Compose is documented as the simplest demo path.
- AWS ECS plus RDS is documented as a production-like future path.
- RDS PostgreSQL, ECR images, security groups, environment variables, health checks, and CloudWatch are included in the plan.
- Kubernetes and Terraform are intentionally excluded from v1.

## Governance And Security Features

- Admin and instructor self-registrations require admin approval before login.
- Admins can activate or suspend users.
- Instructors can request access to existing courses.
- Course access is role-scoped and supports multiple instructors per course.
- These features demonstrate basic account governance without expanding into a full enterprise identity system.

## Portfolio Talking Points

- "I scoped the project as an achievable MVP instead of overbuilding."
- "I separated role permissions across backend dependencies and frontend protected routes."
- "I added approval and suspension flows to show account governance."
- "I used Docker Compose to make the app reproducible."
- "I added health, readiness, and version endpoints for operational visibility."
- "I documented a realistic AWS path without pretending to implement infrastructure that is outside v1."

## Honest Limitations

- The app is not deployed to production yet.
- Alembic migrations are not implemented yet.
- CI does not yet run PostgreSQL integration tests.
- CI does not yet include linting, frontend tests, or Playwright tests.
- The Docker Compose stack is intended for local development and portfolio review.
