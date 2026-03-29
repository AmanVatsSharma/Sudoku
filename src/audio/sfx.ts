import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export type SfxId = 'tap' | 'place' | 'error' | 'hint' | 'win';

const SOURCES: Record<SfxId, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  place: require('../../assets/sounds/place.wav'),
  error: require('../../assets/sounds/error.wav'),
  hint: require('../../assets/sounds/hint.wav'),
  win: require('../../assets/sounds/win.wav'),
};

/** Master trim per clip (0–1); keeps SFX felt but easy on the ears. */
const PLAYBACK_VOLUME: Record<SfxId, number> = {
  tap: 0.52,
  place: 0.58,
  error: 0.48,
  hint: 0.54,
  win: 0.62,
};

let sfxEnabled = true;
let audioModeReady = false;
let loadPromise: Promise<void> | null = null;
const sounds: Partial<Record<SfxId, Audio.Sound>> = {};

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    playThroughEarpieceAndroid: false,
  });
  audioModeReady = true;
}

async function loadAll(): Promise<void> {
  await ensureAudioMode();
  for (const id of Object.keys(SOURCES) as SfxId[]) {
    if (sounds[id]) continue;
    const sound = new Audio.Sound();
    await sound.loadAsync(SOURCES[id]);
    await sound.setIsLoopingAsync(false);
    await sound.setVolumeAsync(PLAYBACK_VOLUME[id]);
    sounds[id] = sound;
  }
}

/** Preload clips once (e.g. after persisted settings load). Safe to call multiple times. */
export async function preloadSfx(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      await loadAll();
    } catch {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

export function setSfxEnabled(on: boolean): void {
  sfxEnabled = on;
}

/** Fire-and-forget UI sound; no-ops when disabled or if playback fails. */
export function playSfx(id: SfxId): void {
  if (!sfxEnabled) return;
  void (async () => {
    try {
      await preloadSfx();
      const s = sounds[id];
      if (!s) return;
      const st = await s.getStatusAsync();
      if (!st.isLoaded) return;
      try {
        await s.stopAsync();
      } catch {
        /* already stopped */
      }
      await s.setPositionAsync(0);
      await s.playAsync();
    } catch {
      /* no-op */
    }
  })();
}
