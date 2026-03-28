/** Local calendar date YYYY-MM-DD (device timezone). */
export function localCalendarYmd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** True if `prevYmd` is exactly one calendar day before `todayYmd` in local time. */
export function isPreviousCalendarDay(prevYmd: string, todayYmd: string): boolean {
  const [py, pm, pd] = prevYmd.split('-').map(Number);
  const [ty, tm, td] = todayYmd.split('-').map(Number);
  if ([py, pm, pd, ty, tm, td].some((n) => Number.isNaN(n))) return false;
  const prev = new Date(py!, pm! - 1, pd!);
  const today = new Date(ty!, tm! - 1, td!);
  const diffDays = Math.round((today.getTime() - prev.getTime()) / 86_400_000);
  return diffDays === 1;
}

export function nextCalendarStreak(
  prevStreak: number,
  lastWinYmd: string | null,
  todayYmd: string,
): { streak: number; lastWinYmd: string } {
  if (!lastWinYmd) return { streak: 1, lastWinYmd: todayYmd };
  if (lastWinYmd === todayYmd) return { streak: prevStreak, lastWinYmd: todayYmd };
  if (isPreviousCalendarDay(lastWinYmd, todayYmd)) return { streak: prevStreak + 1, lastWinYmd: todayYmd };
  return { streak: 1, lastWinYmd: todayYmd };
}
