# AWS Resources Created for CU Hackit 2026

## ✅ Resources Successfully Created

### 1. AWS Cognito User Pool
- **User Pool ID**: `us-east-1_f1TbJfhiB`
- **App Client ID**: `8pa1a78u7v7ko95a1es4mgrbk`
- **Issuer**: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_f1TbJfhiB`
- **Status**: ✅ Ready to use

**Test Authentication:**
```bash
# Create a test user
export PATH=$PATH:~/.local/bin && aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_f1TbJfhiB \
  --username admin@test.com \
  --user-attributes Name=email,Value=admin@test.com \
  --temporary-password TempPass123!
```

### 2. AWS S3 Bucket
- **Bucket Name**: `cuhackit-medical-reports-2026`
- **Region**: `us-east-1`
- **Status**: ✅ Ready to use

**Test Upload:**
```bash
export PATH=$PATH:~/.local/bin && echo "test" > test.txt
export PATH=$PATH:~/.local/bin && aws s3 cp test.txt s3://cuhackit-medical-reports-2026/
export PATH=$PATH:~/.local/bin && aws s3 ls s3://cuhackit-medical-reports-2026/
```

### 3. AWS IoT Core
- **Endpoint**: `a1o0mo582ll1jl-ats.iot.us-east-1.amazonaws.com`
- **Policy**: `CuHackitMedicalPolicy` (allows all IoT operations)
- **Status**: ✅ Ready to use

**Topics:**
- `reports/{reportId}/updates` - Report changes
- `organizations/{orgId}/notifications` - Org notifications
- `users/{userId}/messages` - User messages

### 4. AWS RDS PostgreSQL Database
- **Instance ID**: `cuhackit-medical-db`
- **Engine**: PostgreSQL 15.4
- **Instance Class**: db.t3.micro
- **Storage**: 20 GB
- **Username**: `postgres`
- **Password**: `CuHackit2026!`
- **Status**: ⏳ Creating (takes 5-10 minutes)

**Check Status:**
```bash
export PATH=$PATH:~/.local/bin && aws rds describe-db-instances \
  --db-instance-identifier cuhackit-medical-db \
  --query 'DBInstances[0].[Endpoint.Address,DBInstanceStatus]' \
  --output table
```

**Get Endpoint (once available):**
```bash
export PATH=$PATH:~/.local/bin && aws rds describe-db-instances \
  --db-instance-identifier cuhackit-medical-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

## Next Steps

### 1. Wait for RDS Database (5-10 minutes)

Check status every minute:
```bash
export PATH=$PATH:~/.local/bin && aws rds describe-db-instances \
  --db-instance-identifier cuhackit-medical-db \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text
```

When it shows `available`, get the endpoint:
```bash
export PATH=$PATH:~/.local/bin && aws rds describe-db-instances \
  --db-instance-identifier cuhackit-medical-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### 2. Update backend/.env

Replace `<PENDING-check-in-5-minutes>` with the RDS endpoint address.

### 3. Set Up Python Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Run Database Migrations

```bash
# Once RDS is available
alembic upgrade head
```

### 5. Start Backend Server

```bash
python -m app.main
```

Server will run on http://localhost:3001

### 6. Test API

Visit http://localhost:3001/docs for interactive API documentation

## Resource Cleanup (After Hackathon)

```bash
# Delete RDS instance
export PATH=$PATH:~/.local/bin && aws rds delete-db-instance \
  --db-instance-identifier cuhackit-medical-db \
  --skip-final-snapshot

# Delete S3 bucket (must be empty first)
export PATH=$PATH:~/.local/bin && aws s3 rb s3://cuhackit-medical-reports-2026 --force

# Delete Cognito User Pool
export PATH=$PATH:~/.local/bin && aws cognito-idp delete-user-pool \
  --user-pool-id us-east-1_f1TbJfhiB

# Delete IoT Policy
export PATH=$PATH:~/.local/bin && aws iot delete-policy \
  --policy-name CuHackitMedicalPolicy
```

## Cost Estimate

All resources are within AWS Free Tier or minimal cost:
- RDS db.t3.micro: ~$0.017/hour (~$0.41/day)
- S3 storage: ~$0.023/GB/month
- Cognito: Free for <50K MAU
- IoT Core: $1 per million messages

**Total estimated cost for 2-day hackathon**: ~$1-2

## Troubleshooting

### Can't connect to RDS
- Wait until status is `available`
- Check security group allows your IP
- Verify credentials in `.env`

### Cognito authentication fails
- Check User Pool ID and Client ID in `.env`
- Verify user exists in pool
- Check password meets requirements

### S3 upload fails
- Verify bucket name is correct
- Check AWS credentials are valid
- Ensure bucket is in us-east-1

## Support

- AWS Workshop Dashboard: https://catalog.us-east-1.prod.workshops.aws/event/dashboard/en-US
- Setup Guide: `SETUP_GUIDE.md`
- Backend README: `backend/README.md`
