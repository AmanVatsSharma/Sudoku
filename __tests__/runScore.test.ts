import { computeRunScore } from '../src/game/runScore';

describe('computeRunScore', () => {
  it('returns score within 0–10000 and a grade', () => {
    const r = computeRunScore({
      diff: 'medium',
      timeSeconds: 200,
      mistakes: 0,
      hintsUsed: 0,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(10000);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(r.grade);
  });

  it('does not lower score when mistakes decrease (same other inputs)', () => {
    const base = {
      diff: 'hard' as const,
      timeSeconds: 400,
      hintsUsed: 0,
      personalBestSeconds: 500,
    };
    const lowMistakes = computeRunScore({ ...base, mistakes: 0 });
    const highMistakes = computeRunScore({ ...base, mistakes: 5 });
    expect(lowMistakes.score).toBeGreaterThanOrEqual(highMistakes.score);
  });

  it('rewards beating personal best', () => {
    const slower = computeRunScore({
      diff: 'easy',
      timeSeconds: 85,
      mistakes: 0,
      hintsUsed: 0,
      personalBestSeconds: 80,
    });
    const faster = computeRunScore({
      diff: 'easy',
      timeSeconds: 70,
      mistakes: 0,
      hintsUsed: 0,
      personalBestSeconds: 80,
    });
    expect(faster.score).toBeGreaterThan(slower.score);
  });
});
