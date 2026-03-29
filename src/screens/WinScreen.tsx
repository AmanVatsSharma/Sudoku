import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RunGrade } from '../game/runScore';
import type { Difficulty } from '../game/types';
import { DIFFICULTY_META, makeTheme, type AccentId } from '../theme/tokens';

export type WinPayload = {
  timeLabel: string;
  rawSeconds: number;
  mistakes: number;
  hints: number;
  diff: Difficulty;
  xpEarned: number;
  runScore: number;
  grade: RunGrade;
};

type Props = {
  dark: boolean;
  accent: AccentId;
  win: WinPayload;
  level: number;
  xp: number;
  rank: string;
  onReplay: () => void;
  onHome: () => void;
  onNext: () => void;
};

const ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'ultimatum'];

function starCount(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 3) return 2;
  return 1;
}

export function WinScreen({ dark, accent, win, level, xp, rank, onReplay, onHome, onNext }: Props) {
  const T = makeTheme(dark, accent);
  const insets = useSafeAreaInsets();
  const idx = ORDER.indexOf(win.diff);
  const canNext = idx < ORDER.length - 1;
  const dc = dark ? DIFFICULTY_META[win.diff].dColor : DIFFICULTY_META[win.diff].color;
  const stars = starCount(win.mistakes);
  const starStr = '⭐'.repeat(stars);

  return (
    <View style={[styles.root, { backgroundColor: T.bg, paddingTop: insets.top + 28 }]}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 280,
          backgroundColor: 'transparent',
        }}
        pointerEvents="none"
      />
      <Text style={{ fontSize: 64, textAlign: 'center' }}>🎉</Text>
      <Text style={[styles.kicker, { color: dc }]}>
        {DIFFICULTY_META[win.diff].label.toUpperCase()} COMPLETE
      </Text>
      <Text style={[styles.h, { color: T.txt }]}>Solved!</Text>
      <Text style={[styles.stars, { color: T.yel }]}>{starStr}</Text>

      <View style={[styles.gradeRow, { borderColor: T.bor, backgroundColor: T.bgC }]}>
        <Text style={[styles.gradeLetter, { color: T.acc }]}>{win.grade}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: T.txt, fontWeight: '800', fontSize: 15 }}>Run score</Text>
          <Text style={{ color: T.txM, fontSize: 12, marginTop: 2 }}>
            {win.runScore.toLocaleString()} pts · grade from time, mistakes & hints
          </Text>
        </View>
      </View>

      <View style={[styles.xpBand, { backgroundColor: `${dc}22`, borderColor: `${dc}44` }]}>
        <Text style={{ color: dc, fontSize: 17, fontWeight: '800' }}>
          +{win.xpEarned} XP earned
        </Text>
        <Text style={{ color: T.txM, fontSize: 12, marginLeft: 8 }}>
          {rank} · Lv.{level}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <MiniStat icon="⏱" label="Time" value={win.timeLabel} T={T} />
        <MiniStat icon="✕" label="Mistakes" value={String(win.mistakes)} T={T} />
        <MiniStat icon="◈" label="Hints" value={String(win.hints)} T={T} />
      </View>

      <Text style={{ color: T.txM, textAlign: 'center', marginTop: 14, paddingHorizontal: 12 }}>
        Total XP: <Text style={{ color: T.acc, fontWeight: '800' }}>{xp.toLocaleString()}</Text>
      </Text>

      <View style={{ flex: 1 }} />

      {canNext ? (
        <Pressable style={[styles.btnPrimary, { backgroundColor: T.acc }]} onPress={onNext}>
          <Text style={styles.btnTxt}>Next difficulty →</Text>
        </Pressable>
      ) : null}
      <Pressable
        style={[
          styles.btnSecondary,
          { backgroundColor: T.sur, borderColor: T.bor, marginTop: canNext ? 10 : 0 },
        ]}
        onPress={onReplay}
      >
        <Text style={[styles.btnTxt, { color: T.txt }]}>Play again</Text>
      </Pressable>
      <Pressable onPress={onHome} style={{ padding: 16 }}>
        <Text style={{ color: T.txM, textAlign: 'center', fontWeight: '700' }}>Home</Text>
      </Pressable>
      <View style={{ height: insets.bottom + 12 }} />
    </View>
  );
}

function MiniStat({
  icon,
  label,
  value,
  T,
}: {
  icon: string;
  label: string;
  value: string;
  T: ReturnType<typeof makeTheme>;
}) {
  return (
    <View style={[styles.mini, { backgroundColor: T.bgC, borderColor: T.bor }]}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text style={{ color: T.txt, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text
        style={{
          color: T.txM,
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  kicker: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  h: { fontSize: 36, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  stars: { fontSize: 28, textAlign: 'center', letterSpacing: 4, marginBottom: 14 },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  gradeLetter: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
  xpBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 22,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  mini: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  btnPrimary: { paddingVertical: 17, borderRadius: 16, alignItems: 'center' },
  btnSecondary: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
