import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { achievementById, type AchievementRarity } from '../game/achievements';
import { XP_PER_LEVEL, calcXP, rankForLevel } from '../game/constants';
import { computeRunScore } from '../game/runScore';
import type { Difficulty } from '../game/types';
import type { AppPersisted, AppSettingsV1, ResumeStateV1 } from '../persistence/schema';
import { defaultPersisted } from '../persistence/schema';
import { loadPersisted, savePersisted } from '../persistence/storage';
import { formatTime } from '../theme/tokens';
import { localCalendarYmd, nextCalendarStreak } from '../utils/calendar';

const DEBOUNCE_MS = 450;

const ALL_DIFFS: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'ultimatum'];

type WinApplyInput = {
  diff: Difficulty;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
};

export type GrantedAchievementToast = {
  tid: number;
  id: string;
  title: string;
  desc: string;
  xp: number;
  rarity: AchievementRarity;
  icon: string;
};

type AppPersistContextValue = {
  persisted: AppPersisted;
  isReady: boolean;
  level: number;
  rank: string;
  updateSettings: (partial: Partial<AppSettingsV1>) => void;
  replaceResume: (resume: ResumeStateV1 | null) => void;
  bumpGamesStarted: () => void;
  applyWin: (input: WinApplyInput) => GrantedAchievementToast[];
};

const AppPersistContext = createContext<AppPersistContextValue | null>(null);

function computeWin(
  p: AppPersisted,
  input: WinApplyInput,
): { next: AppPersisted; granted: GrantedAchievementToast[] } {
  const solvesBefore = p.solves;
  const xpEarned = calcXP(input.diff, input.mistakes, input.hintsUsed, input.timeSeconds);
  const prevBest = p.bests[input.diff];
  const { score: runScore, grade } = computeRunScore({
    diff: input.diff,
    timeSeconds: input.timeSeconds,
    mistakes: input.mistakes,
    hintsUsed: input.hintsUsed,
    personalBestSeconds: prevBest,
  });

  const today = localCalendarYmd();
  const { streak: calendarStreak, lastWinYmd: lastWinCalendarYmd } = nextCalendarStreak(
    p.calendarStreak,
    p.lastWinCalendarYmd,
    today,
  );

  const unlocked = new Set(p.unlockedAchievements);
  const granted: GrantedAchievementToast[] = [];
  let xpDelta = xpEarned;

  const tryGrant = (id: string, condition: boolean) => {
    if (!condition || unlocked.has(id)) return;
    const a = achievementById(id);
    if (!a) return;
    unlocked.add(id);
    xpDelta += a.xp;
    granted.push({
      tid: Date.now() + Math.random(),
      id: a.id,
      title: a.title,
      desc: a.desc,
      xp: a.xp,
      rarity: a.rarity,
      icon: a.icon,
    });
  };

  tryGrant('first', solvesBefore === 0);
  tryGrant('flawless', input.mistakes === 0);
  tryGrant('solo', input.hintsUsed === 0);
  tryGrant('speed', input.diff === 'easy' && input.timeSeconds < 90);
  tryGrant('expert', input.diff === 'expert');
  tryGrant('ultimate', input.diff === 'ultimatum');
  tryGrant('streak3', calendarStreak >= 3);
  tryGrant('perfect', input.diff === 'expert' && input.mistakes === 0 && input.hintsUsed === 0);

  const totalSolvesAfter = solvesBefore + 1;
  tryGrant('solve10', totalSolvesAfter >= 10);
  tryGrant('solve50', totalSolvesAfter >= 50);
  tryGrant('solve100', totalSolvesAfter >= 100);

  const nextWinsByDiff = {
    ...p.winsByDifficulty,
    [input.diff]: (p.winsByDifficulty[input.diff] ?? 0) + 1,
  };
  const allDiffsWon = ALL_DIFFS.every((d) => (nextWinsByDiff[d] ?? 0) >= 1);
  tryGrant('fullSpectrum', allDiffsWon);

  tryGrant('streak7', calendarStreak >= 7);

  const nextFlawlessWins = p.flawlessWins + (input.mistakes === 0 ? 1 : 0);
  tryGrant('flawless25', nextFlawlessWins >= 25);

  tryGrant('speedMed', input.diff === 'medium' && input.timeSeconds < 240);
  tryGrant('speedHard', input.diff === 'hard' && input.timeSeconds < 420);

  const bests =
    prevBest === undefined || input.timeSeconds < prevBest
      ? { ...p.bests, [input.diff]: input.timeSeconds }
      : p.bests;

  const nextNoHintWins = p.noHintWins + (input.hintsUsed === 0 ? 1 : 0);

  const next: AppPersisted = {
    ...p,
    xp: p.xp + xpDelta,
    calendarStreak,
    lastWinCalendarYmd,
    solves: totalSolvesAfter,
    totalWinSeconds: p.totalWinSeconds + input.timeSeconds,
    winsByDifficulty: nextWinsByDiff,
    flawlessWins: nextFlawlessWins,
    noHintWins: nextNoHintWins,
    bests,
    unlockedAchievements: [...unlocked],
    solvHist: [
      {
        diff: input.diff,
        time: formatTime(input.timeSeconds),
        mistakes: input.mistakes,
        xp: xpEarned,
        hintsUsed: input.hintsUsed,
        grade,
        runScore,
      },
      ...p.solvHist.slice(0, 19),
    ],
    resume: null,
  };

  return { next, granted };
}

export function AppPersistProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<AppPersisted>(defaultPersisted);
  const [isReady, setIsReady] = useState(false);
  const persistedRef = useRef(persisted);
  persistedRef.current = persisted;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await loadPersisted();
      if (!cancelled) {
        setPersisted(loaded);
        setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void savePersisted(persistedRef.current);
    }, DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [persisted, isReady]);

  const updateSettings = useCallback((partial: Partial<AppSettingsV1>) => {
    setPersisted((p) => ({
      ...p,
      settings: { ...p.settings, ...partial },
    }));
  }, []);

  const replaceResume = useCallback((resume: ResumeStateV1 | null) => {
    setPersisted((p) => ({ ...p, resume }));
  }, []);

  const bumpGamesStarted = useCallback(() => {
    setPersisted((p) => ({ ...p, gamesStarted: p.gamesStarted + 1 }));
  }, []);

  const applyWin = useCallback((input: WinApplyInput): GrantedAchievementToast[] => {
    const pr = persistedRef.current;
    const { next, granted } = computeWin(pr, input);
    setPersisted(next);
    return granted;
  }, []);

  const level = Math.floor(persisted.xp / XP_PER_LEVEL) + 1;
  const rank = rankForLevel(level);

  const value = useMemo<AppPersistContextValue>(
    () => ({
      persisted,
      isReady,
      level,
      rank,
      updateSettings,
      replaceResume,
      bumpGamesStarted,
      applyWin,
    }),
    [applyWin, bumpGamesStarted, isReady, level, rank, persisted, replaceResume, updateSettings],
  );

  return <AppPersistContext.Provider value={value}>{children}</AppPersistContext.Provider>;
}

export function usePersistedApp(): AppPersistContextValue {
  const ctx = useContext(AppPersistContext);
  if (!ctx) throw new Error('usePersistedApp must be used within AppPersistProvider');
  return ctx;
}

export function useProfile() {
  const { persisted, level, rank, updateSettings, applyWin, isReady } = usePersistedApp();
  return {
    isReady,
    xp: persisted.xp,
    level,
    rank,
    calendarStreak: persisted.calendarStreak,
    solves: persisted.solves,
    gamesStarted: persisted.gamesStarted,
    totalWinSeconds: persisted.totalWinSeconds,
    winsByDifficulty: persisted.winsByDifficulty,
    flawlessWins: persisted.flawlessWins,
    noHintWins: persisted.noHintWins,
    bests: persisted.bests,
    unlockedAchievements: persisted.unlockedAchievements,
    solvHist: persisted.solvHist,
    settings: persisted.settings,
    updateSettings,
    applyWin,
  };
}
