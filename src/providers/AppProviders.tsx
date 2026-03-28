import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppPersistProvider } from '../context/AppPersistProvider';
import { ErrorBoundary } from '../components/errors/ErrorBoundary';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppPersistProvider>{children}</AppPersistProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
