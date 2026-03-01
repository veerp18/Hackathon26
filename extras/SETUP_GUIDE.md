# Backend Setup Guide

## ✅ Completed Setup Steps

### 1. AWS Resources Created
- **RDS PostgreSQL Database**: `cuhackit-medical-db.cwhm2ue8ue4j.us-east-1.rds.amazonaws.com`
- **S3 Bucket**: `cuhackit-medical-reports-2026`
- **Cognito User Pool**: `us-east-1_f1TbJfhiB`
- **IoT Core Endpoint**: `a1o0mo582ll1jl-ats.iot.us-east-1.amazonaws.com`

### 2. Python Backend Environment
- Python 3.13 virtual environment created
- All dependencies installed (FastAPI, SQLAlchemy, asyncpg, etc.)
- Database migrations created and applied
- FastAPI server running on http://localhost:3001

### 3. Database Schema
The following tables have been created:
- `organizations` - Stores police/medical organizations
- `users` - User accounts with role-based access
- `reports` - Incident reports and medical charts (JSONB data)
- `report_history` - Version history for reports

### 4. Cognito Users Created
8 test users created with different roles (see COGNITO_USERS.md for credentials)

### 5. Database Seeded
- 2 organizations created (City Police Department, City General Hospital)
- 8 users created and linked to organizations
- Supervisor relationships established

## 🎉 Current Status

✅ Backend infrastructure is ready
✅ Database schema is deployed
✅ API server is running
✅ Authentication is working
✅ Test users are created
✅ Organizations are seeded

## 🧪 Testing the API

### Get a JWT Token
```bash
TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 8pa1a78u7v7ko95a1es4mgrbk \
  --auth-parameters USERNAME=admin@cuhackit.com,PASSWORD=Admin123! \
  --query 'AuthenticationResult.IdToken' \
  --output text)
```

### Test Endpoints
```bash
# Get current user info
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/users/me

# List all organizations (system_admin only)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/organizations/

# Get specific organization
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/organizations/{org_id}
```

## 🚀 Next Steps

### Phase 3: Report Management

1. **Implement Report Endpoints**
   - Create report creation endpoint
   - Implement real-time sync with AWS IoT Core
   - Add report state transitions (draft → in_progress → under_review → locked)

2. **Test Report Lifecycle**
   - Create a draft report
   - Edit and update the report
   - Submit for review
   - Lock the report

### Phase 4: Speech-to-Text Integration

1. **Implement AWS Transcribe Integration**
   - Create Lambda function for transcription
   - Connect to S3 for audio file storage
   - Parse transcription results into report fields

### Phase 5: AI Validation

1. **Implement OpenAI Integration**
   - Create validation endpoint
   - Check for missing information
   - Detect hallucinations/inconsistencies

### Phase 6: PDF Export

1. **Implement PDF Generation**
   - Create Lambda function for PDF export
   - Store PDFs in S3
   - Generate signed URLs for download

## 📝 API Documentation

Access the interactive API documentation at:
- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

## 🔧 Development Commands

```bash
# Start the backend server
cd backend
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload

# Run database migrations
./venv/bin/alembic upgrade head

# Create a new migration
./venv/bin/alembic revision --autogenerate -m "Description"

# Seed the database
./venv/bin/python seed_database.py

# Check database connection
./venv/bin/python -c "from app.database import engine; print(engine.url)"
```

## 📚 Available Test Users

See `COGNITO_USERS.md` for complete list of test users and their credentials.

Quick reference:
- System Admin: admin@cuhackit.com / Admin123!
- Dispatcher: dispatcher@cuhackit.com / Dispatch123!
- Police Worker: police-worker@cuhackit.com / Worker123!
- Police Chief: police-chief@cuhackit.com / Chief123!
- ER Doctor: er-doctor@cuhackit.com / Doctor123!
- ER Paramedic: er-paramedic@cuhackit.com / Paramedic123!
- ER Attending: er-attending@cuhackit.com / Attending123!
- Triage Nurse: triage-nurse@cuhackit.com / Nurse123!
