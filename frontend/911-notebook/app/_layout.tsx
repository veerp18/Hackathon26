import { Stack } from "expo-router";
import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { parseAmplifyConfig } from 'aws-amplify/utils'

const amplifyConfig = parseAmplifyConfig(outputs)
Amplify.configure(amplifyConfig)
cognitoUserPoolsTokenProvider.setKeyValueStorage(AsyncStorage)

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}