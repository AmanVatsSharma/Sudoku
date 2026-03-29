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
    expect(out.v).toBe(4);
    expect(out.calendarStreak).toBe(4);
    expect(out.lastWinCalendarYmd).toBeNull();
    expect(out.solves).toBe(2);
    expect(out.gamesStarted).toBe(0);
    expect(out.totalWinSeconds).toBe(0);
    expect(out.flawlessWins).toBe(0);
    expect(out.noHintWins).toBe(0);
    expect(out.settings.blockBad).toBe(false);
    expect(out.settings.numberPadMode).toBe('bottom');
  });

  it('migrates v2 to v3 with default stats fields', () => {
    const out = normalizePersisted({
      v: 2,
      xp: 200,
      calendarStreak: 2,
      lastWinCalendarYmd: '2026-03-01',
      solves: 5,
      bests: { easy: 60 },
      unlockedAchievements: ['first'],
      solvHist: [],
      settings: {
        dark: true,
        accent: 'blue',
        hlSame: true,
        showErr: true,
        autoRm: true,
        showClock: true,
        dailyReminder: false,
      },
      resume: null,
    });
    expect(out.v).toBe(4);
    expect(out.xp).toBe(200);
    expect(out.solves).toBe(5);
    expect(out.gamesStarted).toBe(0);
    expect(out.winsByDifficulty).toEqual({});
  });

  it('rejects corrupt resume on legacy v2 shape', () => {
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
        dailyReminder: false,
      },
      resume: { bogus: true },
    });
    expect(out.resume).toBeNull();
  });
});
