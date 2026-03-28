import * as SplashScreen from 'expo-splash-screen';

import { AppProviders } from './providers/AppProviders';
import { SudokuApp } from './SudokuApp';

void SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <AppProviders>
      <SudokuApp />
    </AppProviders>
  );
}
