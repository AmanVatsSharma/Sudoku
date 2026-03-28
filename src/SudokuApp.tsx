import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ToastStack, type ToastItem } from './components/ToastStack';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { usePersistedApp, useProfile } from './context/AppPersistProvider';
import { calcXP } from './game/constants';
import type { Difficulty } from './game/types';
import { useGameSession } from './hooks/useGameSession';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { WinScreen, type WinPayload } from './screens/WinScreen';
import { formatTime } from './theme/tokens';

type Screen = 'home' | 'game' | 'win';

export function SudokuApp() {
  const { isReady } = usePersistedApp();
  const {
    xp,
    level,
    rank,
    streak,
    solves,
    bests,
    unlockedAchievements,
    solvHist,
    settings,
    updateSettings,
    applyWin,
  } = useProfile();

  const game = useGameSession();
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('medium');
  const [winData, setWinData] = useState<WinPayload | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToasts = useCallback((items: { tid: number; title: string; desc: string; xp: number }[]) => {
    if (!items.length) return;
    setToasts((q) => [...q.slice(-2), ...items.map((i) => ({ ...i }))]);
    for (const t of items) {
      setTimeout(() => {
        setToasts((q) => q.filter((x) => x.tid !== t.tid));
      }, 3800);
    }
  }, []);

  const T = settings;

  const handleSolved = useCallback(() => {
    const xpE = calcXP(game.difficulty, game.mistakes, game.hintsUsed, game.timeSeconds);
    const granted = applyWin({
      diff: game.difficulty,
      timeSeconds: game.timeSeconds,
      mistakes: game.mistakes,
      hintsUsed: game.hintsUsed,
    });
    pushToasts(
      granted.map((g) => ({
        tid: g.tid,
        title: g.title,
        desc: g.desc,
        xp: g.xp,
      })),
    );
    setWinData({
      timeLabel: formatTime(game.timeSeconds),
      rawSeconds: game.timeSeconds,
      mistakes: game.mistakes,
      hints: game.hintsUsed,
      diff: game.difficulty,
      xpEarned: xpE,
    });
    setTimeout(() => setScreen('win'), 700);
  }, [applyWin, game.difficulty, game.hintsUsed, game.mistakes, game.timeSeconds, pushToasts]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.dark ? '#08080F' : '#F3F3EE' }}>
      <StatusBar style={T.dark ? 'light' : 'dark'} />

      {screen === 'home' ? (
        <HomeScreen
          dark={T.dark}
          onToggleDark={() => updateSettings({ dark: !T.dark })}
          accent={T.accent}
          onAccent={(accent) => updateSettings({ accent })}
          selectedDiff={selectedDiff}
          onSelectDiff={setSelectedDiff}
          onPlay={() => {
            game.startNewGame(selectedDiff);
            setScreen('game');
          }}
          onContinue={
            usePersistedApp().persisted.resume
              ? () => {
                  const r = usePersistedApp().persisted.resume;
                  if (r) {
                    game.continueFromResume(r);
                    setScreen('game');
                  }
                }
              : null
          }
          onStats={() => setShowStats(true)}
          level={level}
          xp={xp}
          rank={rank}
          streak={streak}
          solves={solves && solves}
          bests={bests}
          unlockedCount={unlockedAchievements.length}
        />
      ) : null}

      {screen === 'game' && game.board && game.solution && game.given ? (
        <GameScreen
          Tdark={T.dark}
          accent={T.accent}
          game={game}
          solution={game.solution}
          puzzle={game.puzzle!}
          given={game.given}
          hlSame={T.hlSame}
          showErr={T.showErr}
          autoRm={T.autoRm}
          showClock={T.showClock}
          onHome={() => {
            game.exitToMenu();
            setScreen('home');
          }}
          onSettings={() => setShowSettings(true)}
          onSolved={handleSolved}
        />
      ) : null}

      {screen === 'win' && winData ? (
        <WinScreen
          dark={T.dark}
          accent={T.accent}
          win={winData}
          level={level}
          xp={xp}
          onReplay={() => {
            setWinData(null);
            game.startNewGame(winData.diff);
            setScreen('game');
          }}
          onHome={() => {
            setWinData(null);
            setScreen('home');
          }}
          onNext={() => {
            const order: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'ultimatum'];
            const i = order.indexOf(winData.diff);
            const next = order[Math.min(i + 1, order.length - 1)]!;
            setWinData(null);
            game.startNewGame(next);
            setScreen('game');
          }}
        />
      ) : null}

      <ToastStack
        toasts={toasts}
        T={require('./theme/tokens').makeTheme(T.dark, T.accent)}
        onExpire={() => {}}
      />
      ...
    </View>
  );
}
