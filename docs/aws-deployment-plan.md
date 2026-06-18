# AWS Deployment Plan

CourseGrid LMS is not currently deployed to AWS. This document describes a realistic future deployment path. The v1 repository does not include Terraform or Kubernetes.

## Production Changes Needed First

Before treating CourseGrid LMS as a production deployment, complete these changes:

- Replace the development backend `--reload` command with a production ASGI command.
- Add Alembic migrations instead of relying on SQLAlchemy `Base.metadata.create_all`.
- Configure production secrets outside Git.
- Configure `BACKEND_CORS_ORIGINS` for the real frontend domain.
- Configure `VITE_API_BASE_URL` for the deployed backend URL.
- Use RDS PostgreSQL or another managed PostgreSQL database.
- Run smoke checks against `/health`, `/ready`, and `/version`.
- Review account approval, suspension, and role-management security before public exposure.

## Option A: EC2 With Docker Compose

This is the simplest portfolio deployment path.

### Components

- One EC2 instance running Docker and Docker Compose
- Amazon RDS PostgreSQL for persistent database storage
- Docker images for frontend and backend
- Security group rules for HTTP/HTTPS and restricted SSH
- Environment variables stored on the instance outside Git
- Optional Nginx reverse proxy or Application Load Balancer

### Steps

1. Build backend and frontend Docker images.
2. Push images to Amazon ECR, or build them directly on the EC2 instance for a simple demo.
3. Create an RDS PostgreSQL instance.
4. Configure `DATABASE_URL` to point the backend at RDS.
5. Configure `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `BACKEND_CORS_ORIGINS`, `APP_VERSION`, and `ENVIRONMENT`.
6. Configure `VITE_API_BASE_URL` for the frontend.
7. Run the containers with Docker Compose.
8. Put Nginx or an Application Load Balancer in front of the services if using a public domain.
9. Verify:
   - `GET /health`
   - `GET /ready`
   - `GET /version`

### Security Groups

- Frontend/public entrypoint: allow `80` or `443` from the internet.
- Backend: allow only from the frontend/load balancer security group when separated.
- RDS: allow only from the EC2/backend security group.
- SSH: restrict to the developer IP, not the whole internet.

## Option B: ECS With RDS

This is a more production-like future path.

### Components

- Amazon ECR for Docker images
- ECS service for backend
- ECS service for frontend, or S3 plus CloudFront for a static frontend build
- Amazon RDS PostgreSQL
- Application Load Balancer
- CloudWatch logs
- AWS Systems Manager Parameter Store or Secrets Manager

### Steps

1. GitHub Actions builds Docker images.
2. Images are pushed to ECR.
3. ECS task definitions reference image tags and environment variables.
4. Backend service connects to RDS through `DATABASE_URL`.
5. Frontend receives the production API base URL at build/deploy time.
6. ALB health checks call `/health` or `/ready`.
7. CloudWatch stores backend logs.

## Environment Variables

Backend:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `BACKEND_CORS_ORIGINS`
- `APP_VERSION`
- `ENVIRONMENT`

Frontend:

- `VITE_API_BASE_URL`

Database:

- RDS database name, username, password, host, and port

## Health Checks

- `/health`: confirms backend process is alive
- `/ready`: confirms database connectivity
- `/version`: confirms deployed app version and environment

These endpoints are useful for load balancer checks, deployment smoke tests, and manual reviewer verification.

## Account And Security Considerations

- Admin and instructor self-registrations are intentionally gated by approval.
- Admins can suspend users.
- Production deployments should protect admin access with strong credentials and a rotated `JWT_SECRET_KEY`.
- Public demo deployments should avoid using sensitive real student data.
- A production version should add stronger token/session handling and auditability.

## Future Improvements

- Add Alembic migrations before production deployment
- Add HTTPS with ACM certificates
- Add ECR publishing in CI
- Add ECS deployment job after manual AWS setup is proven
- Add CloudWatch alarms for failed health checks
- Add RDS backup and restore documentation
- Add PostgreSQL integration tests before deployment

## Exclusions

The v1 portfolio project intentionally excludes Kubernetes and Terraform implementation. The goal is to show deployment awareness without inflating the project beyond an internship MVP.
