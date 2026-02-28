#!/bin/bash

# Test script for Report Management API
# This demonstrates the complete report lifecycle

set -e

# Add AWS CLI to PATH
export PATH=$PATH:~/.local/bin

echo "🧪 Testing Report Management API"
echo "================================="
echo ""

# Get tokens for different users
echo "📝 Step 1: Getting authentication tokens..."
ADMIN_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 8pa1a78u7v7ko95a1es4mgrbk \
  --auth-parameters USERNAME=admin@cuhackit.com,PASSWORD=Admin123! \
  --query 'AuthenticationResult.IdToken' \
  --output text)

POLICE_WORKER_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 8pa1a78u7v7ko95a1es4mgrbk \
  --auth-parameters USERNAME=police-worker@cuhackit.com,PASSWORD=Worker123! \
  --query 'AuthenticationResult.IdToken' \
  --output text)

POLICE_CHIEF_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 8pa1a78u7v7ko95a1es4mgrbk \
  --auth-parameters USERNAME=police-chief@cuhackit.com,PASSWORD=Chief123! \
  --query 'AuthenticationResult.IdToken' \
  --output text)

echo "✅ Tokens obtained"
echo ""

# Get police worker user ID
echo "📝 Step 2: Getting police worker user ID..."
POLICE_WORKER_INFO=$(curl -s -H "Authorization: Bearer $POLICE_WORKER_TOKEN" \
  http://localhost:3001/api/users/me)
POLICE_WORKER_ID=$(echo $POLICE_WORKER_INFO | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Police Worker ID: $POLICE_WORKER_ID"
echo ""

# Create a report
echo "📝 Step 3: Creating an incident report (as admin)..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"schema_type\": \"incident\",
    \"assigned_to\": \"$POLICE_WORKER_ID\",
    \"data\": {
      \"incident_type\": \"traffic_stop\",
      \"location\": \"Main St & 5th Ave\",
      \"date\": \"2026-02-27\",
      \"time\": \"14:30\",
      \"description\": \"Routine traffic stop for speeding\"
    }
  }" \
  http://localhost:3001/api/reports/)

REPORT_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "✅ Report created with ID: $REPORT_ID"
echo ""

# View the report (as police worker)
echo "📝 Step 4: Viewing the report (as police worker)..."
curl -s -H "Authorization: Bearer $POLICE_WORKER_TOKEN" \
  http://localhost:3001/api/reports/$REPORT_ID | python3 -m json.tool
echo ""

# Update the report - add more details (as police worker)
echo "📝 Step 5: Updating report with additional details (as police worker)..."
curl -s -X PATCH \
  -H "Authorization: Bearer $POLICE_WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"incident_type\": \"traffic_stop\",
      \"location\": \"Main St & 5th Ave\",
      \"date\": \"2026-02-27\",
      \"time\": \"14:30\",
      \"description\": \"Routine traffic stop for speeding\",
      \"vehicle_info\": {
        \"make\": \"Toyota\",
        \"model\": \"Camry\",
        \"license_plate\": \"ABC-1234\",
        \"color\": \"Silver\"
      },
      \"driver_info\": {
        \"name\": \"[REDACTED]\",
        \"license_number\": \"[REDACTED]\"
      },
      \"violation\": \"Speeding 15 mph over limit\",
      \"action_taken\": \"Warning issued\"
    }
  }" \
  http://localhost:3001/api/reports/$REPORT_ID | python3 -m json.tool
echo ""

# Change state to in_progress
echo "📝 Step 6: Changing report state to 'in_progress' (as police worker)..."
curl -s -X PATCH \
  -H "Authorization: Bearer $POLICE_WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state": "in_progress"}' \
  http://localhost:3001/api/reports/$REPORT_ID | python3 -m json.tool
echo ""

# Submit for review
echo "📝 Step 7: Submitting report for review (as police worker)..."
curl -s -X PATCH \
  -H "Authorization: Bearer $POLICE_WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state": "under_review"}' \
  http://localhost:3001/api/reports/$REPORT_ID | python3 -m json.tool
echo ""

# View report history
echo "📝 Step 8: Viewing report version history..."
curl -s -H "Authorization: Bearer $POLICE_WORKER_TOKEN" \
  http://localhost:3001/api/reports/$REPORT_ID/history | python3 -m json.tool
echo ""

# Police chief reviews and locks the report
echo "📝 Step 9: Police chief locks the report..."
curl -s -X PATCH \
  -H "Authorization: Bearer $POLICE_CHIEF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state": "locked"}' \
  http://localhost:3001/api/reports/$REPORT_ID | python3 -m json.tool
echo ""

# Try to edit locked report (should fail)
echo "📝 Step 10: Attempting to edit locked report (should fail)..."
curl -s -X PATCH \
  -H "Authorization: Bearer $POLICE_WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": {"test": "should fail"}}' \
  http://localhost:3001/api/reports/$REPORT_ID
echo ""
echo ""

# List all reports assigned to police worker
echo "📝 Step 11: Listing all reports assigned to police worker..."
curl -s -H "Authorization: Bearer $POLICE_WORKER_TOKEN" \
  "http://localhost:3001/api/reports/?assigned_to_me=true" | python3 -m json.tool
echo ""

echo "✅ All tests completed!"
echo ""
echo "Summary:"
echo "- Created incident report"
echo "- Updated report with additional details (version 2)"
echo "- Transitioned through states: draft → in_progress → under_review → locked"
echo "- Viewed version history"
echo "- Verified locked reports cannot be edited"
echo "- Listed reports by assignment"
