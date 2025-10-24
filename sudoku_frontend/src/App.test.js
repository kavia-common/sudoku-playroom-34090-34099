import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Sudoku title', () => {
  render(<App />);
  const title = screen.getByText(/Sudoku/i);
  expect(title).toBeInTheDocument();
});
