# Medical Responder Paperwork System - Step-by-Step Implementation Guide

## 📋 Table of Contents
1. [Phase 0: Planning & Setup](#phase-0-planning--setup)
2. [Phase 1: AWS Infrastructure](#phase-1-aws-infrastructure)
3. [Phase 2: Backend Foundation](#phase-2-backend-foundation)
4. [Phase 3: Report Management](#phase-3-report-management)
5. [Phase 4: Real-Time Sync (Next)](#phase-4-real-time-sync-next)
6. [Phase 5: Speech-to-Text (Next)](#phase-5-speech-to-text-next)
7. [Phase 6: AI Validation (Next)](#phase-6-ai-validation-next)
8. [Phase 7: PDF Export (Next)](#phase-7-pdf-export-next)

---

## Phase 0: Planning & Setup

### Step 1: Create Project Specification
**What:** Define requirements, design, and implementation plan
**How:** Used Kiro's spec workflow to create comprehensive documentation

**Files Created:**
- `.kiro/specs/medical-responder-paperwork-system/requirements.md`
- `.kiro/specs/medical-responder-paperwork-system/design.md`
- `.kiro/specs/medical-responder-paperwork-system/tasks.md`

**Key Decisions:**
- Python/FastAPI instead of TypeScript/Node.js
- PostgreSQL with JSONB for flexible report data
- AWS services (RDS, S3, Cognito, IoT Core) instead of Supabase
- 8 user roles with supervisor hierarchy

---

## Phase 1: AWS Infrastructure

### Step 1: Configure AWS Credentials
```bash
# Get credentials from AWS Workshop Studio
# https://catalog.us-east-1.prod.workshops.aws/event/dashboard/en-US

# Configure AWS CLI
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1)

# Set session token
export AWS_SESSION_TOKEN="<your-session-token>"
```

### Step 2: Create RDS PostgreSQL Database
```bash
aws rds create-db-instance \
  --db-instance-identifier cuhackit-medical-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password CuHackit2026! \
  --allocated-storage 20 \
  --publicly-accessible
```

**Wait 5-10 minutes for database to be available**

### Step 3: Configure Security Group
```bash
# Get your IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Get security group ID
SG_ID=$(aws rds describe-db-instances \
  --db-instance-identifier cuhackit-medical-db \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

# Allow your IP to connect
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr $MY_IP/32
```

### Step 4: Create S3 Bucket
```bash
aws s3 mb s3://cuhackit-medical-reports-2026
```

### Step 5: Create Cognito User Pool
```bash
aws cognito-idp create-user-pool \
  --pool-name cuhackit-medical-users \
  --auto-verified-attributes email \
  --username-attributes email

# Note the UserPoolId from output

# Create app client
aws cognito-idp create-user-pool-client \
  --user-pool-id <your-pool-id> \
  --client-name medical-app \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH

# Note the ClientId from output
```

### Step 6: Setup IoT Core
```bash
# Get IoT endpoint
aws iot describe-endpoint --endpoint-type iot:Data-ATS

# Create IoT policy
aws iot create-policy \
  --policy-name CuHackitMedicalPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["iot:*"],
      "Resource": ["*"]
    }]
  }'
```

---

## Phase 2: Backend Foundation

### Step 1: Setup Python Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 2: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Key Dependencies:**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlalchemy` - ORM
- `asyncpg` - Async PostgreSQL driver
- `alembic` - Database migrations
- `python-jose` - JWT handling
- `pydantic` - Data validation

### Step 3: Configure Environment Variables
Create `backend/.env`:
```env
PORT=3001
ENVIRONMENT=development

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_SESSION_TOKEN=<your-token>

DB_HOST=<your-rds-endpoint>
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=CuHackit2026!
DB_SSL=false

COGNITO_USER_POOL_ID=<your-pool-id>
COGNITO_CLIENT_ID=<your-client-id>
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/<your-pool-id>

AWS_IOT_ENDPOINT=<your-iot-endpoint>
S3_BUCKET_NAME=cuhackit-medical-reports-2026
```

### Step 4: Create Database Schema
```bash
# Create migration
./venv/bin/alembic revision --autogenerate -m "Initial schema"

# Apply migration
./venv/bin/alembic upgrade head
```

**Tables Created:**
- `organizations` - Police/medical organizations
- `users` - User accounts with roles
- `reports` - Incident/medical reports
- `report_history` - Version control

### Step 5: Create Cognito Users
```bash
# Run the user creation script
./create_cognito_users.sh
```

**Users Created:**
- admin@cuhackit.com (system_admin)
- dispatcher@cuhackit.com (dispatcher)
- police-worker@cuhackit.com (police_worker)
- police-chief@cuhackit.com (police_chief)
- triage-nurse@cuhackit.com (triage_nurse)
- er-doctor@cuhackit.com (er_doctor)
- er-paramedic@cuhackit.com (er_paramedic)
- er-attending@cuhackit.com (er_attending)

### Step 6: Seed Database
```bash
./venv/bin/python seed_database.py
```

**Data Created:**
- 2 organizations (City Police Department, City General Hospital)
- 8 users linked to organizations
- Supervisor relationships

### Step 7: Start Server
```bash
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

**Test:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","environment":"development","timestamp":"..."}
```

### Step 8: Test Authentication
```bash
# Get JWT token
TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id <your-client-id> \
  --auth-parameters USERNAME=admin@cuhackit.com,PASSWORD=Admin123! \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/users/me
```

---

## Phase 3: Report Management

### Step 1: Create Report Service
**File:** `backend/app/services/report_service.py`

**Implements:**
- CRUD operations (create, read, update, delete)
- State machine validation
- Permission checking
- Version history tracking

### Step 2: Create Report Routes
**File:** `backend/app/routes/reports.py`

**Endpoints:**
- `POST /api/reports/` - Create report
- `GET /api/reports/` - List reports
- `GET /api/reports/{id}` - Get report
- `PATCH /api/reports/{id}` - Update report
- `DELETE /api/reports/{id}` - Delete report
- `GET /api/reports/{id}/history` - Get history

### Step 3: Update Schemas
**File:** `backend/app/schemas.py`

**Added:**
- `ReportHistory` schema for version tracking

### Step 4: Register Router
**File:** `backend/app/main.py`

```python
from app.routes import reports
app.include_router(reports.router)
```

### Step 5: Test Report Lifecycle
```bash
./test_reports.sh
```

**Test Flow:**
1. Create incident report (draft)
2. Update with details (version 2)
3. Change state to in_progress
4. Submit for review (under_review)
5. View version history
6. Lock report (police chief)
7. Verify locked reports can't be edited
8. List reports by assignment

---

## Phase 4: Real-Time Sync (Next)

### What to Implement:
1. **AWS IoT Core Integration**
   - Connect to IoT endpoint
   - Create topics for each organization
   - Publish report updates
   - Subscribe to real-time changes

2. **WebSocket Support**
   - Add WebSocket endpoint to FastAPI
   - Broadcast changes to connected clients
   - Handle connection management

3. **Frontend Integration**
   - Connect to WebSocket
   - Listen for report updates
   - Update UI in real-time

### Files to Create:
- `backend/app/services/iot_service.py`
- `backend/app/routes/websocket.py`
- `backend/app/middleware/websocket_auth.py`

---

## Phase 5: Speech-to-Text (Next)

### What to Implement:
1. **Audio Upload**
   - Accept audio files via API
   - Upload to S3
   - Trigger transcription

2. **AWS Transcribe Integration**
   - Create Lambda function
   - Process audio files
   - Extract text

3. **Field Mapping**
   - Parse transcription
   - Map to report fields
   - Update report data

### Files to Create:
- `backend/app/routes/transcription.py`
- `backend/lambdas/transcribe/lambda_function.py`
- `backend/app/services/transcription_service.py`

---

## Phase 6: AI Validation (Next)

### What to Implement:
1. **OpenAI Integration**
   - Connect to OpenAI API
   - Send report data for analysis
   - Receive suggestions

2. **Validation Rules**
   - Check for missing fields
   - Detect inconsistencies
   - Flag hallucinations

3. **Suggestion System**
   - Provide field suggestions
   - Highlight issues
   - Offer corrections

### Files to Create:
- `backend/app/services/ai_validation_service.py`
- `backend/app/routes/validation.py`

---

## Phase 7: PDF Export (Next)

### What to Implement:
1. **PDF Generation**
   - Create Lambda function
   - Use template engine
   - Generate formatted PDFs

2. **S3 Storage**
   - Store PDFs in S3
   - Generate signed URLs
   - Set expiration times

3. **Download API**
   - Endpoint to request PDF
   - Return signed URL
   - Track downloads

### Files to Create:
- `backend/lambdas/export_pdf/lambda_function.py`
- `backend/app/routes/export.py`
- `backend/app/services/pdf_service.py`

---

## 🎯 Current Status

### ✅ Completed
- Phase 0: Planning & Specification
- Phase 1: AWS Infrastructure Setup
- Phase 2: Backend Foundation (Auth, Database, Users)
- Phase 3: Report Management (CRUD, State Machine, Permissions)

### 🚧 In Progress
- None

### 📋 Todo
- Phase 4: Real-Time Sync
- Phase 5: Speech-to-Text
- Phase 6: AI Validation
- Phase 7: PDF Export
- Frontend React Application

---

## 📚 Key Commands Reference

### Development
```bash
# Start backend server
cd backend && ./venv/bin/uvicorn app.main:app --reload

# Run migrations
./venv/bin/alembic upgrade head

# Create new migration
./venv/bin/alembic revision --autogenerate -m "Description"

# Seed database
./venv/bin/python seed_database.py

# Run tests
./test_reports.sh
```

### AWS
```bash
# Get JWT token
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id <client-id> \
  --auth-parameters USERNAME=<email>,PASSWORD=<password> \
  --query 'AuthenticationResult.IdToken' \
  --output text

# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier cuhackit-medical-db

# List S3 buckets
aws s3 ls

# Check IoT endpoint
aws iot describe-endpoint --endpoint-type iot:Data-ATS
```

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Get current user
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/users/me

# List organizations
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/organizations/

# Create report
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"schema_type":"incident","assigned_to":"<user-id>","data":{}}' \
  http://localhost:3001/api/reports/

# List my reports
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/reports/?assigned_to_me=true"
```

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql -h <rds-endpoint> -U postgres -d postgres

# Check security group
aws ec2 describe-security-groups --group-ids <sg-id>

# Update security group
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 5432 \
  --cidr <your-ip>/32
```

### Authentication Issues
```bash
# Verify Cognito user
aws cognito-idp admin-get-user \
  --user-pool-id <pool-id> \
  --username <email>

# Reset password
aws cognito-idp admin-set-user-password \
  --user-pool-id <pool-id> \
  --username <email> \
  --password <new-password> \
  --permanent
```

### Server Issues
```bash
# Check logs
tail -f backend/logs/app.log

# Kill process on port
lsof -ti:3001 | xargs kill -9

# Restart server
cd backend && ./venv/bin/uvicorn app.main:app --reload
```

---

## 📖 Documentation

- **API Docs:** http://localhost:3001/docs (Swagger UI)
- **ReDoc:** http://localhost:3001/redoc
- **Setup Guide:** `SETUP_GUIDE.md`
- **Phase 3 Details:** `PHASE3_REPORT_MANAGEMENT.md`
- **AWS Resources:** `AWS_RESOURCES_CREATED.md`
- **User Credentials:** `COGNITO_USERS.md` (not committed)

---

## 🎉 Success Criteria

### Phase 3 Complete When:
- ✅ Reports can be created, read, updated, deleted
- ✅ State machine enforces valid transitions
- ✅ Version history tracks all changes
- ✅ Permissions work correctly for all roles
- ✅ Tests pass successfully
- ✅ API documentation is complete

### Ready for Phase 4 When:
- All Phase 3 criteria met
- Backend server is stable
- Database is properly seeded
- Authentication is working
- All tests are passing

---

**Last Updated:** February 27, 2026
**Current Phase:** Phase 3 Complete ✅
**Next Phase:** Phase 4 - Real-Time Sync
