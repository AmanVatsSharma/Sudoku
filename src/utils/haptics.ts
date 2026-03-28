import * as Haptics from 'expo-haptics';

/** Avoid failures on unsupported devices / web. */
export async function safeSelectionAsync(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    /* no-op */
  }
}

export async function safeImpactLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* no-op */
  }
}

export async function safeImpactMedium(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* no-op */
  }
}

export async function safeNotificationError(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    /* no-op */
  }
}
