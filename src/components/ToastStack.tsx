import { StyleSheet, Text, View } from 'react-native';

import type { AchievementRarity } from '../game/achievements';
import { RARITY_COLORS } from '../game/achievements';
import type { ThemeTokens } from '../theme/tokens';

export type ToastItem = {
  tid: number;
  title: string;
  desc: string;
  xp: number;
  rarity: AchievementRarity;
  icon: string;
};

export function ToastStack({ toasts, T }: { toasts: ToastItem[]; T: ThemeTokens }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {toasts.slice(-2).map((t) => {
        const rc = RARITY_COLORS[t.rarity];
        return (
          <View
            key={t.tid}
            style={[
              styles.card,
              {
                backgroundColor: T.dark ? 'rgba(20,20,34,0.97)' : 'rgba(255,255,255,0.97)',
                borderColor: `${rc}55`,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: `${rc}22`, borderColor: `${rc}44` }]}>
              <Text style={{ fontSize: 20 }}>{t.icon}</Text>
            </View>
            <View style={styles.body}>
              <Text style={[styles.rarityLbl, { color: rc }]}>
                ACHIEVEMENT · {t.rarity.toUpperCase()}
              </Text>
              <Text style={[styles.title, { color: T.txt }]}>{t.title}</Text>
              <Text style={[styles.desc, { color: T.txM }]}>{t.desc}</Text>
            </View>
            <View style={[styles.xpBadge, { backgroundColor: `${rc}22` }]}>
              <Text style={[styles.xpTxt, { color: rc }]}>+{t.xp}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    zIndex: 50,
    gap: 8,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  rarityLbl: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  desc: { fontSize: 11, marginTop: 2 },
  xpBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  xpTxt: { fontSize: 12, fontWeight: '800' },
});
