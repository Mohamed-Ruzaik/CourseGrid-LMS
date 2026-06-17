# CI/CD

CourseGrid LMS includes a simple GitHub Actions workflow at `.github/workflows/ci.yml`.

## CI Goals

The workflow proves that the project can be installed, tested, built, and containerized in a clean environment.

## Workflow Jobs

### Frontend Build

- Checkout repository
- Setup Node.js 22
- Run `npm ci`
- Run `npm run build`

### Backend Tests

- Checkout repository
- Setup Python 3.12
- Install `backend/requirements.txt`
- Run `pytest -q`

### Docker Build Validation

- Build backend Docker image
- Build frontend production Docker image

## Why This Is Enough For V1

This project is an internship-ready MVP. The CI workflow focuses on the checks that matter most for a portfolio review:

- TypeScript frontend compiles
- Backend tests execute
- Dockerfiles build successfully
- The repo can be validated without local machine assumptions

## Future Improvements

- Add linting and formatting checks
- Add frontend unit tests
- Add Playwright smoke tests for login and dashboards
- Publish Docker images to Amazon ECR on tagged releases
- Add deployment jobs after AWS infrastructure is chosen

Deployment automation is intentionally not implemented in v1. The deployment path is documented separately in `aws-deployment-plan.md`.
