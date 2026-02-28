export default {
  expo: {
    name: "911-notebook",
    slug: "911-notebook",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
      cognitoUserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
      cognitoClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID,
      cognitoRegion: process.env.EXPO_PUBLIC_COGNITO_REGION,
    }
  }
};
