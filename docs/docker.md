# Docker

CourseGrid LMS runs locally with Docker Compose using three services. The Compose setup is optimized for development and portfolio review, not final production hosting.

## Services

- `coursegrid-postgres`: PostgreSQL 16 on port `5432`
- `coursegrid-backend`: FastAPI service on port `8000`
- `coursegrid-frontend`: Vite development server on port `5173`

## Development Mode Notes

- The backend service mounts `./backend:/app` and runs the FastAPI app with a development reload workflow.
- The frontend service uses the `dev` target from the frontend Dockerfile and runs the Vite dev server.
- The frontend Dockerfile also includes a production Nginx stage used by CI build validation.
- PostgreSQL data is stored in the `postgres_data` Docker volume.

## Start The Stack

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

## Environment

The frontend uses:

- `VITE_API_BASE_URL=http://localhost:8000`

The backend uses:

- `DATABASE_URL=postgresql://coursegrid_user:coursegrid_password@postgres:5432/coursegrid` inside Docker
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `BACKEND_CORS_ORIGINS`
- `APP_VERSION`
- `ENVIRONMENT`

PostgreSQL uses:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

## Health Checks

- PostgreSQL uses `pg_isready`.
- Backend checks `GET /health`.
- `GET /ready` verifies database connectivity.
- `GET /version` exposes the configured app version and environment.

## Seed Demo Data

Run after the backend is started:

```bash
docker compose exec backend python -m app.seed_demo
```

Seeded active accounts:

- `admin@example.com`
- `instructor@example.com`
- `student@example.com`

Password:

```txt
password123
```

The seed script also creates a sample course, enrollment, modules, lessons, lesson progress, assignment, graded submission, and announcement. It is designed to be rerunnable.

Note: the current seed script hardcodes the demo users and password in `backend/app/seed_demo.py`. The `DEMO_*` values in `.env.example` document the reviewer credentials but are not currently read by the script.

## Useful Commands

```bash
docker compose ps
docker compose logs -f backend
docker compose exec backend pytest -q
docker compose exec backend python -m app.seed_demo
docker compose down
```

To reset all database data:

```bash
docker compose down -v
docker compose up --build
docker compose exec backend python -m app.seed_demo
```

## Troubleshooting

Database volume has stale schema/data:

```bash
docker compose down -v
docker compose up --build
docker compose exec backend python -m app.seed_demo
```

Backend is not ready:

- Check `docker compose logs -f backend`.
- Confirm PostgreSQL is healthy with `docker compose ps`.
- Confirm `DATABASE_URL` points to the Compose hostname `postgres` inside Docker.

Frontend cannot call backend:

- Confirm `VITE_API_BASE_URL=http://localhost:8000` for browser-based local development.
- Confirm the backend is reachable at http://localhost:8000/health.

CORS errors:

- Confirm `BACKEND_CORS_ORIGINS` includes the frontend origin, usually `http://localhost:5173`.
- Restart the backend container after changing environment values.
