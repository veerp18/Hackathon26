import { CognitoIdentityProviderClient, AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  const { email } = JSON.parse(event.body);
  
  // Use the environment variable we just injected
  const userPoolId = process.env.USER_POOL_ID; 

  const command = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "email_verified", Value: "true" },
    ],
    TemporaryPassword: "Hackathon@2026!", // You can randomize this later
  });

  try {
    await client.send(command);
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "User created successfully" }),
    };
  } catch (err: any) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: err.message }),
    };
  }
};
