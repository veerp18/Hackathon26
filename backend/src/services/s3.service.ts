import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId!,
    secretAccessKey: config.aws.secretAccessKey!,
  },
});

export class S3Service {
  // Upload PDF to S3
  async uploadPDF(
    reportId: string,
    pdfBuffer: Buffer,
    filename: string
  ): Promise<string> {
    const key = `reports/${reportId}/${filename}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.s3.bucket,
          Key: key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
          Metadata: {
            reportId,
            uploadedAt: new Date().toISOString(),
          },
        })
      );

      return key;
    } catch (error) {
      console.error('Failed to upload PDF to S3:', error);
      throw error;
    }
  }

  // Generate presigned URL for PDF download
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      throw error;
    }
  }

  // Delete PDF from S3
  async deletePDF(key: string): Promise<void> {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.s3.bucket,
          Key: key,
        })
      );
    } catch (error) {
      console.error('Failed to delete PDF from S3:', error);
      throw error;
    }
  }
}

export const s3Service = new S3Service();
