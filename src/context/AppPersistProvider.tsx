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

import { achievementById } from '../game/achievements';
import { XP_PER_LEVEL, calcXP, rankForLevel } from '../game/constants';
import type { Difficulty } from '../game/types';
import type { AppPersistedV2, AppSettingsV1, ResumeStateV1 } from '../persistence/schema';
import { defaultPersisted } from '../persistence/schema';
import { loadPersisted, savePersisted } from '../persistence/storage';
import { formatTime } from '../theme/tokens';
import { localCalendarYmd, nextCalendarStreak } from '../utils/calendar';

const DEBOUNCE_MS = 450;

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
};

type AppPersistContextValue = {
  persisted: AppPersistedV2;
  isReady: boolean;
  level: number;
  rank: string;
  updateSettings: (partial: Partial<AppSettingsV1>) => void;
  replaceResume: (resume: ResumeStateV1 | null) => void;
  applyWin: (input: WinApplyInput) => GrantedAchievementToast[];
};

const AppPersistContext = createContext<AppPersistContextValue | null>(null);

function computeWin(
  p: AppPersistedV2,
  input: WinApplyInput,
): { next: AppPersistedV2; granted: GrantedAchievementToast[] } {
  const solvesBefore = p.solves;
  const xpEarned = calcXP(input.diff, input.mistakes, input.hintsUsed, input.timeSeconds);

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

  const prevBest = p.bests[input.diff];
  const bests =
    prevBest === undefined || input.timeSeconds < prevBest
      ? { ...p.bests, [input.diff]: input.timeSeconds }
      : p.bests;

  const next: AppPersistedV2 = {
    ...p,
    xp: p.xp + xpDelta,
    calendarStreak,
    lastWinCalendarYmd,
    solves: p.solves + 1,
    bests,
    unlockedAchievements: [...unlocked],
    solvHist: [
      {
        diff: input.diff,
        time: formatTime(input.timeSeconds),
        mistakes: input.mistakes,
        xp: xpEarned,
      },
      ...p.solvHist.slice(0, 19),
    ],
    resume: null,
  };

  return { next, granted };
}

export function AppPersistProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<AppPersistedV2>(defaultPersisted);
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

  const applyWin = useCallback((input: WinApplyInput): GrantedAchievementToast[] => {
    const p = persistedRef.current;
    const { next, granted } = computeWin(p, input);
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
      applyWin,
    }),
    [applyWin, isReady, level, rank, persisted, replaceResume, updateSettings],
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
    bests: persisted.bests,
    unlockedAchievements: persisted.unlockedAchievements,
    solvHist: persisted.solvHist,
    settings: persisted.settings,
    updateSettings,
    applyWin,
  };
}
