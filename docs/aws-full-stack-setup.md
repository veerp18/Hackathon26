# Full AWS Stack Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud Services                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Cognito    │  │  API Gateway │  │   Lambda/ECS │      │
│  │     Auth     │  │              │  │   Backend    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  RDS Postgres│  │   IoT Core   │  │      S3      │      │
│  │   Database   │  │  Real-time   │  │  PDF Storage │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Transcribe  │  │   Bedrock    │                         │
│  │ Speech-to-Text│  │  AI/LLM     │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Core Infrastructure Setup

### 1. AWS RDS PostgreSQL Database

**Create RDS Instance:**

```bash
aws rds create-db-instance \
  --db-instance-identifier medical-responder-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --publicly-accessible false \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]'
```

**Configuration:**
- Instance: db.t3.medium (2 vCPU, 4 GB RAM)
- Storage: 20 GB GP3 (expandable)
- Multi-AZ: Enable for production
- Encryption: Enabled
- Backups: 7-day retention

**Get Connection Details:**
```bash
aws rds describe-db-instances \
  --db-instance-identifier medical-responder-db \
  --query 'DBInstances[0].Endpoint'
```

Update `.env`:
```bash
DB_HOST=medical-responder-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=medical_responder
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!
DB_SSL=true
```

### 2. AWS Cognito User Pool

Follow the guide in `phase1-aws-cognito-setup.md`

### 3. AWS IoT Core (Real-time Sync)

**Create IoT Thing:**

```bash
# Create IoT policy
aws iot create-policy \
  --policy-name MedicalResponderPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["iot:Connect", "iot:Publish", "iot:Subscribe", "iot:Receive"],
      "Resource": "*"
    }]
  }'

# Get IoT endpoint
aws iot describe-endpoint --endpoint-type iot:Data-ATS
```

Update `.env`:
```bash
AWS_IOT_ENDPOINT=xxxxx-ats.iot.us-east-1.amazonaws.com
```

**Topic Structure:**
- `reports/{reportId}/updates` - Report change notifications
- `organizations/{orgId}/notifications` - Organization-wide alerts
- `users/{userId}/messages` - User-specific messages

### 4. AWS S3 Bucket (PDF Storage)

**Create S3 Bucket:**

```bash
aws s3api create-bucket \
  --bucket medical-responder-reports-prod \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket medical-responder-reports-prod \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket medical-responder-reports-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Set lifecycle policy (optional - archive old reports)
aws s3api put-bucket-lifecycle-configuration \
  --bucket medical-responder-reports-prod \
  --lifecycle-configuration file://s3-lifecycle.json
```

**s3-lifecycle.json:**
```json
{
  "Rules": [{
    "Id": "ArchiveOldReports",
    "Status": "Enabled",
    "Transitions": [{
      "Days": 90,
      "StorageClass": "GLACIER"
    }],
    "NoncurrentVersionExpiration": {
      "NoncurrentDays": 30
    }
  }]
}
```

Update `.env`:
```bash
S3_BUCKET_NAME=medical-responder-reports-prod
```

### 5. IAM Roles and Permissions

**Create IAM User for Backend:**

```bash
aws iam create-user --user-name medical-responder-backend

# Attach policies
aws iam attach-user-policy \
  --user-name medical-responder-backend \
  --policy-arn arn:aws:iam::aws:policy/AmazonRDSFullAccess

aws iam attach-user-policy \
  --user-name medical-responder-backend \
  --policy-arn arn:aws:iam::aws:policy/AWSIoTDataAccess

aws iam attach-user-policy \
  --user-name medical-responder-backend \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name medical-responder-backend
```

Update `.env`:
```bash
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Deployment Options

### Option 1: AWS ECS (Recommended for Production)

**Benefits:**
- Auto-scaling
- Load balancing
- Container orchestration
- Easy updates

**Setup:**
1. Create ECR repository
2. Build and push Docker image
3. Create ECS cluster
4. Define task definition
5. Create service with ALB

### Option 2: AWS Lambda + API Gateway

**Benefits:**
- Serverless (no server management)
- Pay per request
- Auto-scaling
- Lower cost for low traffic

**Limitations:**
- Cold starts
- 15-minute timeout
- Complex for WebSocket connections

### Option 3: EC2 Instance

**Benefits:**
- Full control
- Simple deployment
- Good for development

**Setup:**
1. Launch EC2 instance (t3.medium)
2. Install Node.js
3. Clone repository
4. Run with PM2

## Cost Estimation (Monthly)

**Development Environment:**
- RDS db.t3.micro: $15
- EC2 t3.micro: $8
- S3 storage (10 GB): $0.23
- IoT Core (1M messages): $1
- Cognito (MAU < 50K): Free
- **Total: ~$25/month**

**Production Environment:**
- RDS db.t3.medium Multi-AZ: $120
- ECS Fargate (2 tasks): $60
- ALB: $20
- S3 storage (100 GB): $2.30
- IoT Core (10M messages): $10
- Cognito (10K MAU): $27.50
- **Total: ~$240/month**

## Security Best Practices

1. **VPC Configuration:**
   - Place RDS in private subnet
   - Use security groups to restrict access
   - Enable VPC Flow Logs

2. **Encryption:**
   - Enable RDS encryption at rest
   - Use SSL/TLS for all connections
   - Enable S3 encryption

3. **IAM:**
   - Use least privilege principle
   - Rotate access keys regularly
   - Enable MFA for console access

4. **Monitoring:**
   - Enable CloudWatch logs
   - Set up alarms for errors
   - Monitor RDS performance metrics

## Next Steps

1. ✅ Set up RDS PostgreSQL
2. ✅ Configure Cognito User Pool
3. ✅ Create IoT Core resources
4. ✅ Set up S3 bucket
5. ✅ Create IAM user and policies
6. Run database migrations
7. Deploy backend application
8. Test authentication flow
9. Test real-time sync
10. Proceed to Phase 2 (Report CRUD)
