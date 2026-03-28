import { CLUES_REMOVED } from './constants';
import type { Board, Difficulty, GeneratedPuzzle, NotesGrid } from './types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j]!;
    a[j] = tmp!;
  }
  return a;
}

export function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0) as number[]);
}

export function emptyNotes(): NotesGrid {
  return Array.from({ length: 9 }, () => Array(9).fill(0) as number[]);
}

function canPlace(b: Board, r: number, c: number, n: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (b[r]![i] === n || b[i]![c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let x = br; x < br + 3; x++)
    for (let y = bc; y < bc + 3; y++) if (b[x]![y] === n) return false;
  return true;
}

function fillBoard(b: Board): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (b[r]![c] === 0) {
        for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (canPlace(b, r, c, n)) {
            b[r]![c] = n;
            if (fillBoard(b)) return true;
            b[r]![c] = 0;
          }
        }
        return false;
      }
  return true;
}

function candidateDigits(b: Board, r: number, c: number): number[] {
  const out: number[] = [];
  for (let n = 1; n <= 9; n++) if (canPlace(b, r, c, n)) out.push(n);
  return out;
}

export function countSolutions(board: Board, cap: number): number {
  let found = 0;
  const b = cloneBoard(board);

  function dfs(): void {
    if (found >= cap) return;
    let bestR = -1;
    let bestC = -1;
    let bestOpts: number[] | null = null;
    let bestLen = 10;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r]![c] !== 0) continue;
        const opts = candidateDigits(b, r, c);
        if (opts.length === 0) return;
        if (opts.length < bestLen) {
          bestLen = opts.length;
          bestR = r;
          bestC = c;
          bestOpts = opts;
        }
      }
    }
    if (bestR < 0 || !bestOpts) {
      found++;
      return;
    }
    for (const n of shuffle([...bestOpts])) {
      b[bestR]![bestC] = n;
      dfs();
      b[bestR]![bestC] = 0;
      if (found >= cap) return;
    }
  }

  dfs();
  return found;
}

const MAX_PUZZLE_REGENERATIONS = 400;

export function generatePuzzle(diff: Difficulty): GeneratedPuzzle {
  const targetRemovals = CLUES_REMOVED[diff] ?? 37;

  for (let attempt = 0; attempt < MAX_PUZZLE_REGENERATIONS; attempt++) {
    const sol = emptyBoard();
    fillBoard(sol);
    const puz = cloneBoard(sol);
    const order = shuffle([...Array(81).keys()]);
    let removed = 0;

    for (const i of order) {
      if (removed >= targetRemovals) break;
      const r = Math.floor(i / 9);
      const c = i % 9;
      const saved = puz[r]![c]!;
      puz[r]![c] = 0;
      if (countSolutions(puz, 2) === 1) removed++;
      else puz[r]![c] = saved;
    }

    if (removed >= targetRemovals) {
      return { puzzle: puz, solution: cloneBoard(sol) };
    }
  }
  throw new Error(`Sudoku: failed to generate a unique ${diff} puzzle after ${MAX_PUZZLE_REGENERATIONS} attempts`);
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => [...row]);
}

export function cloneNotes(n: NotesGrid): NotesGrid {
  return n.map((row) => [...row]);
}

export function isConflict(board: Board, r: number, c: number): boolean {
  const v = board[r]![c];
  if (!v) return false;
  for (let i = 0; i < 9; i++) {
    if (i !== c && board[r]![i] === v) return true;
    if (i !== r && board[i]![c] === v) return true;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let x = br; x < br + 3; x++)
    for (let y = bc; y < bc + 3; y++) if ((x !== r || y !== c) && board[x]![y] === v) return true;
  return false;
}

export function isValidSolvedBoard(board: Board): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      if (board[r]![c] === 0) return false;
      if (isConflict(board, r, c)) return false;
    }
  return true;
}

export function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (a[r]![c] !== b[r]![c]) return false;
  return true;
}

const DIGIT_BIT = (d: number) => 1 << (d - 1);

export function toggleNote(cellMask: number, digit: number): number {
  return cellMask ^ DIGIT_BIT(digit);
}

export function hasNote(cellMask: number, digit: number): boolean {
  return (cellMask & DIGIT_BIT(digit)) !== 0;
}

export function autoRemoveNotesFromPlacement(
  notes: NotesGrid,
  r: number,
  c: number,
  digit: number,
): NotesGrid {
  const bit = DIGIT_BIT(digit);
  const nn = notes.map((row) => row.map((m) => m));
  for (let i = 0; i < 9; i++) {
    nn[r]![i] = nn[r]![i]! & ~bit;
    nn[i]![c] = nn[i]![c]! & ~bit;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let x = br; x < br + 3; x++) for (let y = bc; y < bc + 3; y++) nn[x]![y] = nn[x]![y]! & ~bit;
  return nn;
}
