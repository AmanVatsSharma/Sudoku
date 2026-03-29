import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Sudoku Ultimatum',
  slug: 'sudoku-ultimatum',
  version: '1.0.2',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'sudoku',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0c1224',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'dev.sudoku.ultimatum',
    versionCode: 3,
    adaptiveIcon: {
      backgroundColor: '#0c1224',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-asset',
    ['expo-system-ui', { userInterfaceStyle: 'automatic' }],
    'expo-notifications',
  ],
  extra: {
    appVariant: process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development',
  },
};

export default config;
