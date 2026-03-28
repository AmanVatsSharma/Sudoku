import { CLUES_REMOVED } from '../src/game/constants';
import {
  boardsEqual,
  cloneBoard,
  countSolutions,
  generatePuzzle,
  isValidSolvedBoard,
} from '../src/game/engine';
import type { Difficulty } from '../src/game/types';

describe('Sudoku engine', () => {
  it('generatePuzzle returns unique-solved board with target clue count when generation succeeds', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'ultimatum'];
    for (const d of difficulties) {
      const { puzzle, solution } = generatePuzzle(d);
      expect(isValidSolvedBoard(solution)).toBe(true);
      expect(countSolutions(puzzle, 2)).toBe(1);
      const empty = puzzle.flat().filter((v) => v === 0).length;
      expect(empty).toBe(CLUES_REMOVED[d]);
      expect(boardsEqual(puzzle, solution)).toBe(false);
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (puzzle[r]![c] !== 0) expect(puzzle[r]![c]).toBe(solution[r]![c]);
    }
  });

  it('cloneBoard is independent', () => {
    const { solution } = generatePuzzle('medium');
    const copy = cloneBoard(solution);
    copy[0]![0] = 0;
    expect(copy[0]![0]).toBe(0);
    expect(solution[0]![0]).not.toBe(0);
  });
});
