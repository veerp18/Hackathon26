 Proceed to Phase 2: Report CRUD operations
backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/medical-responder-backend:latest
```

3. Deploy to ECS (see aws-full-stack-setup.md)

### Option 2: EC2 Instance

1. SSH into EC2 instance
2. Clone repository
3. Install dependencies
4. Run with PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name medical-responder-backend
pm2 save
pm2 startup
```

## Next Steps

1. ✅ Complete Phase 1 setup
2. Test authentication with Cognito
3. Test database connection
4. Test real-time sync
5.report change
await realtimeService.broadcastReportChange(reportId, {
  field: 'status',
  value: 'in_progress'
});
```

## Deployment

### Option 1: AWS ECS (Recommended)

1. Build Docker image:
```bash
docker build -t medical-responder-backend .
```

2. Push to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag medical-responder-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/medical-responder-localhost:3001');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Report update:', data);
};
```

## AWS Services Integration

### S3 Service
```typescript
import { s3Service } from './services/s3.service';

// Upload PDF
const key = await s3Service.uploadPDF(reportId, pdfBuffer, 'report.pdf');

// Get download URL
const url = await s3Service.getDownloadUrl(key);
```

### Realtime Service
```typescript
import { realtimeService } from './services/realtime.service';

// Broadcast users in organization
- `GET /api/users/:id` - Get user by ID

## Authentication

All API requests (except /health) require JWT token from AWS Cognito:

```
Authorization: Bearer <cognito-jwt-token>
```

## Real-time Sync

The backend uses AWS IoT Core for real-time synchronization:

**Topics:**
- `reports/{reportId}/updates` - Report changes
- `organizations/{orgId}/notifications` - Org-wide alerts
- `users/{userId}/messages` - User messages

**WebSocket Connection:**
```javascript
const ws = new WebSocket('ws://
### Health Check
- `GET /health` - Server health status

### Organizations (system_admin only)
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List all organizations
- `GET /api/organizations/:id` - Get organization
- `PATCH /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Users
- `POST /api/users` - Create user (system_admin only)
- `GET /api/users/me` - Get current user profile
- `GET /api/users/organization/:orgId` - List OGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx

# IoT Core
AWS_IOT_ENDPOINT=xxxxx-ats.iot.us-east-1.amazonaws.com

# S3
S3_BUCKET_NAME=medical-responder-reports-prod
```

### 4. Run Database Migrations

```bash
npm run migrate
```

This creates:
- organizations table
- users table (with cognito_sub field)
- reports table
- report_history table
- Indexes and triggers

### 5. Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3001

## API Endpoints
iables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your AWS values:

```bash
# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# RDS PostgreSQL
DB_HOST=medical-responder-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=medical_responder
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!
DB_SSL=true

# Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=your-client-id
C through:
- Creating RDS PostgreSQL instance
- Configuring Cognito User Pool
- Setting up IoT Core
- Creating S3 bucket
- IAM roles and permissions

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Varlete AWS stack:

- **Database**: AWS RDS PostgreSQL
- **Authentication**: AWS Cognito
- **Real-time Sync**: AWS IoT Core + WebSockets
- **File Storage**: AWS S3
- **Speech-to-Text**: AWS Transcribe (Phase 5)
- **AI/LLM**: OpenAI API or AWS Bedrock (Phase 5)

## Prerequisites

- Node.js 20+ installed
- AWS Account with appropriate permissions
- AWS CLI configured

## Phase 1 Setup

### 1. AWS Infrastructure Setup

Follow the comprehensive guide:
```bash
cat ../docs/aws-full-stack-setup.md
```

This will walk you# Medical Responder Backend - Full AWS Stack

## Architecture

This backend uses a comp