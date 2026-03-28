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
