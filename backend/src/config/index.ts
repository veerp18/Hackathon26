import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl: process.env.DB_SSL === 'true',
  },
  
  cognito: {
    region: process.env.AWS_REGION || 'us-east-1',
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    clientId: process.env.COGNITO_CLIENT_ID!,
    issuer: process.env.COGNITO_ISSUER!,
  },
  
  iot: {
    endpoint: process.env.AWS_IOT_ENDPOINT!,
  },
  
  s3: {
    bucket: process.env.S3_BUCKET_NAME!,
  },
  
  transcribe: {
    enabled: process.env.USE_AWS_TRANSCRIBE === 'true',
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
};

// Validate required config
const requiredConfig = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'COGNITO_ISSUER',
  'AWS_IOT_ENDPOINT',
  'S3_BUCKET_NAME',
];

for (const key of requiredConfig) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
