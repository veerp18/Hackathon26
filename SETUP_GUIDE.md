# Quick Start Guide - CU Hackit 2026

## Team Collaboration Workflow

### 1. Pull Latest Changes
```bash
git pull origin main
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes and Commit
```bash
git add .
git commit -m "feat: description of your changes"
```

### 4. Push and Create PR
```bash
git push origin feature/your-feature-name
# Then create Pull Request on GitHub
```

### 5. Handle Merge Conflicts
If you get conflicts:
```bash
git pull origin main --rebase
# Fix conflicts in your editor
git add .
git rebase --continue
git push origin feature/your-feature-name --force-with-lease
```

## AWS Workshop Studio Setup

### Step 1: Get AWS Credentials

1. Go to: https://catalog.us-east-1.prod.workshops.aws/event/dashboard/en-US
2. Access code: `64d7-16b3f1-6a`
3. Click "Open AWS console" button
4. Click "Get AWS CLI credentials" or "Command line or programmatic access"
5. Copy the credentials shown

### Step 2: Configure Backend

Update `backend/.env` with your credentials:
```bash
AWS_ACCESS_KEY_ID=ASIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
```

**Note:** Workshop credentials expire after the event ends (1 day 20 hours remaining)

### Step 3: Create AWS Resources

```bash
# Install AWS CLI if needed
# macOS: brew install awscli
# Linux: sudo apt install awscli

# Configure AWS CLI with workshop credentials
aws configure set aws_access_key_id <your-key>
aws configure set aws_secret_access_key <your-secret>
aws configure set aws_session_token <your-token>
aws configure set region us-east-1

# Verify access
aws sts get-caller-identity
```

### Step 4: Create RDS Database

```bash
# Create RDS PostgreSQL instance (takes ~10 minutes)
aws rds create-db-instance \
  --db-instance-identifier cuhackit-medical-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password CuHackit2026! \
  --allocated-storage 20 \
  --publicly-accessible \
  --backup-retention-period 0

# Wait for it to be available
aws rds wait db-instance-available --db-instance-identifier cuhackit-medical-db

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier cuhackit-medical-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Step 5: Create Cognito User Pool

```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name cuhackit-medical-users \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}" \
  --schema Name=email,Required=true \
  --auto-verified-attributes email

# Get User Pool ID from output, then create app client
aws cognito-idp create-user-pool-client \
  --user-pool-id <user-pool-id> \
  --client-name medical-responder-web \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

### Step 6: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://cuhackit-medical-reports-2026

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket cuhackit-medical-reports-2026 \
  --versioning-configuration Status=Enabled
```

### Step 7: Create IoT Core Resources

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
      "Resource": "*"
    }]
  }'
```

### Step 8: Update .env File

Copy all the values you got from above commands into `backend/.env`

### Step 9: Run Database Migrations

```bash
cd backend
npm install
npm run migrate
```

### Step 10: Start Backend

```bash
npm run dev
```

## Project Structure

```
Hackathon26/
├── backend/              # Node.js/TypeScript backend
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── db/          # Database client & migrations
│   │   ├── middleware/  # Auth middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── types/       # TypeScript types
│   └── package.json
├── frontend/            # React frontend (to be built)
├── docs/               # Documentation
└── .kiro/              # Spec files
    └── specs/
        └── medical-responder-paperwork-system/
            ├── requirements.md
            ├── design.md
            └── tasks.md (to be created)
```

## Development Phases

- ✅ **Phase 1**: Database & Authentication (Current)
- ⏳ **Phase 2**: Report CRUD Operations
- ⏳ **Phase 3**: Real-time Sync
- ⏳ **Phase 4**: Frontend Foundation
- ⏳ **Phase 5**: Speech & AI Features
- ⏳ **Phase 6**: PDF Export & Polish

## Useful Commands

```bash
# Backend
cd backend
npm run dev          # Start dev server
npm run build        # Build for production
npm run migrate      # Run database migrations

# Git
git status           # Check status
git log --oneline    # View commit history
git pull --rebase    # Pull with rebase
git push             # Push commits

# AWS
aws sts get-caller-identity  # Check AWS credentials
aws rds describe-db-instances # List RDS instances
aws s3 ls                     # List S3 buckets
```

## Troubleshooting

### AWS Credentials Expired
Workshop credentials expire after the event. Get new ones from the workshop dashboard.

### Database Connection Failed
- Check security group allows your IP
- Verify RDS instance is running
- Check credentials in .env

### Merge Conflicts
```bash
git pull origin main --rebase
# Fix conflicts in editor
git add .
git rebase --continue
```

## Resources

- AWS Workshop: https://catalog.us-east-1.prod.workshops.aws/event/dashboard/en-US
- GitHub Repo: https://github.com/veerp18/Hackathon26
- Design Doc: `.kiro/specs/medical-responder-paperwork-system/design.md`
- AWS Setup: `docs/aws-full-stack-setup.md`
