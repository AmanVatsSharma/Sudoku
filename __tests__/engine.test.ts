import { CLUES_REMOVED } from '../src/game/constants';
import {
  boardsEqual,
  cloneBoard,
  fillAllCandidateNotes,
  findContradiction,
  generatePuzzle,
  getCandidates,
  hasNote,
  isValidSolvedBoard,
} from '../src/game/engine';

describe('Sudoku engine', () => {
  it('generatePuzzle (easy) has valid solution matching givens', () => {
    const { puzzle, solution } = generatePuzzle('easy');
    expect(isValidSolvedBoard(solution)).toBe(true);
    expect(puzzle.flat().filter((v) => v === 0).length).toBe(CLUES_REMOVED.easy);
    expect(boardsEqual(puzzle, solution)).toBe(false);
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (puzzle[r]![c] !== 0) expect(puzzle[r]![c]).toBe(solution[r]![c]);
  });

  it('cloneBoard is independent', () => {
    const { solution } = generatePuzzle('easy');
    const copy = cloneBoard(solution);
    copy[0]![0] = 0;
    expect(copy[0]![0]).toBe(0);
    expect(solution[0]![0]).not.toBe(0);
  });

  it('getCandidates matches row/col/box eliminations', () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    board[0]![0] = 1;
    board[0]![1] = 2;
    board[1]![0] = 3;
    expect(getCandidates(board, 0, 2).sort((a, b) => a - b)).toEqual([4, 5, 6, 7, 8, 9]);
    expect(getCandidates(board, 0, 0)).toEqual([]);
  });

  it('findContradiction returns null when every empty cell has a candidate', () => {
    const { puzzle } = generatePuzzle('medium');
    expect(findContradiction(puzzle)).toBeNull();
  });

  it('fillAllCandidateNotes sets pencil marks for empty cells', () => {
    const { puzzle } = generatePuzzle('easy');
    const nn = fillAllCandidateNotes(puzzle);
    const emptyR = puzzle.findIndex((row) => row.includes(0));
    const emptyC = puzzle[emptyR]!.indexOf(0);
    const cands = getCandidates(puzzle, emptyR, emptyC);
    for (let d = 1; d <= 9; d++)
      expect(hasNote(nn[emptyR]![emptyC]!, d)).toBe(cands.includes(d));
  });
});
