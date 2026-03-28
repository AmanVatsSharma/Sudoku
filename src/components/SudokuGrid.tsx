import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <View style={[styles.gridOuter, { width: cellSize * 9 + 8 }]}>
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
            const thickR = c % 3 === 0 ? 2 : 1;
            const thickB = r % 3 === 0 ? 2 : 1;
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
                        : 'transparent';

            let digitColor = T.txt;
            if (val !== 0) {
              if (isGiven) digitColor = T.gClr;
              else if (showErr && err) digitColor = T.eClr;
              else if (val === solution[r]![c]) digitColor = T.pClr;
              else digitColor = T.eClr;
            }

            return (
              <Pressable
                key={c}
                onPress={() => setSelection([r, c])}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: bg,
                    borderLeftWidth: thickR,
                    borderTopWidth: thickB,
                    borderColor: T.borS,
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
                        fontSize: cellSize * 0.42,
                      },
                    ]}
                  >
                    {val}
                  </Text>
                ) : (
                  <NoteMarks mask={notes[r]![c]!} size={cellSize} color={T.acc} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  gridOuter: { alignSelf: 'center' },
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
