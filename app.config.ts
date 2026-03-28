import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Sudoku Ultimatum',
  slug: 'sudoku-ultimatum',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'sudoku',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'dev.sudoku.ultimatum',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    appVariant: process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development',
  },
};

export default config;
