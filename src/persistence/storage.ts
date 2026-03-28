import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppPersistedV1 } from './schema';
import { PERSISTENCE_VERSION, defaultPersisted } from './schema';

const STORAGE_KEY = '@sudoku/persisted_v1';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function parsePersisted(raw: string): AppPersistedV1 | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return null;
    if (data.v !== PERSISTENCE_VERSION) return null;
    return data as AppPersistedV1;
  } catch {
    return null;
  }
}

export async function loadPersisted(): Promise<AppPersistedV1> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersisted();
    const parsed = parsePersisted(raw);
    return parsed ?? defaultPersisted();
  } catch {
    return defaultPersisted();
  }
}

export async function savePersisted(state: AppPersistedV1): Promise<void> {
  const payload: AppPersistedV1 = { ...state, v: PERSISTENCE_VERSION };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
