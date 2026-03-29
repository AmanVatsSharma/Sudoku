import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { StarterScreen } from './components/StarterScreen';
import { ToastStack, type ToastItem } from './components/ToastStack';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { usePersistedApp, useProfile } from './context/AppPersistProvider';
import { calcXP } from './game/constants';
import { computeRunScore } from './game/runScore';
import type { AchievementRarity } from './game/achievements';
import type { Difficulty } from './game/types';
import { useGameSession } from './hooks/useGameSession';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { WinScreen, type WinPayload } from './screens/WinScreen';
import {
  requestDailyReminderPermission,
  syncDailyReminders,
} from './notifications/dailyReminder';
import { preloadSfx, playSfx, setSfxEnabled } from './audio/sfx';
import { formatTime, makeTheme } from './theme/tokens';

type Screen = 'home' | 'game' | 'win';

const DIFF_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'ultimatum'];

export function SudokuApp() {
  const { isReady, persisted } = usePersistedApp();
  const {
    xp,
    level,
    rank,
    calendarStreak,
    solves,
    gamesStarted,
    totalWinSeconds,
    winsByDifficulty,
    flawlessWins,
    noHintWins,
    bests,
    unlockedAchievements,
    solvHist,
    settings,
    updateSettings,
    applyWin,
    grantAchievement,
  } = useProfile();

  const pushGrantToast = useCallback((g: {
    tid: number;
    title: string;
    desc: string;
    xp: number;
    rarity: AchievementRarity;
    icon: string;
  }) => {
    setToasts((q) => [...q.slice(-2), g]);
    const tid = g.tid;
    setTimeout(() => {
      setToasts((q) => q.filter((x) => x.tid !== tid));
    }, 3800);
  }, []);

  const game = useGameSession(
    useMemo(
      () => ({
        onFlowEnter: () => {
          const g = grantAchievement('flow');
          if (g)
            pushGrantToast({
              tid: g.tid,
              title: g.title,
              desc: g.desc,
              xp: g.xp,
              rarity: g.rarity,
              icon: g.icon,
            });
        },
        onBranchCreated: () => {
          const g = grantAchievement('brancher');
          if (g)
            pushGrantToast({
              tid: g.tid,
              title: g.title,
              desc: g.desc,
              xp: g.xp,
              rarity: g.rarity,
              icon: g.icon,
            });
        },
      }),
      [grantAchievement, pushGrantToast],
    ),
  );
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('medium');
  const [winData, setWinData] = useState<WinPayload | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [starterDone, setStarterDone] = useState(false);
  const dailyReminderRef = useRef(settings.dailyReminder);
  dailyReminderRef.current = settings.dailyReminder;

  const S = settings;
  const theme = makeTheme(S.dark, S.accent);

  const pushToasts = useCallback(
    (
      items: {
        tid: number;
        title: string;
        desc: string;
        xp: number;
        rarity: AchievementRarity;
        icon: string;
      }[],
    ) => {
      if (!items.length) return;
      setToasts((q) => [...q.slice(-2), ...items.map((i) => ({ ...i }))]);
      for (const t of items) {
        const tid = t.tid;
        setTimeout(() => {
          setToasts((q) => q.filter((x) => x.tid !== tid));
        }, 3800);
      }
    },
    [],
  );

  const handleSolved = useCallback(
    (meta?: { mistakes?: number; hintsUsed?: number; flowBonus?: boolean }) => {
      playSfx('win');
      const mistakes = meta?.mistakes ?? game.mistakes;
      const hintsUsed = meta?.hintsUsed ?? game.hintsUsed;
      const flowBonus = meta?.flowBonus ?? false;
      const xpE = calcXP(game.difficulty, mistakes, hintsUsed, game.timeSeconds, flowBonus);
      const prevBest = persisted.bests[game.difficulty];
      const { score: runScore, grade } = computeRunScore({
        diff: game.difficulty,
        timeSeconds: game.timeSeconds,
        mistakes,
        hintsUsed,
        personalBestSeconds: prevBest,
      });
      const granted = applyWin({
        diff: game.difficulty,
        timeSeconds: game.timeSeconds,
        mistakes,
        hintsUsed,
        flowBonus,
      });
      pushToasts(
        granted.map((g) => ({
          tid: g.tid,
          title: g.title,
          desc: g.desc,
          xp: g.xp,
          rarity: g.rarity,
          icon: g.icon,
        })),
      );
      setWinData({
        timeLabel: formatTime(game.timeSeconds),
        rawSeconds: game.timeSeconds,
        mistakes,
        hints: hintsUsed,
        diff: game.difficulty,
        xpEarned: xpE,
        runScore,
        grade,
        flowBonus,
      });
      setTimeout(() => setScreen('win'), 700);
    },
    [
      applyWin,
      game.difficulty,
      game.hintsUsed,
      game.mistakes,
      game.timeSeconds,
      persisted.bests,
      pushToasts,
    ],
  );

  useEffect(() => {
    if (!isReady) return;
    void SplashScreen.hideAsync();
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    void preloadSfx();
  }, [isReady]);

  useEffect(() => {
    setSfxEnabled(S.soundEffects);
  }, [S.soundEffects]);

  useEffect(() => {
    if (!isReady || !starterDone) return;
    void syncDailyReminders(S.dailyReminder);
  }, [isReady, starterDone, S.dailyReminder]);

  useEffect(() => {
    if (!isReady || !starterDone) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && dailyReminderRef.current) {
        void syncDailyReminders(true);
      }
    });
    return () => sub.remove();
  }, [isReady, starterDone]);

  const onDailyReminderChange = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const ok = await requestDailyReminderPermission();
        if (!ok) {
          Alert.alert(
            'Notifications disabled',
            'Allow notifications in system settings if you want a daily puzzle reminder.',
          );
          return;
        }
        updateSettings({ dailyReminder: true });
        return;
      }
      updateSettings({ dailyReminder: false });
    },
    [updateSettings],
  );

  if (!isReady) {
    return null;
  }

  if (!starterDone) {
    return <StarterScreen onContinue={() => setStarterDone(true)} />;
  }

  const resume = persisted.resume;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={S.dark ? 'light' : 'dark'} />

      {screen === 'home' ? (
        <HomeScreen
          dark={S.dark}
          onToggleDark={() => updateSettings({ dark: !S.dark })}
          accent={S.accent}
          onAccent={(accent) => updateSettings({ accent })}
          selectedDiff={selectedDiff}
          onSelectDiff={setSelectedDiff}
          onPlay={() => {
            game.startNewGame(selectedDiff);
            setScreen('game');
          }}
          onContinue={
            resume
              ? () => {
                  game.continueFromResume(resume);
                  setScreen('game');
                }
              : null
          }
          onStats={() => setShowStats(true)}
          level={level}
          xp={xp}
          rank={rank}
          streak={calendarStreak}
          solves={solves}
          gamesStarted={gamesStarted}
          bests={bests}
          unlockedCount={unlockedAchievements.length}
        />
      ) : null}

      {screen === 'game' && game.board && game.solution && game.given ? (
        <GameScreen
          Tdark={S.dark}
          accent={S.accent}
          game={game}
          solution={game.solution}
          puzzle={game.puzzle!}
          given={game.given}
          hlSame={S.hlSame}
          showErr={S.showErr}
          autoRm={S.autoRm}
          blockBad={S.blockBad}
          numberPadMode={S.numberPadMode}
          showClock={S.showClock}
          onHome={() => {
            const leave = () => {
              game.exitToMenu();
              setScreen('home');
            };
            if (game.hasMeaningfulProgress) {
              Alert.alert(
                'Leave game?',
                'Your progress will be saved. You can tap Continue on the home screen to resume.',
                [
                  { text: 'Keep playing', style: 'cancel' },
                  { text: 'Leave', style: 'destructive', onPress: leave },
                ],
              );
            } else {
              leave();
            }
          }}
          onSettings={() => setShowSettings(true)}
          onSolved={handleSolved}
        />
      ) : null}

      {screen === 'win' && winData ? (
        <WinScreen
          dark={S.dark}
          accent={S.accent}
          win={winData}
          level={level}
          xp={xp}
          rank={rank}
          onReplay={() => {
            const d = winData.diff;
            setWinData(null);
            game.startNewGame(d);
            setScreen('game');
          }}
          onHome={() => {
            setWinData(null);
            setScreen('home');
          }}
          onNext={() => {
            const i = DIFF_ORDER.indexOf(winData.diff);
            const next = DIFF_ORDER[Math.min(i + 1, DIFF_ORDER.length - 1)]!;
            setWinData(null);
            game.startNewGame(next);
            setScreen('game');
          }}
        />
      ) : null}

      <ToastStack toasts={toasts} T={theme} />

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        dark={S.dark}
        setDark={(v) => updateSettings({ dark: v })}
        accent={S.accent}
        setAccent={(a) => updateSettings({ accent: a })}
        hlSame={S.hlSame}
        setHlSame={(v) => updateSettings({ hlSame: v })}
        showErr={S.showErr}
        setShowErr={(v) => updateSettings({ showErr: v })}
        autoRm={S.autoRm}
        setAutoRm={(v) => updateSettings({ autoRm: v })}
        blockBad={S.blockBad}
        setBlockBad={(v) => updateSettings({ blockBad: v })}
        numberPadMode={S.numberPadMode}
        setNumberPadMode={(v) => updateSettings({ numberPadMode: v })}
        showClock={S.showClock}
        setShowClock={(v) => updateSettings({ showClock: v })}
        soundEffects={S.soundEffects}
        setSoundEffects={(v) => updateSettings({ soundEffects: v })}
        dailyReminder={S.dailyReminder}
        onDailyReminderChange={onDailyReminderChange}
        paused={game.paused}
        onTogglePause={() => game.setPaused((p) => !p)}
        onNewGame={() => {
          game.exitToMenu();
          setScreen('home');
        }}
      />

      <StatsModal
        visible={showStats}
        onClose={() => setShowStats(false)}
        dark={S.dark}
        accent={S.accent}
        level={level}
        xp={xp}
        rank={rank}
        streak={calendarStreak}
        solves={solves}
        gamesStarted={gamesStarted}
        totalWinSeconds={totalWinSeconds}
        winsByDifficulty={winsByDifficulty}
        flawlessWins={flawlessWins}
        noHintWins={noHintWins}
        bests={bests}
        solvHist={solvHist}
        unlockedIds={unlockedAchievements}
      />
    </View>
  );
}
