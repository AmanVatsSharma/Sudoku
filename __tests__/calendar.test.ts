import {
  isPreviousCalendarDay,
  localCalendarYmd,
  nextCalendarStreak,
} from '../src/utils/calendar';

describe('calendar streak', () => {
  it('nextCalendarStreak increments only across consecutive local days', () => {
    expect(nextCalendarStreak(0, null, '2026-03-28')).toEqual({
      streak: 1,
      lastWinYmd: '2026-03-28',
    });
    expect(nextCalendarStreak(2, '2026-03-28', '2026-03-28')).toEqual({
      streak: 2,
      lastWinYmd: '2026-03-28',
    });
    expect(nextCalendarStreak(2, '2026-03-27', '2026-03-28')).toEqual({
      streak: 3,
      lastWinYmd: '2026-03-28',
    });
    expect(nextCalendarStreak(5, '2026-03-25', '2026-03-28')).toEqual({
      streak: 1,
      lastWinYmd: '2026-03-28',
    });
  });

  it('isPreviousCalendarDay', () => {
    expect(isPreviousCalendarDay('2026-03-27', '2026-03-28')).toBe(true);
    expect(isPreviousCalendarDay('2026-03-27', '2026-03-29')).toBe(false);
  });

  it('localCalendarYmd format', () => {
    const s = localCalendarYmd(new Date(2026, 2, 9));
    expect(s).toBe('2026-03-09');
  });
});
