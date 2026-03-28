import { AppProviders } from './providers/AppProviders';
import { SudokuApp } from './SudokuApp';

export default function App() {
  return (
    <AppProviders>
      <SudokuApp />
    </AppProviders>
  );
}
