import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemeTokens } from '../theme/tokens';

const PAD_W = 132;
const PAD_H = 168;

type Props = {
  visible: boolean;
  T: ThemeTokens;
  noteMode: boolean;
  onToggleNoteMode: () => void;
  selection: readonly [number, number] | null;
  given: boolean;
  cellRef: RNView | null;
  /** Digit keys 1-9: candidate highlighting via `isCandidate` */
  isCandidate: (digit: number) => boolean;
  digitRemaining: number[];
  onDigit: (n: number) => void;
  onErase: () => void;
  onRequestClose: () => void;
};

export function FloatingNumberPad({
  visible,
  T,
  noteMode,
  onToggleNoteMode,
  selection,
  given,
  cellRef,
  isCandidate,
  digitRemaining,
  onDigit,
  onErase,
  onRequestClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: sw, height: sh } = useWindowDimensions();
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const measure = useCallback(() => {
    if (!visible || !cellRef || !selection) {
      setPos(null);
      return;
    }
    cellRef.measureInWindow((x, y, cw, ch) => {
      const relY = Math.max(
        insets.top + 8,
        Math.min(y + ch / 2 - PAD_H / 2, sh - PAD_H - insets.bottom - 24),
      );
      const placeRight = x + cw + PAD_W + 16 < sw - 8;
      let left: number;
      if (placeRight) left = Math.min(x + cw + 6, sw - PAD_W - 8);
      else left = Math.max(8, x - PAD_W - 6);
      left = Math.max(8, Math.min(left, sw - PAD_W - 8));
      setPos({ left, top: relY });
    });
  }, [cellRef, selection, visible, sh, sw, insets.top, insets.bottom]);

  useEffect(() => {
    measure();
  }, [measure, noteMode, selection, visible]);

  if (!visible || !selection || given || !pos) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.backdrop} onPress={onRequestClose}>
        <Pressable
          style={[
            styles.pad,
            {
              left: pos.left,
              top: pos.top,
              backgroundColor: T.dark ? 'rgba(22,22,34,0.98)' : 'rgba(252,252,248,0.98)',
              borderColor: T.borS,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grid3}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              const done = digitRemaining[n]! <= 0 && !noteMode;
              const cand = isCandidate(n);
              return (
                <Pressable
                  key={n}
                  disabled={done}
                  onPress={() => onDigit(n)}
                  style={[
                    styles.key,
                    {
                      backgroundColor: noteMode ? T.aD : cand ? `${T.acc}33` : T.sur,
                      borderColor: noteMode ? T.aM : cand ? T.acc : T.bor,
                      opacity: done ? 0.2 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 17, fontWeight: '800', color: T.txt }}>{n}</Text>
                  {cand && !noteMode ? (
                    <View
                      style={[styles.dot, { backgroundColor: T.acc }]}
                      pointerEvents="none"
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.barRow}>
            <Pressable
              onPress={onToggleNoteMode}
              style={[
                styles.tog,
                {
                  backgroundColor: noteMode ? T.aD : T.sur,
                  borderColor: noteMode ? T.aM : T.bor,
                },
              ]}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: noteMode ? T.acc : T.txM }}>
                {noteMode ? 'DIGIT' : 'NOTES'}
              </Text>
            </Pressable>
            <Pressable
              onPress={onErase}
              style={[styles.eraser, { backgroundColor: T.sur, borderColor: T.bor }]}
            >
              <Text style={{ fontSize: 14, color: T.txM, fontWeight: '800' }}>⌫</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  pad: {
    position: 'absolute',
    width: PAD_W,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    width: PAD_W - 16,
    marginBottom: 6,
  },
  key: {
    width: (PAD_W - 16 - 10) / 3,
    aspectRatio: 1,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  barRow: { flexDirection: 'row', gap: 5 },
  tog: { flex: 1, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eraser: { width: 36, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
