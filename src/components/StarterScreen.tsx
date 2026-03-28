import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BRAND_BG = '#0c1224';
const ACCENT = '#2dd4bf';

type Props = {
  onContinue: () => void;
};

/** Full-screen intro: title, creator credit, continue (splash is hidden when this mounts). */
export function StarterScreen({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, slide]);

  const dismiss = useCallback(() => {
    onContinue();
  }, [onContinue]);

  return (
    <View
      style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
      accessibilityLabel="App welcome screen"
    >
      <Animated.View style={{ opacity, transform: [{ translateY: slide }], flex: 1 }}>
        <View style={styles.markWrap} accessibilityRole="image" accessibilityLabel="Sudoku Ultimatum logo mark">
          <View style={styles.markRing}>
            <Text style={styles.markGlyph}>⬡</Text>
          </View>
        </View>

        <Text style={styles.title} accessibilityRole="header">
          Sudoku Ultimatum
        </Text>
        <Text style={styles.subtitle}>Classic 9×9 · Offline · No ads in this build</Text>

        <View style={styles.creditBlock}>
          <Text style={styles.creditLabel}>Created by</Text>
          <Text style={styles.creditName}>Vedpragya</Text>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={dismiss}
          style={({ pressed }) => [
            styles.cta,
            { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Continue to game"
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>

        <Text style={styles.hint}>Tap Continue to start</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_BG,
    paddingHorizontal: 28,
  },
  markWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  markRing: {
    width: 112,
    height: 112,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: `${ACCENT}66`,
    backgroundColor: `${ACCENT}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGlyph: {
    fontSize: 52,
    color: ACCENT,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: 'rgba(248,250,252,0.58)',
    textAlign: 'center',
    lineHeight: 22,
  },
  creditBlock: {
    marginTop: 36,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.25)',
  },
  creditLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(248,250,252,0.5)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  creditName: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 0.3,
  },
  cta: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND_BG,
    letterSpacing: 0.3,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(248,250,252,0.38)',
  },
});
