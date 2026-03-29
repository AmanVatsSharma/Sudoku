import * as SplashScreen from 'expo-splash-screen';

import { ensureDailyReminderNotificationHandler } from './notifications/dailyReminder';
import { AppProviders } from './providers/AppProviders';
import { SudokuApp } from './SudokuApp';

ensureDailyReminderNotificationHandler();

void SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <AppProviders>
      <SudokuApp />
    </AppProviders>
  );
}
