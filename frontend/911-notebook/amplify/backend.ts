import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { adminCreateUser } from './functions/admin-create-user/resource';
import { RestApi, LambdaIntegration, CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';
// ADD THIS IMPORT BELOW
import * as iam from 'aws-cdk-lib/aws-iam'; 

const backend = defineBackend({
  auth,
  adminCreateUser,
});

// 1. Inject the User Pool ID and grant permissions
// We do this immediately after defining the backend
const userPool = backend.auth.resources.userPool;

backend.adminCreateUser.addEnvironment(
  'USER_POOL_ID',
  userPool.userPoolId
);

backend.adminCreateUser.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['cognito-idp:AdminCreateUser', 'cognito-idp:AdminAddUserToGroup'],
    resources: [userPool.userPoolArn],
  })
);

// 2. API Setup (The rest of your code was perfect!)
const apiStack = backend.createStack('api-stack');

const myApi = new RestApi(apiStack, 'RestApi', {
  restApiName: 'adminApi',
  deployOptions: { stageName: 'prod' },
  defaultCorsPreflightOptions: {
    allowOrigins: ['*'],
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['*'],
  },
});

const authorizer = new CognitoUserPoolsAuthorizer(apiStack, 'ApiAuthorizer', {
  cognitoUserPools: [userPool],
});

const userRoute = myApi.root.addResource('create-user');
userRoute.addMethod('POST', new LambdaIntegration(backend.adminCreateUser.resources.lambda), {
  authorizer,
});

backend.addOutput({
  custom: {
    adminApiUrl: myApi.url,
  },
});
