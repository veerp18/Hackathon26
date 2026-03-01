# Getting AWS Credentials from Workshop Studio

## Step-by-Step Guide

### 1. Access Workshop Dashboard

Go to: https://catalog.us-east-1.prod.workshops.aws/event/dashboard/en-US

Access code: `64d7-16b3f1-6a`

### 2. Get Temporary Credentials

You have two options:

#### Option A: AWS Console Access (GUI)
1. Click the **"Open AWS console"** button (blue button on your dashboard)
2. This opens the AWS Console in a new tab
3. You're now logged in with temporary credentials

#### Option B: CLI/Programmatic Access (For Backend)
1. On the workshop dashboard, look for **"Get AWS CLI credentials"** link
2. OR click **"AWS Details"** → **"Show"** next to "AWS CLI"
3. You'll see three values:
   ```bash
   export AWS_ACCESS_KEY_ID="ASIA..."
   export AWS_SECRET_ACCESS_KEY="..."
   export AWS_SESSION_TOKEN="..."
   ```

### 3. Copy the Credentials

Copy all three values. They look like:
- `AWS_ACCESS_KEY_ID`: Starts with `ASIA...` (20 characters)
- `AWS_SECRET_ACCESS_KEY`: Long string (40 characters)
- `AWS_SESSION_TOKEN`: Very long string (hundreds of characters)

**IMPORTANT**: These credentials expire when the workshop ends (you have ~1 day 20 hours remaining)

## Step 3: Configure Backend .env File

Open `backend/.env` and paste your credentials:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=ASIA...  # Paste your key here
AWS_SECRET_ACCESS_KEY=...  # Paste your secret here
AWS_SESSION_TOKEN=...      # Paste your token here
```

## Step 4: Configure AWS CLI (Optional but Recommended)

This allows you to use AWS CLI commands:

```bash
# Set credentials
aws configure set aws_access_key_id ASIA...
aws configure set aws_secret_access_key ...
aws configure set aws_session_token ...
aws configure set region us-east-1

# Verify it works
aws sts get-caller-identity
```

You should see output like:
```json
{
    "UserId": "AROA...:your-email",
    "Account": "123456789012",
    "Arn": "arn:aws:sts::123456789012:assumed-role/..."
}
```

## Troubleshooting

### "Credentials not found"
- Make sure you copied all three values (ACCESS_KEY, SECRET_KEY, SESSION_TOKEN)
- Check for extra spaces or line breaks

### "Token expired"
- Workshop credentials expire after the event
- Get new credentials from the workshop dashboard

### "Access Denied"
- Some AWS services might be restricted in the workshop
- Check the workshop's allowed services list

## What's Next?

Once credentials are configured, you can:
1. Create AWS resources (RDS, S3, Cognito, IoT Core)
2. Run the backend application
3. Test AWS service integrations

See `SETUP_GUIDE.md` for the full setup process.
