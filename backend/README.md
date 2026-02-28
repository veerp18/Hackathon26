# Medical Responder Backend - Python/FastAPI

## Architecture

Full AWS stack with Python/FastAPI:

- **Framework**: FastAPI (async Python web framework)
- **Database**: AWS RDS PostgreSQL with SQLAlchemy ORM
- **Authentication**: AWS Cognito with JWT verification
- **Real-time Sync**: AWS IoT Core
- **File Storage**: AWS S3
- **Migrations**: Alembic

## Prerequisites

- Python 3.11+
- AWS Account with workshop credentials
- AWS CLI configured

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in AWS values:

```bash
cp .env.example .env
```

### 4. Run Database Migrations

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 5. Start Development Server

```bash
python -m app.main
# or
uvicorn app.main:app --reload --port 3001
```

Server runs on http://localhost:3001

## API Documentation

FastAPI provides automatic interactive API docs:

- **Swagger UI**: http://localhost:3001/docs
- **ReDoc**: http://localhost:3001/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── middleware/
│   │   └── auth.py          # Cognito JWT authentication
│   ├── routes/
│   │   ├── organizations.py # Organization endpoints
│   │   └── users.py         # User endpoints
│   └── services/
│       ├── organization_service.py
│       ├── user_service.py
│       ├── s3_service.py
│       └── realtime_service.py
├── alembic/                 # Database migrations
├── requirements.txt
├── Dockerfile
└── .env
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Organizations
- `POST /api/organizations` - Create organization (system_admin)
- `GET /api/organizations` - List all organizations (system_admin)
- `GET /api/organizations/{id}` - Get organization
- `PATCH /api/organizations/{id}` - Update organization (system_admin)
- `DELETE /api/organizations/{id}` - Delete organization (system_admin)

### Users
- `POST /api/users` - Create user (system_admin)
- `GET /api/users/me` - Get current user profile
- `GET /api/users/organization/{org_id}` - List users in organization
- `GET /api/users/{id}` - Get user by ID
- `PATCH /api/users/{id}` - Update user (system_admin)
- `DELETE /api/users/{id}` - Delete user (system_admin)

## Authentication

All endpoints (except `/health`) require JWT token from AWS Cognito:

```bash
curl -H "Authorization: Bearer <cognito-jwt-token>" \
  http://localhost:3001/api/users/me
```

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## AWS Services Integration

### S3 Service
```python
from app.services.s3_service import S3Service

# Upload PDF
key = await S3Service.upload_pdf(report_id, pdf_bytes, "report.pdf")

# Get download URL
url = await S3Service.get_download_url(key)
```

### Realtime Service
```python
from app.services.realtime_service import RealtimeService

# Broadcast report change
await RealtimeService.broadcast_report_change(report_id, {
    "field": "status",
    "value": "in_progress"
})
```

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Deployment

### Docker

```bash
# Build image
docker build -t medical-responder-backend .

# Run container
docker run -p 3001:3001 --env-file .env medical-responder-backend
```

### AWS ECS

See `../docs/aws-full-stack-setup.md` for ECS deployment instructions.

## Development

```bash
# Format code
black app/

# Lint code
flake8 app/

# Type checking
mypy app/
```

## Next Steps

1. ✅ Complete Phase 1 setup
2. Test authentication with Cognito
3. Test database connection
4. Test real-time sync with IoT Core
5. Proceed to Phase 2: Report CRUD operations
