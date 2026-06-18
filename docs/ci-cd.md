# CI/CD

CourseGrid LMS includes a simple GitHub Actions workflow at `.github/workflows/ci.yml`.

## CI Goals

The workflow proves that the project can be installed, tested, built, and containerized in a clean environment. It is intentionally modest and matches the project scope as an internship-ready MVP.

## Current Workflow

The workflow runs on:

- Pushes to `main`
- Pull requests targeting `main`

## Jobs

### Frontend Build

- Checkout repository
- Setup Node.js 22
- Use npm cache with `frontend/package-lock.json`
- Run `npm ci`
- Run `npm run build`

This validates the React/TypeScript/Vite frontend build.

### Backend Tests

- Checkout repository
- Setup Python 3.12
- Install `backend/requirements.txt`
- Run `pytest -q` with `PYTHONPATH=.`

Current backend tests use SQLite with SQLAlchemy `StaticPool`, not PostgreSQL.

### Docker Build Validation

- Waits for frontend and backend jobs
- Builds backend Docker image from `./backend`
- Builds frontend production Docker image using `--target production`

This validates that both Dockerfiles can build in CI. The images are not pushed to a registry and are not run as containers in the workflow.

## Current Limitations

- No deployment job
- No Docker image push to ECR or another registry
- No linting or formatting checks
- No frontend unit tests
- No Playwright/browser tests
- No PostgreSQL integration test service
- Docker images are built but not run in CI

## Why This Is Enough For V1

This project is an internship-ready MVP. The CI workflow focuses on checks that matter for a first portfolio review:

- TypeScript frontend compiles
- Backend tests execute
- Dockerfiles build successfully
- The repository can be validated without local machine assumptions

## Future Improvements

- Add backend linting and formatting checks
- Add frontend linting and component tests
- Add Playwright smoke tests for login and role dashboards
- Add PostgreSQL service container for integration tests
- Run Docker containers in CI and call `/health` and `/ready`
- Publish Docker images to Amazon ECR on tagged releases
- Add deployment jobs after AWS infrastructure is chosen

Deployment automation is intentionally not implemented in v1. The deployment path is documented separately in `aws-deployment-plan.md`.
