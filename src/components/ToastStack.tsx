import { StyleSheet, Text, View } from 'react-native';

import type { ThemeTokens } from '../theme/tokens';

export type ToastItem = {
  tid: number;
  title: string;
  desc: string;
  xp: number;
};

export function ToastStack({ toasts, T }: { toasts: ToastItem[]; T: ThemeTokens }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {toasts.slice(-2).map((t) => (
        <View key={t.tid} style={[styles.card, { backgroundColor: T.bgC, borderColor: T.bor }]}>
          <Text style={[styles.title, { color: T.txt }]}>{t.title}</Text>
          <Text style={[styles.desc, { color: T.txM }]}>{t.desc}</Text>
          <Text style={[styles.xp, { color: T.acc }]}>+{t.xp} XP</Text>
        </View>
      ))}
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
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  title: { fontSize: 15, fontWeight: '800' },
  desc: { fontSize: 12, marginTop: 2 },
  xp: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});
