# DevOps Alignment

CourseGrid LMS is designed to show that the developer understands more than feature implementation. It connects application code, database design, containers, validation, and deployment planning.

## Evidence In The Project

## Containerization

- Frontend, backend, and PostgreSQL run through Docker Compose.
- Services have clear container names.
- PostgreSQL and backend have health checks.
- Restart behavior uses `unless-stopped`, which is reasonable for local development demos.

## Environment-Based Configuration

- Backend reads database, JWT, CORS, version, and environment values from environment variables.
- Frontend reads `VITE_API_BASE_URL`.
- `.env.example` documents required variables and demo credentials.
- Secrets are not committed.

## Operational Readiness

- `/health` confirms API liveness.
- `/ready` confirms database readiness.
- `/version` confirms app version and environment.
- The frontend `/system-health` page displays these checks for reviewers.

## Database Readiness

- PostgreSQL is part of the Compose stack.
- SQLAlchemy models cover realistic LMS entities.
- Demo data can be seeded with `python -m app.seed_demo`.
- Future production work should add Alembic migrations.

## CI/CD Awareness

- GitHub Actions installs and builds the frontend.
- GitHub Actions installs backend dependencies and runs tests.
- Docker image builds are validated.
- Deployment automation is documented as a future step instead of being faked.

## Cloud Deployment Awareness

- AWS EC2 plus Docker Compose is documented as the simplest demo path.
- AWS ECS plus RDS is documented as the production-like path.
- RDS PostgreSQL, ECR images, security groups, environment variables, health checks, and CloudWatch are included in the plan.

## Portfolio Talking Points

- "I scoped the project as an achievable MVP instead of overbuilding."
- "I separated role permissions across backend dependencies and frontend protected routes."
- "I used Docker Compose to make the app reproducible."
- "I added health, readiness, and version endpoints for operational visibility."
- "I documented a realistic AWS path without pretending to implement infrastructure that is outside v1."
