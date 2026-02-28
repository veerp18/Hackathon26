#!/bin/bash

USER_POOL_ID="us-east-1_f1TbJfhiB"

# Array of users: email, password
declare -a users=(
  "police-worker@cuhackit.com:Worker123!"
  "police-chief@cuhackit.com:Chief123!"
  "triage-nurse@cuhackit.com:Nurse123!"
  "er-doctor@cuhackit.com:Doctor123!"
  "er-paramedic@cuhackit.com:Paramedic123!"
  "er-attending@cuhackit.com:Attending123!"
)

for user_data in "${users[@]}"; do
  IFS=':' read -r email password <<< "$user_data"
  
  echo "Creating user: $email"
  
  # Create user
  aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username "$email" \
    --user-attributes Name=email,Value="$email" Name=email_verified,Value=true \
    --message-action SUPPRESS
  
  # Set permanent password
  aws cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username "$email" \
    --password "$password" \
    --permanent
  
  echo "✓ Created $email"
  echo ""
done

echo "All users created successfully!"
