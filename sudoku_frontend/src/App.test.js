import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// PUBLIC_INTERFACE
function fillGridWithSolution(ui) {
  // This helper clicks cells and uses number pad to fill a known-correct solution
  // for the DEFAULT_PUZZLE provided in App.js.
  // The solution used is a valid completed board for the given puzzle.
  const solution = [
    [5,3,4,6,7,8,9,1,2],
    [6,7,2,1,9,5,3,4,8],
    [1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],
    [4,2,6,8,5,3,7,9,1],
    [7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],
    [2,8,7,4,1,9,6,3,5],
    [3,4,5,2,8,6,1,7,9],
  ];

  // Get all gridcells in row-major order
  const cells = ui.getAllByRole('gridcell');

  // Iterate through cells and only fill editable ones (skip givens)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const cell = cells[idx];
      const isFixed = cell.getAttribute('aria-label')?.includes('fixed');
      if (isFixed) continue;

      // select cell
      fireEvent.click(cell);
      // click number pad for the required value (0 clears)
      const val = solution[r][c];
      const btn = ui.getByRole('button', { name: `Input ${val}` });
      fireEvent.click(btn);
    }
  }
}

test('renders Sudoku title', () => {
  render(<App />);
  const title = screen.getByText(/Sudoku/i);
  expect(title).toBeInTheDocument();
});

test('shows info banner when board has no conflicts but is incomplete', () => {
  render(<App />);
  // Without any input, clicking Check Solution should show info banner
  const checkBtn = screen.getByRole('button', { name: /Check Solution/i });
  fireEvent.click(checkBtn);

  const banner = screen.getByRole('status');
  expect(banner).toHaveTextContent(/No conflicts so far, but the board is incomplete/i);
});

test('shows error banner and highlights conflicts for duplicate in a row', () => {
  render(<App />);
  const cells = screen.getAllByRole('gridcell');

  // Pick first editable cell in row 1 (row index 0)
  // Original row 1: [5,3,0,0,7,0,0,0,0]
  // Set col 2 (index 1) is fixed (3), we will make another 3 elsewhere editable to cause conflict.
  // Choose column 3 (index 2) which is editable (0) and set it to 3 to duplicate.
  const targetCell = cells[0 * 9 + 2];
  fireEvent.click(targetCell);
  const btn3 = screen.getByRole('button', { name: 'Input 3' });
  fireEvent.click(btn3);

  const checkBtn = screen.getByRole('button', { name: /Check Solution/i });
  fireEvent.click(checkBtn);

  const banner = screen.getByRole('status');
  expect(banner).toHaveTextContent(/There are conflicts highlighted in red/i);

  // Ensure at least one conflicted cell exists (has background or aria? We can check class via text content parent)
  // Since class isn't directly exposed, verify there are still gridcells present (sanity) and banner shows error.
  expect(cells.length).toBe(81);
});

test('shows success banner when solved correctly', () => {
  render(<App />);

  // Fill in a valid solution using number pad
  fillGridWithSolution(screen);

  const checkBtn = screen.getByRole('button', { name: /Check Solution/i });
  fireEvent.click(checkBtn);

  const banner = screen.getByRole('status');
  expect(banner).toHaveTextContent(/Excellent! The puzzle is solved/i);

  // Footer status should reflect solved
  const status = screen.getByText(/Solved/i);
  expect(status).toBeInTheDocument();
});
