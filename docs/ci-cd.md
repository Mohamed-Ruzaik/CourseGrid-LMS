# CI/CD

CourseGrid LMS includes a CI workflow at `.github/workflows/ci.yml` and a Docker image publishing workflow at `.github/workflows/docker-publish.yml`.

## CI Goals

The workflow proves that the project can be installed, tested, built, and containerized in a clean environment. It is intentionally modest and matches the project scope as an internship-ready MVP.

## Current CI Workflow

The CI workflow runs on:

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

This validates that both Dockerfiles can build in CI. The images are not pushed to a registry and are not run as containers in this CI workflow.

## Docker Publish Workflow

The Docker publish workflow runs on:

- Pushes to `main`
- Manual `workflow_dispatch`

It uses `GITHUB_TOKEN` with `packages: write` permission to log in to GitHub Container Registry. It does not use AWS credentials and does not deploy the application.

The workflow validates the app before publishing:

- Installs frontend dependencies
- Runs `npm run build`
- Installs backend dependencies
- Runs `pytest -q`

After validation, it builds and pushes:

- Backend image from `./backend` to `ghcr.io/mohamed-ruzaik/coursegrid-backend:latest`
- Frontend production image from `./frontend` using the `production` Docker target to `ghcr.io/mohamed-ruzaik/coursegrid-frontend:latest`

## Current Limitations

- No deployment job
- No production deployment pipeline
- No AWS credential usage
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
- Optionally publish Docker images to Amazon ECR on tagged releases after AWS infrastructure is chosen
- Add deployment jobs after AWS infrastructure is chosen

Production deployment automation is intentionally not implemented in v1. The Docker publish workflow can publish images to GHCR for portfolio demonstration, while the AWS deployment path remains documented separately in `aws-deployment-plan.md`.
