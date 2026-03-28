import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { getExtra } from '../config/env';

export function HomeScreen() {
  const { appVariant } = getExtra();
  return (
    <View style={styles.container}>
      <Text>Open up src/App.tsx to start working on your app!</Text>
      <Text style={styles.caption} accessibilityLabel={`Build variant ${appVariant}`}>
        {appVariant}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: 12,
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
