import type { Difficulty } from './types';

export const CLUES_REMOVED: Record<Difficulty, number> = {
  easy: 27,
  medium: 37,
  hard: 46,
  expert: 53,
  ultimatum: 60,
};

export const XP_PER_LEVEL = 500;

export const RANKS = [
  'Novice',
  'Student',
  'Solver',
  'Sharp',
  'Expert',
  'Elite',
  'Master',
  'Sage',
  'Champion',
  'Ultimatum',
] as const;

export function rankForLevel(level: number): string {
  const idx = Math.min(Math.max(level, 1) - 1, RANKS.length - 1);
  return RANKS[idx] ?? RANKS[0];
}

export const BASE_XP: Record<Difficulty, number> = {
  easy: 80,
  medium: 160,
  hard: 300,
  expert: 500,
  ultimatum: 900,
};

export function calcXP(
  diff: Difficulty,
  mistakes: number,
  hints: number,
  timeSeconds: number,
  flowBonus?: boolean,
): number {
  let x = BASE_XP[diff] ?? 80;
  if (mistakes === 0) x = Math.round(x * 1.5);
  if (hints === 0) x = Math.round(x * 1.2);
  if (diff === 'easy' && timeSeconds < 90) x = Math.round(x * 1.3);
  if (flowBonus) x = Math.round(x * 1.2);
  return x;
}
