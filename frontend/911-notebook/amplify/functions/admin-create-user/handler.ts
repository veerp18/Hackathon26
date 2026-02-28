import { CognitoIdentityProviderClient, AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  // We expect the email to come from your app's frontend request
  const { email } = JSON.parse(event.body || '{}');

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email is required" }) };
  }

  const command = new AdminCreateUserCommand({
    UserPoolId: process.env.AMPLIFY_AUTH_USERPOOL_ID, // Automatically injected by Amplify
    Username: email,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "email_verified", Value: "true" },
    ],
    DesiredDeliveryMediums: ["EMAIL"],
  });

  try {
    await client.send(command);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allows your Expo app to call this
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ message: "User created successfully" }),
    };
  } catch (err: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
