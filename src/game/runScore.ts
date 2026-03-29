import { BASE_XP } from './constants';
import type { Difficulty } from './types';

export type RunGrade = 'S' | 'A' | 'B' | 'C' | 'D';

/** Soft time targets (seconds) for pacing bonuses—aligned with speed-style achievements. */
const TARGET_SECONDS: Record<Difficulty, number> = {
  easy: 90,
  medium: 240,
  hard: 420,
  expert: 600,
  ultimatum: 900,
};

export function computeRunScore(input: {
  diff: Difficulty;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  /** Previous best for this difficulty, if any (before this run updates it). */
  personalBestSeconds?: number;
}): { score: number; grade: RunGrade } {
  const base = 500 + (BASE_XP[input.diff] ?? 80) * 4;
  let score = base;

  const target = TARGET_SECONDS[input.diff] ?? 300;
  const timeRatio = Math.max(0.15, input.timeSeconds / target);
  if (timeRatio <= 0.55) score += 420;
  else if (timeRatio <= 0.9) score += 280;
  else if (timeRatio <= 1.25) score += 120;
  else score -= Math.min(520, Math.floor((timeRatio - 1) * 220));

  score -= input.mistakes * 115;
  score -= input.hintsUsed * 145;

  if (input.mistakes === 0) score += 360;
  if (input.hintsUsed === 0) score += 210;

  const pb = input.personalBestSeconds;
  if (pb !== undefined) {
    if (input.timeSeconds < pb) score += 320;
    else if (input.timeSeconds === pb) score += 160;
  }

  const rounded = Math.max(0, Math.min(10000, Math.round(score)));
  const grade: RunGrade =
    rounded >= 8500 ? 'S' : rounded >= 7000 ? 'A' : rounded >= 5500 ? 'B' : rounded >= 4000 ? 'C' : 'D';

  return { score: rounded, grade };
}
