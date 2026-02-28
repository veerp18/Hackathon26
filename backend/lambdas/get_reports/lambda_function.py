import boto3
import json
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("Reports")

def lambda_handler(event, context):
    params = event.get("queryStringParameters") or {}
    user_id = params.get("user_id", "")

    if not user_id:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "user_id is required"})
        }

    # Query DynamoDB by user_id, newest first
    response = table.query(
        KeyConditionExpression=Key("user_id").eq(user_id),
        ScanIndexForward=False
    )

    reports = []
    for item in response.get("Items", []):
        reports.append({
            "report_id": item.get("report_id"),
            "report_type": item.get("report_type"),
            "timestamp": item.get("timestamp"),
            "fields": json.loads(item.get("fields", "{}"))
        })

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        "body": json.dumps({"reports": reports})
    }
