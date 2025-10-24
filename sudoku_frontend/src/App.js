import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// Theme color tokens as constants
const THEME = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#06b6d4',
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
};

// A default Sudoku puzzle (0 represents empty). Source: simple valid puzzle.
const DEFAULT_PUZZLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

/**
 * Utility: Deep copy a 2D array.
 */
function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

/**
 * Utility: Returns a set of coordinates that are in conflict with Sudoku rules.
 * We flag cells that create duplicates within their row, column, or subgrid.
 */
function findConflicts(grid) {
  const conflicts = new Set();

  const push = (r, c) => conflicts.add(`${r},${c}`);

  // Rows
  for (let r = 0; r < 9; r++) {
    const seen = {};
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v === 0) continue;
      if (seen[v] !== undefined) {
        push(r, c);
        push(r, seen[v]);
      } else {
        seen[v] = c;
      }
    }
  }

  // Columns
  for (let c = 0; c < 9; c++) {
    const seen = {};
    for (let r = 0; r < 9; r++) {
      const v = grid[r][c];
      if (v === 0) continue;
      if (seen[v] !== undefined) {
        push(r, c);
        push(seen[v], c);
      } else {
        seen[v] = r;
      }
    }
  }

  // 3x3 Boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = {};
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const v = grid[r][c];
          if (v === 0) continue;
          const key = v;
          if (seen[key]) {
            const [rr, cc] = seen[key];
            push(r, c);
            push(rr, cc);
          } else {
            seen[key] = [r, c];
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Utility: Check if the board is completely filled (no zeros).
 */
function isComplete(grid) {
  return grid.every(row => row.every(v => v >= 1 && v <= 9));
}

/**
 * PUBLIC_INTERFACE
 * Validate the current grid. Returns an object with conflict set and solved boolean.
 */
function validateGrid(grid) {
  const conflicts = findConflicts(grid);
  const solved = isComplete(grid) && conflicts.size === 0;
  return { conflicts, solved };
}

/**
 * SudokuCell Component
 * Renders a single cell with retro styling and manages focus/selection.
 */
function SudokuCell({ row, col, value, fixed, selected, conflicted, onSelect, onChange }) {
  const classes = [
    'sudoku-cell',
    fixed ? 'fixed' : 'editable',
    selected ? 'selected' : '',
    conflicted ? 'conflict' : '',
    // bold grid borders
    col % 3 === 0 ? 'left-thick' : '',
    row % 3 === 0 ? 'top-thick' : '',
    col === 8 ? 'right-thick' : '',
    row === 8 ? 'bottom-thick' : '',
  ].join(' ');

  const handleClick = () => onSelect(row, col);

  const display = value === 0 ? '' : value;

  return (
    <div
      role="gridcell"
      aria-selected={selected}
      aria-label={`Row ${row + 1} Column ${col + 1}${fixed ? ' fixed' : ''}`}
      className={classes}
      onClick={handleClick}
      tabIndex={0}
    >
      <span>{display}</span>
    </div>
  );
}

/**
 * SudokuBoard Component
 * Renders the 9x9 grid.
 */
function SudokuBoard({ grid, fixedMask, selected, conflicts, onSelect, onValue }) {
  return (
    <div className="sudoku-board" role="grid" aria-label="Sudoku board 9 by 9">
      {grid.map((row, r) => (
        <div className="sudoku-row" role="row" key={`row-${r}`}>
          {row.map((val, c) => (
            <SudokuCell
              key={`cell-${r}-${c}`}
              row={r}
              col={c}
              value={val}
              fixed={fixedMask[r][c]}
              selected={selected && selected[0] === r && selected[1] === c}
              conflicted={conflicts.has(`${r},${c}`)}
              onSelect={onSelect}
              onChange={onValue}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * NumberPad Component
 * Provides on-screen input for numbers 1-9 and a clear button.
 */
function NumberPad({ onInput, disabled }) {
  return (
    <div className="number-pad" aria-label="Number pad">
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <button
          key={`num-${n}`}
          className="btn retro-btn"
          onClick={() => onInput(n)}
          disabled={disabled}
          aria-label={`Input ${n}`}
        >
          {n}
        </button>
      ))}
      <button
        className="btn retro-btn secondary"
        onClick={() => onInput(0)}
        disabled={disabled}
        aria-label="Clear cell"
        title="Clear"
      >
        ⌫
      </button>
    </div>
  );
}

/**
 * Controls Component
 * Buttons for checking solution and resetting the board.
 */
function Controls({ onCheck, onReset }) {
  return (
    <div className="controls">
      <button className="btn retro-btn primary" onClick={onCheck} aria-label="Check Solution">
        Check Solution
      </button>
      <button className="btn retro-btn outline" onClick={onReset} aria-label="Reset Board">
        Reset Board
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Theme is fixed to light but we keep state to allow easy future toggle.
  const [theme] = useState('light');

  // Initial immutable puzzle and mask of fixed cells
  const initialPuzzle = useMemo(() => cloneGrid(DEFAULT_PUZZLE), []);
  const fixedMask = useMemo(
    () => initialPuzzle.map(row => row.map(v => v !== 0)),
    [initialPuzzle]
  );

  // Mutable current grid state
  const [grid, setGrid] = useState(() => cloneGrid(initialPuzzle));
  const [selected, setSelected] = useState(null); // [row, col]
  const [banner, setBanner] = useState(null); // {type: 'success'|'error'|'info', message: string}

  const { conflicts, solved } = useMemo(() => validateGrid(grid), [grid]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Keyboard input handler for 1-9 and backspace/delete
  useEffect(() => {
    const handleKey = (e) => {
      if (!selected) return;
      const [r, c] = selected;
      if (fixedMask[r][c]) return;

      if (/^[1-9]$/.test(e.key)) {
        setGrid(prev => {
          const next = cloneGrid(prev);
          next[r][c] = parseInt(e.key, 10);
          return next;
        });
        e.preventDefault();
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setGrid(prev => {
          const next = cloneGrid(prev);
          next[r][c] = 0;
          return next;
        });
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelected(([rr, cc]) => [Math.max(0, rr - 1), cc]);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setSelected(([rr, cc]) => [Math.min(8, rr + 1), cc]);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        setSelected(([rr, cc]) => [rr, Math.max(0, cc - 1)]);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        setSelected(([rr, cc]) => [rr, Math.min(8, cc + 1)]);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selected, fixedMask]);

  const handleSelect = (r, c) => {
    setSelected([r, c]);
  };

  const handleNumberPad = (n) => {
    if (!selected) return;
    const [r, c] = selected;
    if (fixedMask[r][c]) return;
    setGrid(prev => {
      const next = cloneGrid(prev);
      next[r][c] = n;
      return next;
    });
  };

  const handleCheck = () => {
    const { conflicts: conf, solved: ok } = validateGrid(grid);
    if (ok) {
      setBanner({ type: 'success', message: 'Excellent! The puzzle is solved. 🎉' });
    } else if (conf.size > 0) {
      setBanner({ type: 'error', message: 'There are conflicts highlighted in red.' });
    } else {
      setBanner({ type: 'info', message: 'No conflicts so far, but the board is incomplete.' });
    }
    // Auto-hide non-success banners after a short delay
    if (!ok) {
      setTimeout(() => setBanner(null), 3000);
    }
  };

  const handleReset = () => {
    setGrid(cloneGrid(initialPuzzle));
    setSelected(null);
    setBanner(null);
  };

  return (
    <div className="sudoku-app" style={{ background: THEME.background, color: THEME.text }}>
      <div className="retro-frame">
        <header className="header">
          <h1 className="title">Sudoku</h1>
          <p className="subtitle">Retro Edition</p>
        </header>

        {banner && (
          <div
            className={`banner ${banner.type}`}
            role="status"
            aria-live="polite"
          >
            {banner.message}
          </div>
        )}

        <main className="board-wrapper" aria-label="Sudoku play area">
          <SudokuBoard
            grid={grid}
            fixedMask={fixedMask}
            selected={selected}
            conflicts={conflicts}
            onSelect={handleSelect}
            onValue={handleNumberPad}
          />
        </main>

        <section className="ui-panel">
          <NumberPad onInput={handleNumberPad} disabled={!selected || (selected && fixedMask[selected[0]][selected[1]])} />
          <Controls onCheck={handleCheck} onReset={handleReset} />
        </section>

        <footer className="footer">
          <span className="legend">
            <span className="legend-item"><span className="swatch fixed-swatch" /> Given</span>
            <span className="legend-item"><span className="swatch edit-swatch" /> Editable</span>
            <span className="legend-item"><span className="swatch conflict-swatch" /> Conflict</span>
          </span>
          <span className="status">{solved ? 'Solved ✅' : 'Keep going...'}</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
