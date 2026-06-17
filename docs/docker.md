# Docker

CourseGrid LMS runs locally with Docker Compose using three services.

## Services

- `coursegrid-frontend`: Vite development server on port `5173`
- `coursegrid-backend`: FastAPI service on port `8000`
- `coursegrid-postgres`: PostgreSQL on port `5432`

## Start The Stack

```bash
copy .env.example .env
docker compose up --build
```

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

## Seed Demo Data

Run after the backend is started:

```bash
docker compose exec backend python -m app.seed_demo
```

Seeded accounts:

- `admin@example.com`
- `instructor@example.com`
- `student@example.com`

Password:

```txt
password123
```

The seed script is idempotent and can be rerun.

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
