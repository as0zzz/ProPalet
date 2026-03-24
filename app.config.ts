import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "ProPalet",
  slug: "propalet",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "propalet",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "com.propalet.app",
    supportsTablet: true,
    icon: "./assets/expo.icon",
  },
  android: {
    package: "com.propalet.app",
    adaptiveIcon: {
      backgroundColor: "#131A22",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
        },
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#131A22",
        image: "./assets/images/splash-icon.png",
        imageWidth: 96,
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
    reactCompiler: true,
  },
  extra: {
    projectName: "ProPalet",
  },
};

export default config;
