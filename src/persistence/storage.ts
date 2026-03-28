import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppPersistedV2 } from './schema';
import { defaultPersisted } from './schema';
import { normalizePersisted } from './validate';

const STORAGE_KEY = '@sudoku/persisted_v1';

export async function loadPersisted(): Promise<AppPersistedV2> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersisted();
    let data: unknown;
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      return defaultPersisted();
    }
    return normalizePersisted(data);
  } catch {
    return defaultPersisted();
  }
}

export async function savePersisted(state: AppPersistedV2): Promise<void> {
  try {
    const payload = normalizePersisted(state);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('[Sudoku] Failed to persist state', err);
  }
}
