import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { adminCreateUser } from './functions/admin-create-user/resource';
// 1. Import the PolicyStatement and Effect from the AWS CDK library
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  adminCreateUser,
});

// 2. Use the "new PolicyStatement" constructor instead of a plain object
backend.adminCreateUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['cognito-idp:AdminCreateUser'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

// Create a simple REST API and point it to your Lambda
// adding users to the user pool
const api = backend.addRestApi('adminApi');
api.addHttpRoute('/create-user', backend.adminCreateUser, {
  method: 'POST',
  authorizationMode: 'userPool' // Only logged-in users can call this!
});
