import type { AccentId } from '../theme/tokens';
import type { Board, Difficulty, NotesGrid } from '../game/types';

export const PERSISTENCE_VERSION = 3 as const;

export type SolveHistoryEntry = {
  diff: Difficulty;
  time: string;
  mistakes: number;
  xp: number;
  hintsUsed?: number;
  grade?: string;
  runScore?: number;
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
  /** Local notification: one randomized reminder per day (native only). */
  dailyReminder: boolean;
};

export type AppPersistedV1 = {
  v: 1;
  xp: number;
  streak: number;
  solves: number;
  bests: Partial<Record<Difficulty, number>>;
  unlockedAchievements: string[];
  solvHist: SolveHistoryEntry[];
  settings: AppSettingsV1;
  resume: ResumeStateV1 | null;
};

/** Legacy on-disk shape (before gamesStarted / run stats). */
export type AppPersistedV2Disk = {
  v: 2;
  xp: number;
  calendarStreak: number;
  lastWinCalendarYmd: string | null;
  solves: number;
  bests: Partial<Record<Difficulty, number>>;
  unlockedAchievements: string[];
  solvHist: SolveHistoryEntry[];
  settings: AppSettingsV1;
  resume: ResumeStateV1 | null;
};

export type AppPersisted = {
  v: typeof PERSISTENCE_VERSION;
  xp: number;
  calendarStreak: number;
  lastWinCalendarYmd: string | null;
  solves: number;
  /** Fresh puzzles started (excludes resume). */
  gamesStarted: number;
  /** Sum of win durations in seconds. */
  totalWinSeconds: number;
  winsByDifficulty: Partial<Record<Difficulty, number>>;
  flawlessWins: number;
  noHintWins: number;
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
    dailyReminder: false,
  };
}

export function defaultPersisted(): AppPersisted {
  return {
    v: PERSISTENCE_VERSION,
    xp: 0,
    calendarStreak: 0,
    lastWinCalendarYmd: null,
    solves: 0,
    gamesStarted: 0,
    totalWinSeconds: 0,
    winsByDifficulty: {},
    flawlessWins: 0,
    noHintWins: 0,
    bests: {},
    unlockedAchievements: [],
    solvHist: [],
    settings: defaultSettings(),
    resume: null,
  };
}
