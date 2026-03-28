import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Difficulty } from '../game/types';
import { DIFFICULTY_META, makeTheme, type AccentId } from '../theme/tokens';

export type WinPayload = {
  timeLabel: string;
  rawSeconds: number;
  mistakes: number;
  hints: number;
  diff: Difficulty;
  xpEarned: number;
};

type Props = {
  dark: boolean;
  accent: AccentId;
  win: WinPayload;
  level: number;
  xp: number;
  onReplay: () => void;
  onHome: () => void;
  onNext: () => void;
};

const ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'ultimatum'];

export function WinScreen({ dark, accent, win, level, xp, onReplay, onHome, onNext }: Props) {
  const T = makeTheme(dark, accent);
  const insets = useSafeAreaInsets();
  const idx = ORDER.indexOf(win.diff);
  const canNext = idx < ORDER.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: T.bg, paddingTop: insets.top + 40 }]}>
      <Text style={{ fontSize: 64, textAlign: 'center' }}>🎉</Text>
      <Text style={[styles.h, { color: T.txt }]}>Solved!</Text>
      <Text style={[styles.sub, { color: T.acc }]}>{DIFFICULTY_META[win.diff].label}</Text>

      <View style={[styles.card, { backgroundColor: T.bgC, borderColor: T.bor }]}>
        <Row label="Time" value={win.timeLabel} T={T} />
        <Row label="Mistakes" value={String(win.mistakes)} T={T} />
        <Row label="Hints used" value={String(win.hints)} T={T} />
        <Row label="XP earned" value={`+${win.xpEarned}`} T={T} highlight />
      </View>

      <Text style={{ color: T.txM, textAlign: 'center', marginTop: 16 }}>
        You are now <Text style={{ color: T.txt, fontWeight: '800' }}>Lv.{level}</Text> with{' '}
        <Text style={{ color: T.acc, fontWeight: '800' }}>{xp.toLocaleString()} XP</Text>
      </Text>

      <View style={{ flex: 1 }} />

      <Pressable style={[styles.btn, { backgroundColor: T.acc }]} onPress={onReplay}>
        <Text style={styles.btnTxt}>Play again</Text>
      </Pressable>
      {canNext ? (
        <Pressable
          style={[styles.btn, { backgroundColor: T.sur, borderWidth: 1, borderColor: T.bor }]}
          onPress={onNext}
        >
          <Text style={[styles.btnTxt, { color: T.txt }]}>Next difficulty →</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onHome} style={{ padding: 16 }}>
        <Text style={{ color: T.txM, textAlign: 'center', fontWeight: '700' }}>Home</Text>
      </Pressable>
      <View style={{ height: insets.bottom + 12 }} />
    </View>
  );
}

function Row({
  label,
  value,
  T,
  highlight,
}: {
  label: string;
  value: string;
  T: ReturnType<typeof makeTheme>;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={{ color: T.txM, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: highlight ? T.acc : T.txt, fontWeight: '800', fontSize: 16 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  h: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 14, fontWeight: '700', textAlign: 'center', letterSpacing: 1, marginBottom: 24 },
  card: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
