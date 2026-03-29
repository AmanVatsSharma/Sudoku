import { memo, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type View as RNView } from 'react-native';

import { hasNote } from '../game/engine';
import type { Board, NotesGrid } from '../game/types';
import type { ThemeTokens } from '../theme/tokens';
import type { CellSelection } from '../hooks/useGameSession';

type Props = {
  T: ThemeTokens;
  board: Board;
  solution: Board;
  given: boolean[][];
  notes: NotesGrid;
  selection: CellSelection | null;
  setSelection: (s: CellSelection | null) => void;
  hlSame: boolean;
  showErr: boolean;
  flashSet: Set<string>;
  doneRows: Set<number>;
  doneCols: Set<number>;
  doneBoxes: Set<string>;
  isConflict: (r: number, c: number) => boolean;
  cellSize: number;
  registerCellRef?: (r: number, c: number, ref: RNView | null) => void;
};

function NoteMarks({ mask, size, color }: { mask: number; size: number; color: string }) {
  const digits: number[] = [];
  for (let d = 1; d <= 9; d++) if (hasNote(mask, d)) digits.push(d);
  const fs = Math.max(7, size * 0.22);
  return (
    <View style={styles.notesGrid}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <Text
          key={d}
          style={{
            width: size / 3.2,
            height: size / 3.2,
            fontSize: fs,
            color: digits.includes(d) ? color : 'transparent',
            textAlign: 'center',
            lineHeight: fs * 1.1,
          }}
        >
          {d}
        </Text>
      ))}
    </View>
  );
}

export const SudokuGrid = memo(function SudokuGrid({
  T,
  board,
  solution,
  given,
  notes,
  selection,
  setSelection,
  hlSame,
  showErr,
  flashSet,
  doneRows,
  doneCols,
  doneBoxes,
  isConflict,
  cellSize,
  registerCellRef,
}: Props) {
  const selVal = selection != null ? board[selection[0]]![selection[1]]! : null;

  const boxDone = useMemo(() => {
    const m = new Map<string, boolean>();
    for (let br = 0; br < 3; br++)
      for (let bc = 0; bc < 3; bc++) {
        m.set(`${br}${bc}`, doneBoxes.has(`${br}${bc}`));
      }
    return m;
  }, [doneBoxes]);

  const minorW = Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1;
  const majorW = 3;

  return (
    <View
      style={[
        styles.boardCard,
        {
          backgroundColor: T.bgC,
          borderColor: T.bor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: T.dark ? 10 : 6 },
          shadowOpacity: T.dark ? 0.55 : 0.08,
          shadowRadius: T.dark ? 28 : 18,
          elevation: T.dark ? 14 : 6,
        },
      ]}
    >
      <View style={[styles.gridOuter, { width: cellSize * 9 }]}>
        {board.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((val, c) => {
              const isGiven = given[r]![c];
              const selected = selection?.[0] === r && selection?.[1] === c;
              const same =
                hlSame &&
                selVal != null &&
                selVal !== 0 &&
                val === selVal &&
                !(selection?.[0] === r && selection?.[1] === c);
              const br = Math.floor(r / 3);
              const bc = Math.floor(c / 3);
              const boxKey = `${br}${bc}`;

              const leftW = c % 3 === 0 ? majorW : minorW;
              const topW = r % 3 === 0 ? majorW : minorW;
              const leftCol = c % 3 === 0 ? T.gridMajor : T.gridMinor;
              const topCol = r % 3 === 0 ? T.gridMajor : T.gridMinor;
              const rightW = c === 8 ? majorW : 0;
              const bottomW = r === 8 ? majorW : 0;

              const flash = flashSet.has(`${r}-${c}`);
              const err = showErr && val !== 0 && isConflict(r, c);
              const rowDone = doneRows.has(r);
              const colDone = doneCols.has(c);
              const bDone = boxDone.get(boxKey);

              let related = false;
              if (selection != null && !selected) {
                const [sr, sc] = selection;
                const sameBox =
                  Math.floor(r / 3) === Math.floor(sr / 3) &&
                  Math.floor(c / 3) === Math.floor(sc / 3);
                related = r === sr || c === sc || sameBox;
              }

              const bg = err
                ? T.cCon
                : selected
                  ? T.cSel
                  : same
                    ? T.cSam
                    : related
                      ? T.cRel
                      : rowDone || colDone || bDone
                        ? T.aD
                        : flash
                          ? T.aD
                          : T.gridBoard;

              let digitColor = T.txt;
              if (val !== 0) {
                if (isGiven) digitColor = T.gClr;
                else if (showErr && err) digitColor = T.eClr;
                else if (val === solution[r]![c]) digitColor = T.pClr;
                else digitColor = T.eClr;
              }

              return (
                <View
                  key={c}
                  ref={(el) => registerCellRef?.(r, c, el)}
                  collapsable={false}
                  style={{ width: cellSize, height: cellSize }}
                >
                  <Pressable
                    onPress={() => setSelection([r, c])}
                    android_ripple={{ color: `${T.acc}33` }}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: bg,
                        borderLeftWidth: leftW,
                        borderTopWidth: topW,
                        borderLeftColor: leftCol,
                        borderTopColor: topCol,
                        borderRightWidth: rightW,
                        borderBottomWidth: bottomW,
                        borderRightColor: T.gridMajor,
                        borderBottomColor: T.gridMajor,
                        ...(selected
                          ? Platform.select({
                              ios: {
                                shadowColor: T.acc,
                                shadowOpacity: 0.28,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 0 },
                              },
                              android: { elevation: 3 },
                              default: {},
                            })
                          : {}),
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Row ${r + 1}, column ${c + 1}${
                      val ? `, value ${val}` : ', empty'
                    }${isGiven ? ', given' : ''}`}
                  >
                    {val !== 0 ? (
                      <Text
                        style={[
                          styles.digit,
                          {
                            color: digitColor,
                            fontWeight: isGiven ? '800' : '600',
                            fontSize: cellSize * 0.44,
                            letterSpacing: -0.5,
                            ...(Platform.OS === 'ios'
                              ? { fontVariant: ['tabular-nums' as const] }
                              : {}),
                          },
                        ]}
                      >
                        {val}
                      </Text>
                    ) : (
                      <NoteMarks mask={notes[r]![c]!} size={cellSize} color={T.acc} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  boardCard: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    marginBottom: 4,
  },
  gridOuter: { alignSelf: 'center', overflow: 'visible' },
  row: { flexDirection: 'row' },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {},
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
