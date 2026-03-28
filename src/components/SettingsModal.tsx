import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import type { AccentId } from '../theme/tokens';
import { ACCENTS, makeTheme } from '../theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  accent: AccentId;
  setAccent: (a: AccentId) => void;
  hlSame: boolean;
  setHlSame: (v: boolean) => void;
  showErr: boolean;
  setShowErr: (v: boolean) => void;
  autoRm: boolean;
  setAutoRm: (v: boolean) => void;
  showClock: boolean;
  setShowClock: (v: boolean) => void;
  paused: boolean;
  onTogglePause: () => void;
  onNewGame: () => void;
};

export function SettingsModal({
  visible,
  onClose,
  dark,
  setDark,
  accent,
  setAccent,
  hlSame,
  setHlSame,
  showErr,
  setShowErr,
  autoRm,
  setAutoRm,
  showClock,
  setShowClock,
  paused,
  onTogglePause,
  onNewGame,
}: Props) {
  const T = makeTheme(dark, accent);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: T.bgC, borderColor: T.bor }]}
          onPress={() => {}}
        >
          <Text style={[styles.h, { color: T.txt }]}>Settings</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Row label="Dark mode" T={T}>
              <Switch value={dark} onValueChange={setDark} />
            </Row>
            <Text style={[styles.sec, { color: T.txM }]}>Gameplay</Text>
            <Row label="Highlight same numbers" T={T}>
              <Switch value={hlSame} onValueChange={setHlSame} />
            </Row>
            <Row label="Show conflicts" T={T}>
              <Switch value={showErr} onValueChange={setShowErr} />
            </Row>
            <Row label="Auto-remove notes" T={T}>
              <Switch value={autoRm} onValueChange={setAutoRm} />
            </Row>
            <Row label="Show timer" T={T}>
              <Switch value={showClock} onValueChange={setShowClock} />
            </Row>
            <Text style={[styles.sec, { color: T.txM }]}>Theme color</Text>
            <View style={styles.accentRow}>
              {ACCENTS.map((ac) => {
                const active = accent === ac.id;
                const col = dark ? ac.d : ac.l;
                return (
                  <Pressable
                    key={ac.id}
                    onPress={() => setAccent(ac.id)}
                    style={[
                      styles.accentBtn,
                      {
                        borderColor: active ? col : T.bor,
                        backgroundColor: active ? `${col}22` : T.sur,
                      },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: col }]} />
                    <Text style={{ fontSize: 8, color: active ? col : T.txM, fontWeight: '700' }}>
                      {ac.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={[styles.btn, { backgroundColor: T.sur, borderColor: T.bor }]}
              onPress={onTogglePause}
            >
              <Text style={{ color: T.txt, fontWeight: '700' }}>{paused ? 'Resume' : 'Pause'}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: T.red }]}
              onPress={() => {
                onNewGame();
                onClose();
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>End & go home</Text>
            </Pressable>
          </ScrollView>
          <Pressable style={[styles.close, { backgroundColor: T.acc }]} onPress={onClose}>
            <Text style={styles.closeTxt}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  label,
  children,
  T,
}: {
  label: string;
  children: ReactNode;
  T: ReturnType<typeof makeTheme>;
}) {
  return (
    <View style={styles.row}>
      <Text style={{ color: T.txt, flex: 1, fontWeight: '600' }}>{label}</Text>
      {children}
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
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  h: { fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 12 },
  scroll: { maxHeight: 480 },
  sec: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  accentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  accentBtn: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  dot: { width: 18, height: 18, borderRadius: 9 },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  close: { marginTop: 16, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  closeTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
