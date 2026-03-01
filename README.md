# 911 Notebook

AI-powered voice-to-text incident reporting system for first responders (police and medical personnel).

## 🎯 Overview

911 Notebook allows first responders to create detailed incident reports using voice recording. The system automatically transcribes audio and uses AI to extract structured data into standardized report formats.

**Key Features:**
- 🎤 Voice recording on mobile devices
- 🤖 AI-powered transcription (AWS Transcribe)
- 📝 Intelligent report parsing (AWS Bedrock Claude 3.5 Sonnet)
- 🔒 Role-based access control
- 📱 Real-time synchronization
- 📄 PDF export

---

## 🏗️ Architecture

### Frontend
- **Framework:** React Native with Expo SDK 54
- **Language:** TypeScript
- **Platform:** iOS/Android mobile app

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Database:** PostgreSQL 15 (AWS RDS)
- **ORM:** SQLAlchemy 2.0 (async)

### AWS Services
- **Cognito** - User authentication
- **S3** - Audio/file storage
- **Lambda** - Serverless AI processing
- **Transcribe** - Speech-to-text
- **Bedrock** - AI report parsing (Claude 3.5 Sonnet)
- **IoT Core** - Real-time notifications

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (use nvm)
- Python 3.11+
- AWS CLI configured
- Expo Go app on mobile device

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your AWS credentials

# Run database migrations
alembic upgrade head

# Seed database with test data
python seed_database.py

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

Backend will be available at `http://localhost:3001`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend/911-notebook

# Use Node 20
nvm use 20

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your laptop's IP address

# Start Expo
npm start
```

Scan the QR code with Expo Go app to run on your phone.

---

## 🧪 Testing

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| System Admin | admin@cuhackit.com | Admin123! |
| Police Worker | police-worker@cuhackit.com | Worker123! |
| Police Chief | police-chief@cuhackit.com | Chief123! |
| ER Doctor | er-doctor@cuhackit.com | Doctor123! |
| ER Paramedic | er-paramedic@cuhackit.com | Paramedic123! |

See `COGNITO_USERS.md` for complete list.

### API Testing

```bash
# Get JWT token
TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 8pa1a78u7v7ko95a1es4mgrbk \
  --auth-parameters USERNAME=admin@cuhackit.com,PASSWORD=Admin123! \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/users/me
```

---

## 📱 Mobile App Usage

1. **Login** - Use test credentials
2. **Navigate to Report** - Tap "New Report" button
3. **Record Voice** - Hold mic button to record
4. **Submit** - Audio is uploaded and processed
5. **View Report** - AI-generated structured report appears

---

## 🔄 Voice-to-Report Flow

```
1. User records voice → Mobile App
2. Upload audio → Backend API (/api/reports/voice-memo)
3. Backend uploads → S3 bucket
4. Backend triggers → Lambda (Transcribe)
5. AWS Transcribe → Text transcript
6. Backend triggers → Lambda (Parse)
7. Claude 3.5 Sonnet → Structured JSON
8. Backend creates → Report in database
9. Backend publishes → IoT notification
10. Mobile receives → Real-time update
```

---

## 📚 API Documentation

Interactive API docs available at:
- **Swagger UI:** http://localhost:3001/docs
- **ReDoc:** http://localhost:3001/redoc

### Key Endpoints

```
POST   /api/reports/voice-memo    - Upload voice recording
GET    /api/reports/               - List reports
GET    /api/reports/{id}           - Get report details
PATCH  /api/reports/{id}           - Update report
GET    /api/users/me               - Current user profile
GET    /api/organizations/         - List organizations
```

---

## 🗄️ Database Schema

### Organizations
- Police departments
- Medical facilities

### Users
- Linked to organizations
- Role-based permissions
- Supervisor hierarchy

### Reports
- JSONB data structure
- Version history tracking
- State machine (draft → in_progress → under_review → locked)

### Report History
- Audit trail
- Version control
- Change tracking

---

## 🔒 Security

- **Authentication:** AWS Cognito with JWT tokens
- **Authorization:** Role-based access control (RBAC)
- **Data Isolation:** Organization-level data separation
- **Encryption:** S3 server-side encryption, HTTPS only
- **SQL Injection:** Protected via SQLAlchemy ORM

---

## 🛠️ Development

### Backend Commands

```bash
# Start server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Seed database
python seed_database.py
```

### Frontend Commands

```bash
# Start with Node 20
./start-with-node20.sh

# Start clean (clear cache)
./start-clean.sh

# Run on specific platform
npm run ios
npm run android
npm run web
```

---

## 📦 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # DB connection
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   └── middleware/          # Auth middleware
│   ├── alembic/                 # Database migrations
│   ├── lambdas/                 # AWS Lambda functions
│   └── seed_database.py         # Test data seeding
│
├── frontend/911-notebook/
│   ├── app/                     # Expo Router screens
│   │   ├── index.tsx            # Login screen
│   │   ├── home.tsx             # Dashboard
│   │   └── report.tsx           # Report creation
│   ├── components/              # React components
│   ├── services/                # API services
│   └── .env                     # Environment config
│
└── docs/
    ├── ARCHITECTURE_OVERVIEW.md
    ├── TECH_STACK.md
    ├── SETUP_GUIDE.md
    └── COGNITO_USERS.md
```

---

## 🐛 Known Issues

- **Voice Upload 422 Error:** FormData format issue between React Native and FastAPI
- **Authentication:** Amplify vs custom authService conflict in some screens

---

## 📖 Additional Documentation

- **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - Complete system architecture
- **[Tech Stack](TECH_STACK.md)** - Detailed technology breakdown
- **[Setup Guide](SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[Cognito Users](COGNITO_USERS.md)** - Test user credentials
- **[Architecture Diagram](ARCHITECTURE_DIAGRAM.md)** - Visual flowcharts

---

## 🤝 Contributing

This is a hackathon project for CUhackit 2026.

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review API docs at http://localhost:3001/docs
3. Check backend logs: `tail -f backend/server.log`
4. Check Expo console for frontend errors

---

## 🎓 Team

Built for CUhackit 2026 Hackathon
