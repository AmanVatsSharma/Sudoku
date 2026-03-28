import Constants from 'expo-constants';

export type AppExtra = {
  appVariant: string;
};

export function getExtra(): AppExtra {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const appVariant = extra?.appVariant;
  return {
    appVariant: typeof appVariant === 'string' ? appVariant : 'development',
  };
}
