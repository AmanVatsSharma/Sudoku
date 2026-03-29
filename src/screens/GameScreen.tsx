import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingNumberPad } from '../components/FloatingNumberPad';
import { SudokuGrid } from '../components/SudokuGrid';
import type { Board } from '../game/types';
import type { NumberPadMode } from '../persistence/schema';
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
  blockBad: boolean;
  numberPadMode: NumberPadMode;
  showClock: boolean;
  onHome: () => void;
  onSettings: () => void;
  onSolved: (meta?: { mistakes?: number; hintsUsed?: number; flowBonus?: boolean }) => void;
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
  blockBad,
  numberPadMode,
  showClock,
  onHome,
  onSettings,
  onSolved,
}: Props) {
  const T = makeTheme(Tdark, accent);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cellSize = Math.min(40, Math.floor((Math.min(width - 32, 420) - 8) / 9));

  const [noteWarn, setNoteWarn] = useState<string | null>(null);
  const cellRefs = useRef<Map<string, RNView | null>>(new Map());

  const registerCellRef = useCallback((r: number, c: number, ref: RNView | null) => {
    const k = `${r}-${c}`;
    if (ref) cellRefs.current.set(k, ref);
    else cellRefs.current.delete(k);
  }, []);

  useEffect(() => {
    if (!noteWarn) return;
    const t = setTimeout(() => setNoteWarn(null), 2000);
    return () => clearTimeout(t);
  }, [noteWarn]);

  const sel = game.selection;
  const selRef =
    sel && !given[sel[0]]![sel[1]]
      ? (cellRefs.current.get(`${sel[0]}-${sel[1]}`) ?? null)
      : null;
  const selGiven: boolean = sel != null ? given[sel[0]]![sel[1]]! : true;

  const showFloatingPad = Boolean(
    numberPadMode === 'floating' && game.running && !game.paused && sel != null && !selGiven,
  );

  const isCandidate = useCallback(
    (digit: number) => {
      if (!sel || !game.board) return false;
      return game.getCandidatesForCell(sel[0], sel[1]).includes(digit);
    },
    [game, sel],
  );

  const handleNumber = useCallback(
    (n: number) => {
      game.inputDigit(n, {
        puzzle,
        solution,
        given,
        autoRm,
        blockBad,
        onSolved,
        onNoteWarn: (msg) => setNoteWarn(msg),
      });
    },
    [autoRm, blockBad, game, given, onSolved, puzzle, solution],
  );

  const filledPct = Math.round((game.filledCount / 81) * 100);

  const contraText = game.contradiction
    ? `No valid candidates at cell (${game.contradiction[0] + 1}, ${game.contradiction[1] + 1})`
    : null;

  const branchTitle = game.branches?.[game.activeBranchIdx]?.name ?? 'Main';

  const ctrlBtn = useMemo(
    () => ({
      pad: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 11, borderWidth: 1, minWidth: 56, alignItems: 'center' as const },
    }),
    [],
  );

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      {game.flowState ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderWidth: 3, borderColor: T.yel, opacity: 0.35, zIndex: 4 },
          ]}
        />
      ) : null}

      {game.paused ? (
        <Pressable
          style={[styles.pauseOverlay, { backgroundColor: `${T.bg}EC` }]}
          onPress={() => game.setPaused(false)}
        >
          <Text style={{ fontSize: 56 }}>⏸</Text>
          <Text style={[styles.pauseH, { color: T.txt }]}>Paused</Text>
          <Pressable
            style={[styles.resume, { backgroundColor: T.acc }]}
            onPress={() => game.setPaused(false)}
          >
            <Text style={styles.resumeTxt}>Resume →</Text>
          </Pressable>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable onPress={onHome} hitSlop={12}>
            <Text style={{ color: T.txM, fontSize: 15, fontWeight: '600' }}>‹ Home</Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            {game.flowState ? (
              <Text style={{ fontSize: 9, fontWeight: '800', color: T.yel, letterSpacing: 1 }}>
                FLOW {game.flowSecondsLeft}s
              </Text>
            ) : null}
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

        {game.isOnHypothesisBranch ? (
          <View
            style={[
              styles.branchBar,
              { backgroundColor: `${T.acc}18`, borderColor: `${T.acc}44` },
            ]}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: T.pClr }}>⑂ {branchTitle}</Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {game.contradiction ? (
                <Text style={{ fontSize: 10, fontWeight: '800', color: T.red }}>Contradiction</Text>
              ) : null}
              <Pressable onPress={() => game.mergeToMain()}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: T.acc }}>Merge →</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {contraText ? (
          <View style={[styles.warnBanner, { backgroundColor: T.rD, borderColor: `${T.red}55` }]}>
            <Text style={{ color: T.red, fontWeight: '800', fontSize: 12 }}>✕ {contraText}</Text>
          </View>
        ) : null}

        {game.board && game.notes ? (
          <SudokuGrid
            T={T}
            board={game.board}
            solution={solution}
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
            registerCellRef={registerCellRef}
          />
        ) : null}

        {noteWarn ? (
          <View style={[styles.warnBanner, { backgroundColor: T.rD, borderColor: `${T.red}44` }]}>
            <Text style={{ color: T.red, fontWeight: '700', fontSize: 12 }}>{noteWarn}</Text>
          </View>
        ) : null}

        <View style={styles.progRow}>
          <View style={[styles.progBar, { backgroundColor: T.sur }]}>
            <View style={[styles.progFill, { width: `${filledPct}%`, backgroundColor: T.acc }]} />
          </View>
          <Text style={{ color: T.txM, fontWeight: '700', fontSize: 11, minWidth: 32 }}>
            {filledPct}%
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ctrlScroll}>
          <View style={styles.ctrlRow}>
            <Pressable
              style={[ctrlBtn.pad, { backgroundColor: T.sur, borderColor: T.bor, opacity: game.canUndo ? 1 : 0.35 }]}
              disabled={!game.canUndo}
              onPress={() => game.undo({ puzzle, solution, given })}
            >
              <Text style={{ fontSize: 16 }}>↩</Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: T.txM }}>Undo</Text>
            </Pressable>
            <Pressable
              style={[ctrlBtn.pad, { backgroundColor: T.sur, borderColor: T.bor, opacity: sel && !selGiven ? 1 : 0.35 }]}
              disabled={!sel || selGiven}
              onPress={() => handleNumber(0)}
            >
              <Text style={{ fontSize: 16 }}>⌫</Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: T.txM }}>Erase</Text>
            </Pressable>
            <Pressable
              style={[
                ctrlBtn.pad,
                {
                  backgroundColor: game.noteMode ? T.acc : T.sur,
                  borderColor: T.bor,
                },
              ]}
              onPress={() => game.setNoteMode(!game.noteMode)}
            >
              <Text style={{ fontSize: 16 }}>✎</Text>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '800',
                  color: game.noteMode ? '#fff' : T.txM,
                }}
              >
                Notes
              </Text>
            </Pressable>
            <Pressable
              style={[
                ctrlBtn.pad,
                {
                  backgroundColor: `${T.acc}14`,
                  borderColor: `${T.acc}40`,
                  opacity: game.hintsUsed >= 3 ? 0.35 : 1,
                },
              ]}
              disabled={game.hintsUsed >= 3}
              onPress={() => game.applyHint({ puzzle, solution, given, onSolved })}
            >
              <Text style={{ fontSize: 16 }}>◈</Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: T.acc }}>
                {3 - game.hintsUsed} Hint
              </Text>
            </Pressable>
            <Pressable
              style={[
                ctrlBtn.pad,
                {
                  backgroundColor: game.showBranchesDrawer ? `${T.acc}22` : T.sur,
                  borderColor: game.showBranchesDrawer ? T.acc : T.bor,
                },
              ]}
              onPress={() => game.setShowBranchesDrawer(!game.showBranchesDrawer)}
            >
              <Text style={{ fontSize: 16 }}>⑂</Text>
              <Text style={{ fontSize: 9, fontWeight: '800', color: T.txM }}>
                Branch{game.branches && game.branches.length > 1 ? ` ${game.branches.length}` : ''}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {game.showBranchesDrawer && game.branches ? (
          <View style={[styles.branchDrawer, { backgroundColor: T.bgC, borderColor: T.bor }]}>
            <View style={styles.branchDrawerTop}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: T.pClr }}>Branches</Text>
              <Pressable
                onPress={() => game.createBranch()}
                style={[styles.newBranchBtn, { backgroundColor: `${T.acc}22`, borderColor: `${T.acc}44` }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: T.acc }}>+ New</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 6 }}>
                {game.branches.map((b, i) => {
                  const active = i === game.activeBranchIdx;
                  const filled = b.branchBoard.flat().filter((v) => v !== 0).length;
                  return (
                    <Pressable
                      key={`${b.name}-${i}`}
                      onPress={() => game.switchBranch(i)}
                      style={[
                        styles.branchPill,
                        {
                          borderColor: active ? T.acc : T.bor,
                          backgroundColor: active ? `${T.acc}18` : T.sur,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: active ? T.acc : T.txt }}>
                        {b.name}
                      </Text>
                      <Text style={{ fontSize: 9, color: T.txM }}>{filled}/81</Text>
                      {!b.isMain ? (
                        <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                          <Pressable onPress={() => game.mergeFromBranchIndex(i)}>
                            <Text style={{ fontSize: 9, color: T.acc, fontWeight: '700' }}>→Main</Text>
                          </Pressable>
                          <Pressable onPress={() => game.deleteBranch(i)}>
                            <Text style={{ fontSize: 9, color: T.red, fontWeight: '700' }}>✕</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Text style={{ fontSize: 10, color: T.txM, marginTop: 4 }}>
              Try hypotheses without changing Main. Merge when verified.
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => game.fillAllCandidates()}
          style={[styles.fillBtn, { backgroundColor: T.sur, borderColor: T.bor }]}
        >
          <Text style={{ fontSize: 12, fontWeight: '800', color: T.txM }}>✎ Fill all candidates</Text>
        </Pressable>

        {numberPadMode === 'bottom' ? (
          <View style={styles.pad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              const done = game.digitRemaining[n]! <= 0 && !game.noteMode;
              const cand = sel && !selGiven ? isCandidate(n) : true;
              return (
                <Pressable
                  key={n}
                  disabled={done}
                  onPress={() => handleNumber(n)}
                  style={[
                    styles.key,
                    {
                      backgroundColor: game.noteMode ? T.aD : cand ? `${T.acc}22` : T.bgC,
                      borderColor: game.noteMode ? T.aM : cand ? T.aM : T.bor,
                      opacity: done ? 0.22 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 22, fontWeight: '800', color: T.txt }}>{n}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, color: T.txM, fontWeight: '800' }}>
                      {done ? '✓' : `${game.digitRemaining[n]} left`}
                    </Text>
                    {cand && !game.noteMode && !done ? (
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.acc }} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => handleNumber(0)}
              style={[styles.keyWide, { backgroundColor: T.red }]}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Erase</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ color: T.txM, textAlign: 'center', marginTop: 10, fontSize: 12 }}>
            Tap a cell to open the floating number pad.
          </Text>
        )}
      </ScrollView>

      <FloatingNumberPad
        visible={showFloatingPad}
        T={T}
        noteMode={game.noteMode}
        onToggleNoteMode={() => game.setNoteMode(!game.noteMode)}
        selection={sel}
        given={Boolean(sel && given[sel[0]]![sel[1]])}
        cellRef={selRef}
        isCandidate={isCandidate}
        digitRemaining={game.digitRemaining}
        onDigit={handleNumber}
        onErase={() => handleNumber(0)}
        onRequestClose={() => game.setSelection(null)}
      />
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
  branchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  warnBanner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  progBar: { flex: 1, height: 3, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  ctrlScroll: { marginTop: 10, maxHeight: 56 },
  ctrlRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  branchDrawer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  branchDrawerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  newBranchBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
  },
  branchPill: {
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  fillBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
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
