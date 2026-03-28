import { CLUES_REMOVED } from '../src/game/constants';
import { boardsEqual, cloneBoard, generatePuzzle, isValidSolvedBoard } from '../src/game/engine';

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
});
