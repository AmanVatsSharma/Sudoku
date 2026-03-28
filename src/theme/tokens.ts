import type { Difficulty } from '../game/types';

export type AccentId = 'blue' | 'purple' | 'green' | 'orange' | 'teal';

export type DifficultyMeta = {
  label: string;
  color: string;
  dColor: string;
  desc: string;
};

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  easy: {
    label: 'Easy',
    color: '#34C759',
    dColor: '#30D158',
    desc: 'Relaxed & fun',
  },
  medium: {
    label: 'Medium',
    color: '#FF9500',
    dColor: '#FF9F0A',
    desc: 'Balanced challenge',
  },
  hard: {
    label: 'Hard',
    color: '#FF6B6B',
    dColor: '#FF6B6B',
    desc: 'Real thinking',
  },
  expert: {
    label: 'Expert',
    color: '#AF52DE',
    dColor: '#BF5AF2',
    desc: 'Serious solver',
  },
  ultimatum: {
    label: 'Ultimatum',
    color: '#007AFF',
    dColor: '#0A84FF',
    desc: 'Max difficulty',
  },
};

export const ACCENTS: {
  id: AccentId;
  l: string;
  d: string;
  name: string;
}[] = [
  { id: 'blue', l: '#007AFF', d: '#0A84FF', name: 'Ocean' },
  { id: 'purple', l: '#AF52DE', d: '#BF5AF2', name: 'Cosmic' },
  { id: 'green', l: '#28A745', d: '#30D158', name: 'Forest' },
  { id: 'orange', l: '#E67700', d: '#FF9F0A', name: 'Ember' },
  { id: 'teal', l: '#0097A7', d: '#5AC8FA', name: 'Arctic' },
];

export type ThemeTokens = {
  bg: string;
  bgC: string;
  bgS: string;
  sur: string;
  surH: string;
  bor: string;
  borS: string;
  txt: string;
  txS: string;
  txM: string;
  txF: string;
  acc: string;
  aD: string;
  aM: string;
  aB: string;
  red: string;
  rD: string;
  grn: string;
  yel: string;
  cSel: string;
  cRel: string;
  cSam: string;
  cCon: string;
  gClr: string;
  pClr: string;
  eClr: string;
  glow: string;
  dark: boolean;
  aid: AccentId;
};

export function makeTheme(dark: boolean, accentId: AccentId): ThemeTokens {
  const ac = ACCENTS.find((a) => a.id === accentId) ?? ACCENTS[0]!;
  const a = dark ? ac.d : ac.l;
  if (dark) {
    return {
      bg: '#08080F',
      bgC: '#0E0E1A',
      bgS: '#141422',
      sur: 'rgba(255,255,255,0.055)',
      surH: 'rgba(255,255,255,0.1)',
      bor: 'rgba(255,255,255,0.09)',
      borS: 'rgba(255,255,255,0.22)',
      txt: '#F2F2F7',
      txS: 'rgba(242,242,247,0.7)',
      txM: 'rgba(242,242,247,0.4)',
      txF: 'rgba(242,242,247,0.18)',
      acc: a,
      aD: `${a}28`,
      aM: `${a}44`,
      aB: `${a}55`,
      red: '#FF453A',
      rD: 'rgba(255,69,58,0.2)',
      grn: '#30D158',
      yel: '#FFD60A',
      cSel: `${a}38`,
      cRel: 'rgba(255,255,255,0.055)',
      cSam: `${a}20`,
      cCon: 'rgba(255,69,58,0.22)',
      gClr: '#F2F2F7',
      pClr: a,
      eClr: '#FF453A',
      glow: `0 0 60px ${a}20`,
      dark: true,
      aid: accentId,
    };
  }
  return {
    bg: '#F3F3EE',
    bgC: '#FFFFFF',
    bgS: '#F8F8F4',
    sur: 'rgba(0,0,0,0.045)',
    surH: 'rgba(0,0,0,0.09)',
    bor: 'rgba(0,0,0,0.09)',
    borS: 'rgba(0,0,0,0.22)',
    txt: '#1A1A1E',
    txS: 'rgba(26,26,30,0.7)',
    txM: 'rgba(26,26,30,0.45)',
    txF: 'rgba(26,26,30,0.2)',
    acc: a,
    aD: `${a}22`,
    aM: `${a}38`,
    aB: `${a}50`,
    red: '#FF3B30',
    rD: 'rgba(255,59,48,0.13)',
    grn: '#28A745',
    yel: '#FFCC00',
    cSel: `${a}2E`,
    cRel: 'rgba(0,0,0,0.04)',
    cSam: `${a}18`,
    cCon: 'rgba(255,59,48,0.12)',
    gClr: '#1A1A1E',
    pClr: a,
    eClr: '#FF3B30',
    glow: `0 0 60px ${a}18`,
    dark: false,
    aid: accentId,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
