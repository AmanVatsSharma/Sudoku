import type { AccentId } from '../theme/tokens';
import { isValidSolvedBoard } from '../game/engine';
import type { Board, Difficulty } from '../game/types';

import type {
  AppPersisted,
  AppPersistedV1,
  AppPersistedV2Disk,
  GameBranchSnapshotV1,
  NumberPadMode,
  ResumeStateV1,
  SolveHistoryEntry,
} from './schema';
import { PERSISTENCE_VERSION, defaultPersisted, defaultSettings } from './schema';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'ultimatum'];
const ACCENTS: AccentId[] = ['blue', 'purple', 'green', 'orange', 'teal'];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function validBoard(b: unknown): b is Board {
  if (!Array.isArray(b) || b.length !== 9) return false;
  for (const row of b) {
    if (!Array.isArray(row) || row.length !== 9) return false;
    for (const v of row) {
      if (typeof v !== 'number' || v < 0 || v > 9 || !Number.isInteger(v)) return false;
    }
  }
  return true;
}

const NUMBER_PAD_MODES = new Set<NumberPadMode>(['floating', 'bottom']);

function validNotes(n: unknown): boolean {
  if (!Array.isArray(n) || n.length !== 9) return false;
  for (const row of n) {
    if (!Array.isArray(row) || row.length !== 9) return false;
    for (const m of row) {
      if (typeof m !== 'number' || m < 0 || m > 0x1ff || !Number.isInteger(m)) return false;
    }
  }
  return true;
}

function validateBranches(raw: unknown): GameBranchSnapshotV1[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 24) return null;
  const out: GameBranchSnapshotV1[] = [];
  for (const item of raw) {
    if (!isRecord(item)) return null;
    if (typeof item.name !== 'string' || item.name.length > 48) return null;
    if (typeof item.isMain !== 'boolean') return null;
    if (!validBoard(item.board) || !validNotes(item.notes)) return null;
    out.push({
      name: item.name,
      isMain: item.isMain,
      board: item.board as import('../game/types').Board,
      notes: item.notes as import('../game/types').NotesGrid,
    });
  }
  if (out.filter((b) => b.isMain).length !== 1) return null;
  return out;
}

export function validateResume(raw: unknown): ResumeStateV1 | null {
  if (!isRecord(raw)) return null;
  const diff = raw.diff;
  if (typeof diff !== 'string' || !DIFFICULTIES.includes(diff as Difficulty)) return null;
  if (!validBoard(raw.puzzle) || !validBoard(raw.solution) || !validBoard(raw.board)) return null;
  if (!Array.isArray(raw.given) || raw.given.length !== 9) return null;
  for (let r = 0; r < 9; r++) {
    const row = raw.given[r];
    if (!Array.isArray(row) || row.length !== 9) return null;
    for (let c = 0; c < 9; c++) {
      if (typeof row[c] !== 'boolean') return null;
    }
  }
  if (!validNotes(raw.notes)) return null;
  if (typeof raw.mistakes !== 'number' || raw.mistakes < 0 || raw.mistakes > 200) return null;
  if (typeof raw.hintsUsed !== 'number' || raw.hintsUsed < 0 || raw.hintsUsed > 3) return null;
  if (typeof raw.timeSeconds !== 'number' || raw.timeSeconds < 0 || raw.timeSeconds > 86400 * 30)
    return null;
  if (typeof raw.noteMode !== 'boolean') return null;
  if (!Array.isArray(raw.history)) return null;
  const puzzle = raw.puzzle as Board;
  const solution = raw.solution as Board;
  const given = raw.given as boolean[][];
  const board = raw.board as Board;
  if (!isValidSolvedBoard(solution)) return null;
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      if (given[r]![c] && puzzle[r]![c] === 0) return null;
      if (given[r]![c] && board[r]![c] !== puzzle[r]![c]) return null;
    }
  const hist: ResumeStateV1['history'] = [];
  for (const h of raw.history.slice(-100)) {
    if (!isRecord(h) || !validBoard(h.board) || !validNotes(h.notes)) return null;
    hist.push({ board: h.board as Board, notes: h.notes as import('../game/types').NotesGrid });
  }

  const branches = validateBranches(raw.branches);
  let activeBranch = typeof raw.activeBranch === 'number' ? Math.floor(raw.activeBranch) : 0;
  const showBranches = typeof raw.showBranches === 'boolean' ? raw.showBranches : false;
  if (branches) {
    if (activeBranch < 0 || activeBranch >= branches.length) activeBranch = 0;
  } else {
    activeBranch = 0;
  }

  const consecutiveCorrect =
    typeof raw.consecutiveCorrect === 'number'
      ? Math.max(0, Math.min(99, Math.floor(raw.consecutiveCorrect)))
      : 0;
  const flowState = typeof raw.flowState === 'boolean' ? raw.flowState : false;
  const flowSecondsLeft =
    typeof raw.flowSecondsLeft === 'number'
      ? Math.max(0, Math.min(120, Math.floor(raw.flowSecondsLeft)))
      : 0;

  const base: ResumeStateV1 = {
    diff: diff as Difficulty,
    puzzle,
    solution,
    given,
    board,
    notes: raw.notes as import('../game/types').NotesGrid,
    mistakes: raw.mistakes,
    hintsUsed: raw.hintsUsed,
    timeSeconds: raw.timeSeconds,
    history: hist,
    noteMode: raw.noteMode,
  };

  if (branches) {
    base.branches = branches;
    base.activeBranch = activeBranch;
    base.showBranches = showBranches;
  }
  base.consecutiveCorrect = consecutiveCorrect;
  base.flowState = flowState;
  base.flowSecondsLeft = flowSecondsLeft;

  return base;
}

function sanitizeSettings(s: unknown): AppPersisted['settings'] {
  const d = defaultSettings();
  if (!isRecord(s)) return d;
  const pad =
    typeof s.numberPadMode === 'string' && NUMBER_PAD_MODES.has(s.numberPadMode as NumberPadMode)
      ? (s.numberPadMode as NumberPadMode)
      : d.numberPadMode;

  return {
    dark: typeof s.dark === 'boolean' ? s.dark : d.dark,
    accent:
      typeof s.accent === 'string' && ACCENTS.includes(s.accent as AccentId)
        ? (s.accent as AccentId)
        : d.accent,
    hlSame: typeof s.hlSame === 'boolean' ? s.hlSame : d.hlSame,
    showErr: typeof s.showErr === 'boolean' ? s.showErr : d.showErr,
    autoRm: typeof s.autoRm === 'boolean' ? s.autoRm : d.autoRm,
    showClock: typeof s.showClock === 'boolean' ? s.showClock : d.showClock,
    dailyReminder:
      typeof s.dailyReminder === 'boolean' ? s.dailyReminder : d.dailyReminder,
    blockBad: typeof s.blockBad === 'boolean' ? s.blockBad : d.blockBad,
    numberPadMode: pad,
    soundEffects:
      typeof s.soundEffects === 'boolean' ? s.soundEffects : d.soundEffects,
  };
}

function sanitizeBests(x: unknown): AppPersisted['bests'] {
  if (!isRecord(x)) return {};
  const o: AppPersisted['bests'] = {};
  for (const k of DIFFICULTIES) {
    const v = x[k];
    if (typeof v === 'number' && v >= 0 && v < 86400 * 7) o[k] = v;
  }
  return o;
}

function sanitizeWinsByDifficulty(x: unknown): AppPersisted['winsByDifficulty'] {
  if (!isRecord(x)) return {};
  const o: AppPersisted['winsByDifficulty'] = {};
  for (const k of DIFFICULTIES) {
    const v = x[k];
    if (typeof v === 'number' && v >= 0 && v < 1e6) o[k] = Math.floor(v);
  }
  return o;
}

const RUN_GRADES = new Set(['S', 'A', 'B', 'C', 'D']);

function sanitizeSolvHist(x: unknown): SolveHistoryEntry[] {
  if (!Array.isArray(x)) return [];
  const out: SolveHistoryEntry[] = [];
  for (const e of x.slice(0, 50)) {
    if (!isRecord(e)) continue;
    const diff = e.diff;
    if (typeof diff !== 'string' || !DIFFICULTIES.includes(diff as Difficulty)) continue;
    if (typeof e.time !== 'string' || e.time.length > 32) continue;
    if (typeof e.mistakes !== 'number' || e.mistakes < 0) continue;
    if (typeof e.xp !== 'number' || e.xp < 0) continue;
    const entry: SolveHistoryEntry = {
      diff: diff as Difficulty,
      time: e.time,
      mistakes: e.mistakes,
      xp: e.xp,
    };
    if (typeof e.hintsUsed === 'number' && e.hintsUsed >= 0 && e.hintsUsed <= 9)
      entry.hintsUsed = e.hintsUsed;
    if (typeof e.grade === 'string' && e.grade.length <= 2 && RUN_GRADES.has(e.grade))
      entry.grade = e.grade;
    if (typeof e.runScore === 'number' && e.runScore >= 0 && e.runScore <= 10000)
      entry.runScore = Math.round(e.runScore);
    out.push(entry);
  }
  return out.slice(0, 20);
}

function migrateV1ToLatest(row: AppPersistedV1): AppPersisted {
  const resume = row.resume ? validateResume(row.resume as unknown) : null;
  const unlocked = Array.isArray(row.unlockedAchievements)
    ? [...new Set(row.unlockedAchievements.filter((x) => typeof x === 'string'))]
    : [];
  const def = defaultPersisted();
  return {
    ...def,
    xp: Math.max(0, Math.floor(row.xp)),
    calendarStreak: Math.max(0, Math.min(999, Math.floor(row.streak))),
    lastWinCalendarYmd: null,
    solves: Math.max(0, Math.floor(row.solves)),
    bests: sanitizeBests(row.bests),
    solvHist: sanitizeSolvHist(row.solvHist),
    unlockedAchievements: unlocked,
    settings: sanitizeSettings(row.settings),
    resume,
  };
}

function migrateV2DiskToLatest(row: AppPersistedV2Disk): AppPersisted {
  const def = defaultPersisted();
  let resume: ResumeStateV1 | null = null;
  if (row.resume != null) resume = validateResume(row.resume);

  const unlocked = Array.isArray(row.unlockedAchievements)
    ? [...new Set(row.unlockedAchievements.filter((x): x is string => typeof x === 'string'))]
    : [];

  return {
    ...def,
    v: PERSISTENCE_VERSION,
    xp: typeof row.xp === 'number' && row.xp >= 0 ? Math.floor(row.xp) : 0,
    calendarStreak:
      typeof row.calendarStreak === 'number'
        ? Math.max(0, Math.min(999, Math.floor(row.calendarStreak)))
        : 0,
    lastWinCalendarYmd:
      typeof row.lastWinCalendarYmd === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(row.lastWinCalendarYmd)
        ? row.lastWinCalendarYmd
        : null,
    solves: typeof row.solves === 'number' && row.solves >= 0 ? Math.floor(row.solves) : 0,
    bests: sanitizeBests(row.bests),
    unlockedAchievements: unlocked,
    solvHist: sanitizeSolvHist(row.solvHist),
    settings: sanitizeSettings(row.settings),
    resume,
  };
}

export function normalizePersisted(raw: unknown): AppPersisted {
  const base = defaultPersisted();
  if (!isRecord(raw)) return base;

  if (raw.v === 1) {
    const row = raw as unknown as AppPersistedV1;
    if (
      typeof row.xp !== 'number' ||
      typeof row.streak !== 'number' ||
      typeof row.solves !== 'number'
    ) {
      return base;
    }
    try {
      return migrateV1ToLatest(row);
    } catch {
      return base;
    }
  }

  if (raw.v === 2) {
    const row = raw as unknown as AppPersistedV2Disk;
    try {
      return migrateV2DiskToLatest(row);
    } catch {
      return base;
    }
  }

  if (raw.v !== 3 && raw.v !== 4) return base;

  const xp = typeof raw.xp === 'number' && raw.xp >= 0 ? Math.floor(raw.xp) : 0;
  const calendarStreak =
    typeof raw.calendarStreak === 'number'
      ? Math.max(0, Math.min(999, Math.floor(raw.calendarStreak)))
      : 0;
  const lastWin =
    typeof raw.lastWinCalendarYmd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastWinCalendarYmd)
      ? raw.lastWinCalendarYmd
      : null;
  const solves = typeof raw.solves === 'number' && raw.solves >= 0 ? Math.floor(raw.solves) : 0;
  const gamesStarted =
    typeof raw.gamesStarted === 'number' && raw.gamesStarted >= 0
      ? Math.min(1e7, Math.floor(raw.gamesStarted))
      : 0;
  const totalWinSeconds =
    typeof raw.totalWinSeconds === 'number' && raw.totalWinSeconds >= 0
      ? Math.min(1e12, Math.floor(raw.totalWinSeconds))
      : 0;
  const flawlessWins =
    typeof raw.flawlessWins === 'number' && raw.flawlessWins >= 0
      ? Math.min(1e7, Math.floor(raw.flawlessWins))
      : 0;
  const noHintWins =
    typeof raw.noHintWins === 'number' && raw.noHintWins >= 0
      ? Math.min(1e7, Math.floor(raw.noHintWins))
      : 0;

  let resume: ResumeStateV1 | null = null;
  if (raw.resume != null) resume = validateResume(raw.resume);

  const unlocked = Array.isArray(raw.unlockedAchievements)
    ? [...new Set(raw.unlockedAchievements.filter((x): x is string => typeof x === 'string'))]
    : [];

  return {
    v: PERSISTENCE_VERSION,
    xp,
    calendarStreak,
    lastWinCalendarYmd: lastWin,
    solves,
    gamesStarted,
    totalWinSeconds,
    winsByDifficulty: sanitizeWinsByDifficulty(raw.winsByDifficulty),
    flawlessWins,
    noHintWins,
    bests: sanitizeBests(raw.bests),
    unlockedAchievements: unlocked,
    solvHist: sanitizeSolvHist(raw.solvHist),
    settings: sanitizeSettings(raw.settings),
    resume,
  };
}
