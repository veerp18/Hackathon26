import boto3
import json
from datetime import datetime
from botocore.exceptions import ClientError
from app.config import get_settings

settings = get_settings()

# Initialize IoT Data client
iot_client = boto3.client(
    'iot-data',
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    aws_session_token=settings.aws_session_token,
    endpoint_url=f"https://{settings.aws_iot_endpoint}"
)


class RealtimeService:
    @staticmethod
    async def broadcast_report_change(report_id: str, change: dict) -> None:
        """Broadcast report changes to all connected clients via AWS IoT"""
        topic = f"reports/{report_id}/updates"
        payload = {
            "report_id": report_id,
            "timestamp": datetime.now().isoformat(),
            "change": change,
        }
        
        try:
            iot_client.publish(
                topic=topic,
                qos=1,
                payload=json.dumps(payload)
            )
            print(f"Broadcasted change to topic: {topic}")
        except ClientError as e:
            print(f"Failed to broadcast report change: {e}")
            raise
    
    @staticmethod
    async def send_notification(org_id: str, notification: dict) -> None:
        """Send organization-wide notification"""
        topic = f"organizations/{org_id}/notifications"
        payload = {
            "org_id": org_id,
            "timestamp": datetime.now().isoformat(),
            "notification": notification,
        }
        
        try:
            iot_client.publish(
                topic=topic,
                qos=1,
                payload=json.dumps(payload)
            )
            print(f"Sent notification to topic: {topic}")
        except ClientError as e:
            print(f"Failed to send notification: {e}")
            raise
    
    @staticmethod
    async def send_user_message(user_id: str, message: dict) -> None:
        """Send message to specific user"""
        topic = f"users/{user_id}/messages"
        payload = {
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "message": message,
        }
        
        try:
            iot_client.publish(
                topic=topic,
                qos=1,
                payload=json.dumps(payload)
            )
            print(f"Sent message to topic: {topic}")
        except ClientError as e:
            print(f"Failed to send user message: {e}")
            raise
