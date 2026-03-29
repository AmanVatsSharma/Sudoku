import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Difficulty } from '../game/types';
import { ACCENTS, DIFFICULTY_META, formatTime, makeTheme, type AccentId } from '../theme/tokens';

type Props = {
  dark: boolean;
  onToggleDark: () => void;
  accent: AccentId;
  onAccent: (a: AccentId) => void;
  selectedDiff: Difficulty;
  onSelectDiff: (d: Difficulty) => void;
  onPlay: () => void;
  onContinue: (() => void) | null;
  onStats: () => void;
  level: number;
  xp: number;
  rank: string;
  streak: number;
  solves: number;
  gamesStarted: number;
  bests: Partial<Record<Difficulty, number>>;
  unlockedCount: number;
};

export function HomeScreen({
  dark,
  onToggleDark,
  accent,
  onAccent,
  selectedDiff,
  onSelectDiff,
  onPlay,
  onContinue,
  onStats,
  level,
  xp,
  rank,
  streak,
  solves,
  gamesStarted,
  bests,
  unlockedCount,
}: Props) {
  const T = makeTheme(dark, accent);
  const insets = useSafeAreaInsets();
  const lvXP = xp % 500;
  const lvPct = (lvXP / 500) * 100;
  const dc = dark ? DIFFICULTY_META[selectedDiff].dColor : DIFFICULTY_META[selectedDiff].color;
  const winRatePct =
    gamesStarted > 0 ? Math.round((solves / gamesStarted) * 100) : null;

  return (
    <View style={[styles.root, { backgroundColor: T.bg, paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={onStats}
            style={[styles.hdrBtn, { backgroundColor: T.sur, borderColor: T.bor }]}
          >
            <Text style={{ color: T.txM, fontWeight: '700' }}>◉ Stats</Text>
          </Pressable>
          <Pressable
            onPress={onToggleDark}
            style={[styles.hdrBtn, { backgroundColor: T.sur, borderColor: T.bor }]}
          >
            <Text style={{ color: T.txM, fontWeight: '700' }}>{dark ? 'Light' : 'Dark'}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={[styles.logo, { borderColor: `${T.acc}55`, backgroundColor: `${T.acc}18` }]}>
            <Text style={{ fontSize: 44 }}>⬡</Text>
          </View>
          <Text style={[styles.title, { color: T.txt }]}>Ultimatum</Text>
          <Text style={[styles.sub, { color: T.txM }]}>SUDOKU</Text>

          <View style={[styles.player, { backgroundColor: T.bgC, borderColor: T.bor }]}>
            <View style={[styles.avatar, { borderColor: T.aB, backgroundColor: T.aD }]}>
              <Text style={{ fontSize: 22 }}>⬡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.playerTop}>
                <Text style={{ color: T.txt, fontWeight: '800' }}>{rank}</Text>
                <Text style={{ color: T.txM, fontSize: 11, fontWeight: '600' }}>
                  Lv.{level} · {xp.toLocaleString()} XP
                </Text>
              </View>
              <View style={[styles.bar, { backgroundColor: T.sur }]}>
                <View style={[styles.barFill, { width: `${lvPct}%`, backgroundColor: T.acc }]} />
              </View>
              <Text style={{ color: T.txM, fontSize: 10, marginTop: 4 }}>
                {500 - lvXP} XP to next level
              </Text>
            </View>
          </View>
        </View>

        <Text style={{ color: T.txM, fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 10 }}>
          {winRatePct !== null
            ? `Win rate ${winRatePct}% · ${solves}/${gamesStarted} finished`
            : 'Win rate appears after you start a new game'}
        </Text>

        <View style={styles.row3}>
          <Mini icon="🔥" value={streak} label="Streak" T={T} />
          <Mini icon="✓" value={solves} label="Solved" T={T} />
          <Mini icon="◈" value={unlockedCount} label="Badges" T={T} />
        </View>

        <Text style={[styles.sec, { color: T.txM }]}>Difficulty</Text>
        {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((key) => {
          const meta = DIFFICULTY_META[key];
          const active = selectedDiff === key;
          const col = dark ? meta.dColor : meta.color;
          return (
            <Pressable
              key={key}
              onPress={() => onSelectDiff(key)}
              style={[
                styles.diffBtn,
                {
                  backgroundColor: active ? `${col}16` : T.sur,
                  borderColor: active ? `${col}55` : T.bor,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.dot, { backgroundColor: col }]} />
                <Text style={{ fontWeight: '700', fontSize: 15, color: active ? col : T.txt }}>
                  {meta.label}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: T.txM }}>{meta.desc}</Text>
                {bests[key] !== undefined ? (
                  <Text style={{ fontSize: 10, color: col, fontWeight: '700', marginTop: 2 }}>
                    Best {formatTime(bests[key]!)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        <Text style={[styles.sec, { color: T.txM }]}>Theme color</Text>
        <View style={styles.accentRow}>
          {ACCENTS.map((ac) => {
            const active = accent === ac.id;
            const col = dark ? ac.d : ac.l;
            return (
              <Pressable
                key={ac.id}
                onPress={() => onAccent(ac.id)}
                style={[
                  styles.accentBtn,
                  {
                    borderColor: active ? col : T.bor,
                    backgroundColor: active ? `${col}22` : T.sur,
                  },
                ]}
              >
                <View style={[styles.aDot, { backgroundColor: col }]} />
                <Text style={{ fontSize: 8, fontWeight: '700', color: active ? col : T.txM }}>
                  {ac.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {onContinue ? (
          <Pressable
            onPress={onContinue}
            style={[styles.play, { backgroundColor: T.bgS, borderColor: T.acc, borderWidth: 2 }]}
          >
            <Text style={[styles.playTxt, { color: T.acc }]}>Continue →</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onPlay}
          style={[styles.play, { backgroundColor: dc, marginTop: onContinue ? 10 : 0 }]}
        >
          <Text style={styles.playTxt}>Play {DIFFICULTY_META[selectedDiff].label} →</Text>
        </Pressable>

        <View style={styles.tags}>
          {['Unlimited Undo', 'Pencil Notes', '3 Hints', 'Conflict Check', '5 Difficulties'].map(
            (f) => (
              <View key={f} style={[styles.tag, { backgroundColor: T.sur, borderColor: T.bor }]}>
                <Text style={{ fontSize: 11, color: T.txM, fontWeight: '600' }}>{f}</Text>
              </View>
            ),
          )}
        </View>
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function Mini({
  icon,
  value,
  label,
  T,
}: {
  icon: string;
  value: number;
  label: string;
  T: ReturnType<typeof makeTheme>;
}) {
  return (
    <View style={[styles.mini, { backgroundColor: T.bgC, borderColor: T.bor }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: T.txt }}>{value}</Text>
      <Text style={{ fontSize: 10, color: T.txM, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  hdrBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  hero: { alignItems: 'center', marginTop: 12 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  title: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  sub: { fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 20 },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  playerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  row3: { flexDirection: 'row', gap: 10, marginVertical: 20 },
  mini: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sec: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  diffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 7,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  accentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  accentBtn: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
  },
  aDot: { width: 18, height: 18, borderRadius: 9, marginBottom: 2 },
  play: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  playTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
  },
});
