import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SudokuGrid } from '../components/SudokuGrid';
import type { Board } from '../game/types';
import { DIFFICULTY_META, formatTime, makeTheme, type AccentId } from '../theme/tokens';
import type { GameSessionApi } from '../hooks/useGameSession';

type Props = {
  Tdark: boolean;
  accent: AccentId;
  game: GameSessionApi;
  solution: Board;
  puzzle: Board;
  given: boolean[][];
  hlSame: boolean;
  showErr: boolean;
  autoRm: boolean;
  showClock: boolean;
  onHome: () => void;
  onSettings: () => void;
  onSolved: () => void;
};

export function GameScreen({
  Tdark,
  accent,
  game,
  solution,
  puzzle,
  given,
  hlSame,
  showErr,
  autoRm,
  showClock,
  onHome,
  onSettings,
  onSolved,
}: Props) {
  const T = makeTheme(Tdark, accent);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cellSize = Math.min(40, Math.floor((Math.min(width - 32, 420) - 8) / 9));

  const handleNumber = useCallback(
    (n: number) => {
      game.inputDigit(n, {
        puzzle,
        solution,
        given,
        autoRm,
        onSolved,
      });
    },
    [autoRm, game, given, onSolved, puzzle, solution],
  );

  const filledPct = Math.round((game.filledCount / 81) * 100);

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      {game.paused ? (
        <Pressable style={[styles.pauseOverlay, { backgroundColor: `${T.bg}EC` }]} onPress={() => game.setPaused(false)}>
          <Text style={{ fontSize: 56 }}>⏸</Text>
          <Text style={[styles.pauseH, { color: T.txt }]}>Paused</Text>
          <Pressable style={[styles.resume, { backgroundColor: T.acc }]} onPress={() => game.setPaused(false)}>
            <Text style={styles.resumeTxt}>Resume →</Text>
          </Pressable>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable onPress={onHome} hitSlop={12}>
            <Text style={{ color: T.txM, fontSize: 15, fontWeight: '600' }}>‹ Home</Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.time, { color: T.txt }]}>
              {showClock ? formatTime(game.timeSeconds) : '—:——'}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color: T.acc, letterSpacing: 1 }}>
              {DIFFICULTY_META[game.difficulty].label.toUpperCase()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {game.mistakes > 0 ? (
              <Text style={{ color: T.red, fontWeight: '800' }}>✕{game.mistakes}</Text>
            ) : null}
            <Pressable
              onPress={() => game.setPaused(true)}
              style={[styles.iconBtn, { backgroundColor: T.sur, borderColor: T.bor }]}
            >
              <Text style={{ color: T.txM, fontSize: 18 }}>⏸</Text>
            </Pressable>
            <Pressable
              onPress={onSettings}
              style={[styles.iconBtn, { backgroundColor: T.sur, borderColor: T.bor }]}
            >
              <Text style={{ color: T.txM, fontSize: 18 }}>⋯</Text>
            </Pressable>
          </View>
        </View>

        {game.board && game.notes ? (
          <SudokuGrid
            T={T}
            board={game.board}
            given={given}
            notes={game.notes}
            selection={game.selection}
            setSelection={game.setSelection}
            hlSame={hlSame}
            showErr={showErr}
            flashSet={game.flashSet}
            doneRows={game.doneRows}
            doneCols={game.doneCols}
            doneBoxes={game.doneBoxes}
            isConflict={game.isConflict}
            cellSize={cellSize}
          />
        ) : null}

        <View style={styles.progRow}>
          <View style={[styles.progBar, { backgroundColor: T.sur }]}>
            <View style={[styles.progFill, { width: `${filledPct}%`, backgroundColor: T.acc }]} />
          </View>
          <Text style={{ color: T.txM, fontWeight: '700', fontSize: 11, minWidth: 32 }}>{filledPct}%</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.chip, { backgroundColor: game.noteMode ? T.acc : T.sur, borderColor: T.bor }]}
            onPress={() => game.setNoteMode(!game.noteMode)}
          >
            <Text style={{ color: game.noteMode ? '#fff' : T.txt, fontWeight: '800' }}>Notes</Text>
          </Pressable>
          <Pressable style={[styles.chip, { backgroundColor: T.sur, borderColor: T.bor }]} onPress={() => game.undo({ puzzle, solution, given })}>
            <Text style={{ color: T.txt, fontWeight: '800' }}>Undo</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, { backgroundColor: T.sur, borderColor: T.bor, opacity: game.hintsUsed >= 3 ? 0.4 : 1 }]}
            disabled={game.hintsUsed >= 3}
            onPress={() => game.applyHint({ puzzle, solution, given, onSolved })}
          >
            <Text style={{ color: T.txt, fontWeight: '800' }}>Hint ({3 - game.hintsUsed})</Text>
          </Pressable>
        </View>

        <View style={styles.pad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Pressable
              key={n}
              onPress={() => handleNumber(n)}
              style={[styles.key, { backgroundColor: T.bgC, borderColor: T.bor }]}
            >
              <Text style={{ fontSize: 22, fontWeight: '800', color: T.txt }}>{n}</Text>
              <Text style={{ fontSize: 9, color: T.txM, fontWeight: '700' }}>
                {game.digitRemaining[n]} left
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => handleNumber(0)}
            style={[styles.keyWide, { backgroundColor: T.red }]}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Erase</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, maxWidth: 440, width: '100%', alignSelf: 'center' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  time: { fontSize: 28, fontWeight: '700' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  progBar: { flex: 1, height: 3, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  key: {
    width: '28%',
    minWidth: 96,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  keyWide: {
    width: '90%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  pauseH: { fontSize: 24, fontWeight: '800' },
  resume: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 16 },
  resumeTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
