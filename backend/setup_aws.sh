#!/bin/bash
set -e

export PATH=$PATH:~/.local/bin

REGION="us-east-1"
API_ID="vsbhthrfr0"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== 911 Notebook AWS Setup ==="
echo "Account: $ACCOUNT_ID | Region: $REGION"

# Get the IAM role from the existing parse-report lambda
echo ""
echo "--- Fetching existing Lambda role ---"
LAMBDA_ROLE=$(aws lambda get-function-configuration \
  --function-name parse-report \
  --region $REGION \
  --query Role --output text)
echo "Using role: $LAMBDA_ROLE"

# ─── 1. DynamoDB ───────────────────────────────────────────────────────────────
echo ""
echo "--- Creating DynamoDB table: Reports ---"
aws dynamodb create-table \
  --table-name Reports \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "Table created." || echo "Table already exists, skipping."

# ─── 2. S3 Buckets ────────────────────────────────────────────────────────────
echo ""
echo "--- Creating S3 bucket: 911-reports-pdf ---"
aws s3api create-bucket \
  --bucket 911-reports-pdf \
  --region $REGION \
  2>/dev/null && echo "Bucket created." || echo "Bucket already exists, skipping."

echo "--- Creating S3 bucket: 911-audio-temp ---"
aws s3api create-bucket \
  --bucket 911-audio-temp \
  --region $REGION \
  2>/dev/null && echo "Bucket created." || echo "Bucket already exists, skipping."

# ─── 3. IAM Permissions ───────────────────────────────────────────────────────
echo ""
echo "--- Adding permissions to Lambda role ---"
ROLE_NAME=$(echo $LAMBDA_ROLE | sed 's/.*role\///')

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
  2>/dev/null && echo "DynamoDB policy attached." || echo "Already attached."

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess \
  2>/dev/null && echo "S3 policy attached." || echo "Already attached."

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/AmazonTranscribeFullAccess \
  2>/dev/null && echo "Transcribe policy attached." || echo "Already attached."

# ─── 4. Deploy parse-report ───────────────────────────────────────────────────
echo ""
echo "--- Deploying updated parse-report Lambda ---"
cd lambdas/parse_report
zip -r function.zip lambda_function.py > /dev/null
aws lambda update-function-code \
  --function-name parse-report \
  --zip-file fileb://function.zip \
  --region $REGION > /dev/null
rm function.zip
echo "parse-report deployed."
cd ../..

# ─── 5. Deploy get-reports ────────────────────────────────────────────────────
echo ""
echo "--- Deploying get-reports Lambda ---"
cd lambdas/get_reports
zip -r function.zip lambda_function.py > /dev/null

aws lambda get-function --function-name get-reports --region $REGION > /dev/null 2>&1 \
  && aws lambda update-function-code \
      --function-name get-reports \
      --zip-file fileb://function.zip \
      --region $REGION > /dev/null \
  || aws lambda create-function \
      --function-name get-reports \
      --runtime python3.11 \
      --handler lambda_function.lambda_handler \
      --role "$LAMBDA_ROLE" \
      --zip-file fileb://function.zip \
      --region $REGION > /dev/null

rm function.zip
echo "get-reports deployed."
cd ../..

# ─── 6. Deploy export-pdf ─────────────────────────────────────────────────────
echo ""
echo "--- Deploying export-pdf Lambda ---"
cd lambdas/export_pdf
pip install -r requirements.txt -t . -q
zip -r function.zip . > /dev/null

aws lambda get-function --function-name export-pdf --region $REGION > /dev/null 2>&1 \
  && aws lambda update-function-code \
      --function-name export-pdf \
      --zip-file fileb://function.zip \
      --region $REGION > /dev/null \
  || aws lambda create-function \
      --function-name export-pdf \
      --runtime python3.11 \
      --handler lambda_function.lambda_handler \
      --role "$LAMBDA_ROLE" \
      --zip-file fileb://function.zip \
      --timeout 30 \
      --memory-size 256 \
      --region $REGION > /dev/null

rm function.zip
echo "export-pdf deployed."
cd ../..

# ─── 7. API Gateway — all routes ─────────────────────────────────────────────
echo ""
echo "--- Adding API Gateway routes ---"

ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --query 'items[?path==`/`].id' --output text)

# transcribe resource
TRANSCRIBE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID --region $REGION \
  --query 'items[?pathPart==`transcribe`].id' --output text)
if [ -z "$TRANSCRIBE_ID" ]; then
  TRANSCRIBE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID --parent-id $ROOT_ID \
    --path-part transcribe --region $REGION --query id --output text)
fi
aws apigateway put-method --rest-api-id $API_ID --resource-id $TRANSCRIBE_ID \
  --http-method POST --authorization-type NONE --region $REGION > /dev/null 2>/dev/null || true
aws apigateway put-integration --rest-api-id $API_ID --resource-id $TRANSCRIBE_ID \
  --http-method POST --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:911-transcribe/invocations" \
  --region $REGION > /dev/null 2>/dev/null || true
aws lambda add-permission --function-name 911-transcribe --statement-id apigateway-post \
  --action lambda:InvokeFunction --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/transcribe" \
  --region $REGION > /dev/null 2>/dev/null || true
echo "transcribe route configured."

# parse-report resource
PARSE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID --region $REGION \
  --query 'items[?pathPart==`parse-report`].id' --output text)
if [ -z "$PARSE_ID" ]; then
  PARSE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID --parent-id $ROOT_ID \
    --path-part parse-report --region $REGION --query id --output text)
fi
aws apigateway put-method --rest-api-id $API_ID --resource-id $PARSE_ID \
  --http-method POST --authorization-type NONE --region $REGION > /dev/null 2>/dev/null || true
aws apigateway put-integration --rest-api-id $API_ID --resource-id $PARSE_ID \
  --http-method POST --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:parse-report/invocations" \
  --region $REGION > /dev/null 2>/dev/null || true
aws lambda add-permission --function-name parse-report --statement-id apigateway-post \
  --action lambda:InvokeFunction --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/parse-report" \
  --region $REGION > /dev/null 2>/dev/null || true
echo "parse-report route configured."

# validate-report resource
VALIDATE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID --region $REGION \
  --query 'items[?pathPart==`validate-report`].id' --output text)
if [ -z "$VALIDATE_ID" ]; then
  VALIDATE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID --parent-id $ROOT_ID \
    --path-part validate-report --region $REGION --query id --output text)
fi
aws apigateway put-method --rest-api-id $API_ID --resource-id $VALIDATE_ID \
  --http-method POST --authorization-type NONE --region $REGION > /dev/null 2>/dev/null || true
aws apigateway put-integration --rest-api-id $API_ID --resource-id $VALIDATE_ID \
  --http-method POST --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:validate-report/invocations" \
  --region $REGION > /dev/null 2>/dev/null || true
aws lambda add-permission --function-name validate-report --statement-id apigateway-post \
  --action lambda:InvokeFunction --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/validate-report" \
  --region $REGION > /dev/null 2>/dev/null || true
echo "validate-report route configured."

# get-reports resource
GET_REPORTS_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --query 'items[?pathPart==`get-reports`].id' --output text)

if [ -z "$GET_REPORTS_ID" ]; then
  GET_REPORTS_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part get-reports \
    --region $REGION \
    --query id --output text)
  echo "Created /get-reports resource."
fi

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $GET_REPORTS_ID \
  --http-method GET \
  --authorization-type NONE \
  --region $REGION > /dev/null 2>/dev/null || true

GET_REPORTS_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:get-reports"
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $GET_REPORTS_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$GET_REPORTS_ARN/invocations" \
  --region $REGION > /dev/null 2>/dev/null || true

aws lambda add-permission \
  --function-name get-reports \
  --statement-id apigateway-get \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/GET/get-reports" \
  --region $REGION > /dev/null 2>/dev/null || true

echo "get-reports route configured."

# export-pdf resource
EXPORT_PDF_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --query 'items[?pathPart==`export-pdf`].id' --output text)

if [ -z "$EXPORT_PDF_ID" ]; then
  EXPORT_PDF_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part export-pdf \
    --region $REGION \
    --query id --output text)
  echo "Created /export-pdf resource."
fi

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $EXPORT_PDF_ID \
  --http-method POST \
  --authorization-type NONE \
  --region $REGION > /dev/null 2>/dev/null || true

EXPORT_PDF_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:export-pdf"
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $EXPORT_PDF_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$EXPORT_PDF_ARN/invocations" \
  --region $REGION > /dev/null 2>/dev/null || true

aws lambda add-permission \
  --function-name export-pdf \
  --statement-id apigateway-post \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/export-pdf" \
  --region $REGION > /dev/null 2>/dev/null || true

echo "export-pdf route configured."

# ─── 8. Deploy API Gateway ────────────────────────────────────────────────────
echo ""
echo "--- Deploying API Gateway stage: prod ---"
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION > /dev/null

echo ""
echo "=== Done! ==="
echo "API Base URL: https://$API_ID.execute-api.$REGION.amazonaws.com/prod/"
echo "  GET  /get-reports?user_id=<email>"
echo "  POST /export-pdf"
echo "  POST /parse-report  (updated)"
