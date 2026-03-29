import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import type { NumberPadMode } from '../persistence/schema';
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
  blockBad: boolean;
  setBlockBad: (v: boolean) => void;
  numberPadMode: NumberPadMode;
  setNumberPadMode: (v: NumberPadMode) => void;
  showClock: boolean;
  setShowClock: (v: boolean) => void;
  soundEffects: boolean;
  setSoundEffects: (v: boolean) => void;
  dailyReminder: boolean;
  onDailyReminderChange: (enabled: boolean) => void | Promise<void>;
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
  blockBad,
  setBlockBad,
  numberPadMode,
  setNumberPadMode,
  showClock,
  setShowClock,
  soundEffects,
  setSoundEffects,
  dailyReminder,
  onDailyReminderChange,
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
            <RowDesc
              label="Block invalid notes"
              desc="When on, impossible pencil marks are rejected."
              T={T}
            >
              <Switch value={blockBad} onValueChange={setBlockBad} />
            </RowDesc>
            <Text style={[styles.subLbl, { color: T.txM }]}>Number pad</Text>
            <View style={styles.padPick}>
              {(
                [
                  { mode: 'bottom' as const, label: 'Bottom bar' },
                  { mode: 'floating' as const, label: 'Floating' },
                ] as const
              ).map(({ mode, label }) => {
                const on = numberPadMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setNumberPadMode(mode)}
                    style={[
                      styles.padChip,
                      {
                        borderColor: on ? T.acc : T.bor,
                        backgroundColor: on ? `${T.acc}22` : T.sur,
                      },
                    ]}
                  >
                    <Text style={{ color: on ? T.acc : T.txM, fontWeight: '800', fontSize: 13 }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.hint, { color: T.txM, marginBottom: 8 }]}>
              Floating opens a pad near the selected cell; bottom keeps the large keypad.
            </Text>
            <Row label="Show timer" T={T}>
              <Switch value={showClock} onValueChange={setShowClock} />
            </Row>
            <Row label="Sound effects" T={T}>
              <Switch value={soundEffects} onValueChange={setSoundEffects} />
            </Row>
            <Text style={[styles.sec, { color: T.txM }]}>Reminders</Text>
            <Row label="Daily play reminder" T={T}>
              <Switch
                value={dailyReminder}
                onValueChange={(v) => void onDailyReminderChange(v)}
              />
            </Row>
            <Text style={[styles.hint, { color: T.txM }]}>
              One notification per day at a random time (phone / tablet only).
            </Text>
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

function RowDesc({
  label,
  desc,
  children,
  T,
}: {
  label: string;
  desc: string;
  children: ReactNode;
  T: ReturnType<typeof makeTheme>;
}) {
  return (
    <View style={[styles.row, { alignItems: 'flex-start' }]}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={{ color: T.txt, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: T.txM, fontSize: 11, marginTop: 3 }}>{desc}</Text>
      </View>
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
  subLbl: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  padPick: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  padChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
    marginTop: -4,
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
