import boto3
from botocore.exceptions import ClientError
from app.config import get_settings

settings = get_settings()

# Initialize S3 client
s3_client = boto3.client(
    's3',
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    aws_session_token=settings.aws_session_token,
)


class S3Service:
    @staticmethod
    async def upload_pdf(report_id: str, pdf_buffer: bytes, filename: str) -> str:
        """Upload PDF to S3"""
        key = f"reports/{report_id}/{filename}"
        
        try:
            s3_client.put_object(
                Bucket=settings.s3_bucket_name,
                Key=key,
                Body=pdf_buffer,
                ContentType='application/pdf',
                Metadata={
                    'report_id': report_id,
                    'uploaded_at': str(datetime.now()),
                }
            )
            return key
        except ClientError as e:
            print(f"Failed to upload PDF to S3: {e}")
            raise
    
    @staticmethod
    async def get_download_url(key: str, expires_in: int = 3600) -> str:
        """Generate presigned URL for PDF download"""
        try:
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.s3_bucket_name,
                    'Key': key,
                },
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            print(f"Failed to generate presigned URL: {e}")
            raise
    
    @staticmethod
    async def delete_pdf(key: str) -> None:
        """Delete PDF from S3"""
        try:
            s3_client.delete_object(
                Bucket=settings.s3_bucket_name,
                Key=key
            )
        except ClientError as e:
            print(f"Failed to delete PDF from S3: {e}")
            raise
