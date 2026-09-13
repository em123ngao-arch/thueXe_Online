# DriveShare Backend

FastAPI authentication and RBAC starter using async SQLAlchemy 2.0.

## Run locally

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for Swagger UI.

SQLite is the default demo database. For PostgreSQL, set:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/driveshare
```

Self-registration accepts only `CUSTOMER` and `OWNER`. Create or promote an `ADMIN` through a controlled admin/migration process; never accept `ADMIN` from public registration.

## Main endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `GET /api/v1/cars/my-cars` (OWNER)
- `GET /api/v1/users/admin/users` (ADMIN)
