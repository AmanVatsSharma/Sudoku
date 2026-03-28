import { normalizePersisted } from '../src/persistence/validate';

describe('normalizePersisted', () => {
  it('migrates v1 to v2', () => {
    const out = normalizePersisted({
      v: 1,
      xp: 100,
      streak: 4,
      solves: 2,
      bests: {},
      unlockedAchievements: ['first'],
      solvHist: [],
      settings: {
        dark: true,
        accent: 'blue',
        hlSame: true,
        showErr: true,
        autoRm: true,
        showClock: true,
      },
      resume: null,
    });
    expect(out.v).toBe(2);
    expect(out.calendarStreak).toBe(4);
    expect(out.lastWinCalendarYmd).toBeNull();
    expect(out.solves).toBe(2);
  });

  it('rejects corrupt resume on v2', () => {
    const out = normalizePersisted({
      v: 2,
      xp: 0,
      calendarStreak: 0,
      lastWinCalendarYmd: null,
      solves: 0,
      bests: {},
      unlockedAchievements: [],
      solvHist: [],
      settings: {
        dark: true,
        accent: 'blue',
        hlSame: true,
        showErr: true,
        autoRm: true,
        showClock: true,
      },
      resume: { bogus: true },
    });
    expect(out.resume).toBeNull();
  });
});
