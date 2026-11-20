import { describe, expect, it } from 'vitest';
import { computeSchedule } from '../domain/schedule';
import { formatTimecode } from '../domain/timecode';
import { createSeedPrograms } from './seed';

describe('dati demo', () => {
  const schedule = computeSchedule(createSeedPrograms());

  it('partono senza sforamenti né pubblicità troppo lunghe', () => {
    expect(schedule.issues).toEqual({ overflows: 0, longAdBreaks: 0 });
  });

  it('coprono la giornata dalle 06:00 alle 24:00', () => {
    const rows = schedule.rows;
    expect(formatTimecode(rows[0].start)).toBe('06:00:00:00');
    expect(formatTimecode(rows[rows.length - 1].end)).toBe('24:00:00:00');
  });

  it('hanno id univoci', () => {
    const ids = createSeedPrograms().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
