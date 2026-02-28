#!/bin/bash
set -e

REGION="us-east-1"
API_ID="vsbhthrfr0"

echo "=== Fixing CORS preflight for API Gateway ==="

add_cors() {
  RESOURCE_ID=$1
  echo "Adding OPTIONS to resource $RESOURCE_ID..."

  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION > /dev/null 2>/dev/null || true

  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
    --region $REGION > /dev/null 2>/dev/null || true

  aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Headers": false,
      "method.response.header.Access-Control-Allow-Methods": false,
      "method.response.header.Access-Control-Allow-Origin": false
    }' \
    --region $REGION > /dev/null 2>/dev/null || true

  aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'",
      "method.response.header.Access-Control-Allow-Methods": "'"'"'POST,GET,OPTIONS'"'"'",
      "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"
    }' \
    --region $REGION > /dev/null 2>/dev/null || true
}

# Get resource IDs
EXPORT_PDF_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID --region $REGION \
  --query 'items[?pathPart==`export-pdf`].id' --output text)

PARSE_REPORT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID --region $REGION \
  --query 'items[?pathPart==`parse-report`].id' --output text)

VALIDATE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID --region $REGION \
  --query 'items[?pathPart==`validate-report`].id' --output text)

GET_REPORTS_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID --region $REGION \
  --query 'items[?pathPart==`get-reports`].id' --output text)

TRANSCRIBE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID --region $REGION \
  --query 'items[?pathPart==`transcribe`].id' --output text)

add_cors $EXPORT_PDF_ID
add_cors $PARSE_REPORT_ID
add_cors $VALIDATE_ID
add_cors $GET_REPORTS_ID
add_cors $TRANSCRIBE_ID

echo ""
echo "Deploying API Gateway..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION > /dev/null

echo "Done! CORS preflight fixed for all endpoints."
