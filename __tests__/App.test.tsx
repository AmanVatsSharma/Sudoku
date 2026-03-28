import { render, screen, waitFor } from '@testing-library/react-native';

import App from '../src/App';

describe('App', () => {
  it('loads and shows home content', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText(/Ultimatum/i).length).toBeGreaterThan(0);
    });
  });
});
