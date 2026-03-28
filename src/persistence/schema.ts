import type { AccentId } from '../theme/tokens';
import type { Board, Difficulty, NotesGrid } from '../game/types';

export const PERSISTENCE_VERSION = 1 as const;

export type SolveHistoryEntry = {
  diff: Difficulty;
  time: string;
  mistakes: number;
  xp: number;
};

export type ResumeStateV1 = {
  diff: Difficulty;
  puzzle: Board;
  solution: Board;
  given: boolean[][];
  board: Board;
  notes: NotesGrid;
  mistakes: number;
  hintsUsed: number;
  timeSeconds: number;
  history: { board: Board; notes: NotesGrid }[];
  noteMode: boolean;
};

export type AppSettingsV1 = {
  dark: boolean;
  accent: AccentId;
  hlSame: boolean;
  showErr: boolean;
  autoRm: boolean;
  showClock: boolean;
};

export type AppPersistedV1 = {
  v: typeof PERSISTENCE_VERSION;
  xp: number;
  streak: number;
  solves: number;
  bests: Partial<Record<Difficulty, number>>;
  unlockedAchievements: string[];
  solvHist: SolveHistoryEntry[];
  settings: AppSettingsV1;
  resume: ResumeStateV1 | null;
};

export function defaultSettings(): AppSettingsV1 {
  return {
    dark: true,
    accent: 'blue',
    hlSame: true,
    showErr: true,
    autoRm: true,
    showClock: true,
  };
}

export function defaultPersisted(): AppPersistedV1 {
  return {
    v: PERSISTENCE_VERSION,
    xp: 0,
    streak: 1,
    solves: 0,
    bests: {},
    unlockedAchievements: [],
    solvHist: [],
    settings: defaultSettings(),
    resume: null,
  };
}
