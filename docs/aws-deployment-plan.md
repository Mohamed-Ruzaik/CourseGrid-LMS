# AWS Deployment Plan

CourseGrid LMS does not include Terraform or Kubernetes in v1. This document describes a realistic AWS deployment path that can be implemented later.

## Option A: EC2 With Docker Compose

This is the simplest portfolio deployment path.

### Components

- One EC2 instance running Docker and Docker Compose
- Amazon RDS PostgreSQL for persistent database storage
- Docker images for frontend and backend
- Security group rules for HTTP/HTTPS and restricted SSH
- Environment variables stored on the instance outside Git

### Steps

1. Build backend and frontend Docker images.
2. Push images to Amazon ECR or copy/build them on the EC2 instance for a demo.
3. Create an RDS PostgreSQL instance.
4. Configure `DATABASE_URL` to point the backend at RDS.
5. Configure `JWT_SECRET_KEY`, `BACKEND_CORS_ORIGINS`, `APP_VERSION`, and `ENVIRONMENT`.
6. Run the containers with Docker Compose.
7. Put Nginx or an Application Load Balancer in front of the services if using a public domain.
8. Verify:
   - `GET /health`
   - `GET /ready`
   - `GET /version`

### Security Groups

- Frontend: allow `80` or `443` from the internet
- Backend: allow only from frontend/load balancer security group when separated
- RDS: allow only from EC2/backend security group
- SSH: restrict to the developer IP, not the whole internet

## Option B: ECS With RDS

This is a more production-like path.

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
5. ALB health checks call `/health` or `/ready`.
6. CloudWatch stores backend logs.

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

## Future Improvements

- Add Alembic migrations before production deployment
- Add HTTPS with ACM certificates
- Add ECR publishing in CI
- Add ECS deployment job after manual AWS setup is proven
- Add CloudWatch alarms for failed health checks
- Add backup and restore documentation for RDS

## Exclusions

The v1 portfolio project intentionally excludes Kubernetes and Terraform implementation. The goal is to show deployment awareness without inflating the project beyond an internship MVP.
