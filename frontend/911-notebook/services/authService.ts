import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COGNITO_CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
const COGNITO_REGION = process.env.EXPO_PUBLIC_COGNITO_REGION || 'us-east-1';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  org_id: string;
  cognito_sub: string;
}

class AuthService {
  /**
   * Login with AWS Cognito
   */
  async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    try {
      // Call AWS Cognito to get JWT token
      const authResponse = await axios.post(
        `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`,
        {
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: COGNITO_CLIENT_ID,
          AuthParameters: {
            USERNAME: credentials.username,
            PASSWORD: credentials.password,
          },
        },
        {
          headers: {
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
            'Content-Type': 'application/x-amz-json-1.1',
          },
        }
      );

      const token = authResponse.data.AuthenticationResult.IdToken;

      // Store token
      await AsyncStorage.setItem('authToken', token);

      // Get user info from our backend
      const userResponse = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = userResponse.data;
      await AsyncStorage.setItem('user', JSON.stringify(user));

      return { token, user };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  /**
   * Get current user from storage
   */
  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get auth token from storage
   */
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export default new AuthService();
