export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'ultimatum';

/** 9x9 grid: 0 = empty, 1–9 = digit */
export type Board = number[][];

/** Per-cell candidate bitmask: bit (d-1) set if digit d is noted (1–9) */
export type NotesGrid = number[][];

export type GeneratedPuzzle = {
  puzzle: Board;
  solution: Board;
};

export type GameSnapshot = {
  board: Board;
  notes: NotesGrid;
};
