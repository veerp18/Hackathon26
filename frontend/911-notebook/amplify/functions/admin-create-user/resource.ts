import { defineFunction } from '@aws-amplify/backend';

export const adminCreateUser = defineFunction({
  name: 'admin-create-user',
  // This allows the function to access the User Pool ID automatically
  environment: {
    USER_POOL_ID: '', // This placeholder is updated by backend.ts
  },   entry: './handler.ts' 
});
