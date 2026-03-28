import { render, screen } from '@testing-library/react-native';

import App from '../src/App';

describe('App', () => {
  it('renders home placeholder', () => {
    render(<App />);
    expect(screen.getByText(/Open up src\/App.tsx/i)).toBeTruthy();
  });
});
