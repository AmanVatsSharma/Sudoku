import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.error('ErrorBoundary', error, info.componentStack);
    }
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.box} accessibilityRole="alert">
          <Text style={styles.title}>Something went wrong</Text>
          {this.state.message ? <Text style={styles.msg}>{this.state.message}</Text> : null}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  msg: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
