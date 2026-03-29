jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'mock-id'),
  setNotificationChannelAsync: jest.fn(async () => {}),
  AndroidImportance: { DEFAULT: 'default' },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});
