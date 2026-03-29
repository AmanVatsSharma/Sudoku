export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AchievementDef = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  xp: number;
  rarity: AchievementRarity;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first',
    icon: '⚡',
    title: 'First Blood',
    desc: 'Complete your first puzzle',
    xp: 100,
    rarity: 'common',
  },
  {
    id: 'flawless',
    icon: '◈',
    title: 'Flawless',
    desc: 'Solve with zero mistakes',
    xp: 300,
    rarity: 'rare',
  },
  {
    id: 'solo',
    icon: '✦',
    title: 'Self-Reliant',
    desc: 'Solve without using hints',
    xp: 200,
    rarity: 'uncommon',
  },
  {
    id: 'speed',
    icon: '⚡',
    title: 'Speed Demon',
    desc: 'Solve Easy in under 90 seconds',
    xp: 250,
    rarity: 'uncommon',
  },
  {
    id: 'expert',
    icon: '◉',
    title: 'Expert Mind',
    desc: 'Complete an Expert puzzle',
    xp: 500,
    rarity: 'epic',
  },
  {
    id: 'ultimate',
    icon: '⬡',
    title: 'Ultimatum',
    desc: 'Complete an Ultimatum puzzle',
    xp: 1000,
    rarity: 'legendary',
  },
  {
    id: 'streak3',
    icon: '🔥',
    title: 'On Fire',
    desc: 'Reach a 3-day streak',
    xp: 150,
    rarity: 'common',
  },
  {
    id: 'perfect',
    icon: '★',
    title: 'Perfect Expert',
    desc: 'Expert: no mistakes & no hints',
    xp: 750,
    rarity: 'legendary',
  },
  {
    id: 'solve10',
    icon: '⑩',
    title: 'Getting Started',
    desc: 'Complete 10 puzzles',
    xp: 120,
    rarity: 'common',
  },
  {
    id: 'solve50',
    icon: '🏅',
    title: 'Dedicated',
    desc: 'Complete 50 puzzles',
    xp: 280,
    rarity: 'uncommon',
  },
  {
    id: 'solve100',
    icon: '💯',
    title: 'Century',
    desc: 'Complete 100 puzzles',
    xp: 500,
    rarity: 'rare',
  },
  {
    id: 'fullSpectrum',
    icon: '⬢',
    title: 'Full Spectrum',
    desc: 'Win at least once on every difficulty',
    xp: 650,
    rarity: 'epic',
  },
  {
    id: 'streak7',
    icon: '🔥',
    title: 'Week Warrior',
    desc: 'Reach a 7-day streak',
    xp: 350,
    rarity: 'rare',
  },
  {
    id: 'flawless25',
    icon: '✧',
    title: 'Precision',
    desc: 'Complete 25 puzzles with zero mistakes',
    xp: 480,
    rarity: 'epic',
  },
  {
    id: 'speedMed',
    icon: '⏱',
    title: 'Swift Medium',
    desc: 'Solve Medium in under 4 minutes',
    xp: 240,
    rarity: 'uncommon',
  },
  {
    id: 'speedHard',
    icon: '⏱',
    title: 'Swift Hard',
    desc: 'Solve Hard in under 7 minutes',
    xp: 300,
    rarity: 'uncommon',
  },
  {
    id: 'flow',
    icon: '✦',
    title: 'In The Flow',
    desc: 'Reach Flow state',
    xp: 200,
    rarity: 'uncommon',
  },
  {
    id: 'brancher',
    icon: '⑂',
    title: 'Hypothesis',
    desc: 'Use a branch',
    xp: 150,
    rarity: 'common',
  },
];

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#8E8E93',
  uncommon: '#30D158',
  rare: '#0A84FF',
  epic: '#BF5AF2',
  legendary: '#FFD60A',
};

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
