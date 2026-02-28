import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { adminCreateUser } from './functions/admin-create-user/resource';
// Import the API Gateway library from the AWS CDK
import { RestApi, LambdaIntegration, CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';

const backend = defineBackend({
  auth,
  adminCreateUser,
});

// 1. Get the stack where the API will live
const apiStack = backend.createStack('api-stack');

// 2. Create the actual REST API
const myApi = new RestApi(apiStack, 'RestApi', {
  restApiName: 'adminApi',
  deployOptions: { stageName: 'prod' },
  defaultCorsPreflightOptions: {
    allowOrigins: ['*'], // Required for Expo/Web testing
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['*'],
  },
});

// 3. Create a Cognito Authorizer (so only logged-in responders can call it)
const authorizer = new CognitoUserPoolsAuthorizer(apiStack, 'ApiAuthorizer', {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// 4. Create the path and link it to your Lambda function
const userRoute = myApi.root.addResource('create-user');
userRoute.addMethod('POST', new LambdaIntegration(backend.adminCreateUser.resources.lambda), {
  authorizer,
});

// 5. Explicitly add the API URL to your outputs so the frontend can see it
backend.addOutput({
  custom: {
    adminApiUrl: myApi.url,
  },
});
