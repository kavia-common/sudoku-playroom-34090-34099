import { validateGrid } from './App';

const validSolved = [
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

test('validateGrid marks a complete valid board as solved', () => {
  const { solved, conflicts } = validateGrid(validSolved);
  expect(solved).toBe(true);
  expect(conflicts.size).toBe(0);
});

test('validateGrid detects row conflict', () => {
  const grid = validSolved.map(r => [...r]);
  grid[0][0] = 3; // duplicate 3 in row 0
  const { solved, conflicts } = validateGrid(grid);
  expect(solved).toBe(false);
  expect(conflicts.size).toBeGreaterThan(0);
});

test('validateGrid detects column conflict', () => {
  const grid = validSolved.map(r => [...r]);
  grid[0][0] = 6; // duplicate 6 in column 0
  const { solved, conflicts } = validateGrid(grid);
  expect(solved).toBe(false);
  expect(conflicts.size).toBeGreaterThan(0);
});

test('validateGrid detects box conflict', () => {
  const grid = validSolved.map(r => [...r]);
  // Put a duplicate inside top-left 3x3 box
  grid[0][1] = 1; // 1 already exists at [2][0]
  const { solved, conflicts } = validateGrid(grid);
  expect(solved).toBe(false);
  expect(conflicts.size).toBeGreaterThan(0);
});

test('validateGrid treats incomplete (zeros) as not solved but may have no conflicts', () => {
  const grid = validSolved.map(r => [...r]);
  grid[8][8] = 0;
  const { solved, conflicts } = validateGrid(grid);
  expect(solved).toBe(false);
  expect(conflicts.size).toBe(0);
});
