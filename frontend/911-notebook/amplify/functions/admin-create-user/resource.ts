import { defineFunction } from '@aws-amplify/backend';

export const adminCreateUser = defineFunction({
  name: 'admin-create-user',
  // This points to the logic file we will create in Step 3
  entry: './handler.ts' 
});
