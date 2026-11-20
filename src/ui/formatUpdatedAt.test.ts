import { describe, expect, it } from 'vitest';
import { formatUpdatedAt } from './formatUpdatedAt';

describe('formatUpdatedAt', () => {
  const now = new Date(2026, 10, 20, 15, 0, 0).getTime();

  it('oggi: solo ore, minuti e secondi', () => {
    expect(formatUpdatedAt(new Date(2026, 10, 20, 14, 32, 7).getTime(), now)).toBe('14:32:07');
  });

  it('un altro giorno: anche giorno e mese', () => {
    expect(formatUpdatedAt(new Date(2026, 10, 19, 9, 5).getTime(), now)).toBe('19/11, 09:05');
  });
});
