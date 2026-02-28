import boto3
import json

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("Reports")

def lambda_handler(event, context):
    try:
        body = json.loads(event["body"])
        user_id = body["user_id"]
        timestamp = body["timestamp"]
        fields = body["fields"]

        table.update_item(
            Key={"user_id": user_id, "timestamp": timestamp},
            UpdateExpression="SET fields = :f",
            ExpressionAttributeValues={":f": json.dumps(fields)}
        )

        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": json.dumps({"success": True})
        }
    except Exception as e:
        import traceback
        print("ERROR:", traceback.format_exc())
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }
