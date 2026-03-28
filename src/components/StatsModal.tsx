import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ACHIEVEMENTS, RARITY_COLORS } from '../game/achievements';
import { XP_PER_LEVEL } from '../game/constants';
import type { Difficulty } from '../game/types';
import type { SolveHistoryEntry } from '../persistence/schema';
import { DIFFICULTY_META, formatTime, makeTheme, type AccentId } from '../theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  dark: boolean;
  accent: AccentId;
  level: number;
  xp: number;
  rank: string;
  streak: number;
  solves: number;
  bests: Partial<Record<Difficulty, number>>;
  solvHist: SolveHistoryEntry[];
  unlockedIds: string[];
};

export function StatsModal({
  visible,
  onClose,
  dark,
  accent,
  level,
  xp,
  rank,
  streak,
  solves,
  bests,
  solvHist,
  unlockedIds,
}: Props) {
  const T = makeTheme(dark, accent);
  const lvXP = xp % XP_PER_LEVEL;
  const lvPct = (lvXP / XP_PER_LEVEL) * 100;
  const unlocked = new Set(unlockedIds);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: T.bgC, borderColor: T.bor }]}
          onPress={() => {}}
        >
          <Text style={[styles.h, { color: T.txt }]}>Stats</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { borderColor: T.bor, backgroundColor: T.sur }]}>
              <Text style={{ color: T.txM, fontSize: 12, fontWeight: '700' }}>{rank}</Text>
              <Text style={{ color: T.txt, fontSize: 18, fontWeight: '800' }}>
                Lv.{level} · {xp.toLocaleString()} XP
              </Text>
              <View style={[styles.bar, { backgroundColor: T.bgS }]}>
                <View style={[styles.barFill, { width: `${lvPct}%`, backgroundColor: T.acc }]} />
              </View>
              <Text style={{ color: T.txM, fontSize: 11, marginTop: 6 }}>
                {XP_PER_LEVEL - lvXP} XP to next level
              </Text>
            </View>

            <View style={styles.row3}>
              <MiniStat label="Streak" value={String(streak)} T={T} />
              <MiniStat label="Solved" value={String(solves)} T={T} />
              <MiniStat label="Badges" value={String(unlocked.size)} T={T} />
            </View>

            <Text style={[styles.sec, { color: T.txM }]}>Best times</Text>
            {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((d) => {
              const best = bests[d];
              return (
                <View key={d} style={styles.bestRow}>
                  <Text style={{ color: T.txt, fontWeight: '700' }}>{DIFFICULTY_META[d].label}</Text>
                  <Text style={{ color: T.acc, fontWeight: '700' }}>
                    {best !== undefined ? formatTime(best) : '—'}
                  </Text>
                </View>
              );
            })}

            <Text style={[styles.sec, { color: T.txM }]}>Recent games</Text>
            {solvHist.length === 0 ? (
              <Text style={{ color: T.txM, marginBottom: 12 }}>No games yet.</Text>
            ) : (
              solvHist.map((h, i) => (
                <View key={i} style={styles.histRow}>
                  <Text style={{ color: T.txt, fontWeight: '600' }}>{DIFFICULTY_META[h.diff].label}</Text>
                  <Text style={{ color: T.txM }}>
                    {h.time} · ✕{h.mistakes} · +{h.xp} XP
                  </Text>
                </View>
              ))
            )}

            <Text style={[styles.sec, { color: T.txM }]}>Achievements</Text>
            {ACHIEVEMENTS.map((a) => {
              const on = unlocked.has(a.id);
              const col = RARITY_COLORS[a.rarity];
              return (
                <View
                  key={a.id}
                  style={[styles.ach, { opacity: on ? 1 : 0.4, borderColor: T.bor }]}
                >
                  <Text style={{ fontSize: 18 }}>{a.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: T.txt, fontWeight: '700' }}>{a.title}</Text>
                    <Text style={{ color: T.txM, fontSize: 12 }}>{a.desc}</Text>
                  </View>
                  <Text style={{ color: col, fontWeight: '800', fontSize: 12 }}>{a.rarity}</Text>
                </View>
              );
            })}
          </ScrollView>
          <Pressable style={[styles.close, { backgroundColor: T.acc }]} onPress={onClose}>
            <Text style={styles.closeTxt}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MiniStat({
  label,
  value,
  T,
}: {
  label: string;
  value: string;
  T: ReturnType<typeof makeTheme>;
}) {
  return (
    <View style={[styles.mini, { borderColor: T.bor, backgroundColor: T.sur }]}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: T.txt }}>{value}</Text>
      <Text
        style={{
          fontSize: 10,
          color: T.txM,
          fontWeight: '700',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  h: { fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 12 },
  scroll: { maxHeight: 520 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  bar: { height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  row3: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  mini: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sec: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  histRow: { marginBottom: 6 },
  ach: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: { marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  closeTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
