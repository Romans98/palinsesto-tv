import { describe, expect, it } from 'vitest';
import { computeSchedule, groupByDay } from '../domain/schedule';
import { formatTimecode, FRAMES_PER_DAY } from '../domain/timecode';
import { createSeedPrograms } from './seed';

describe('dati demo', () => {
  const schedule = computeSchedule(createSeedPrograms());

  it('partono senza sforamenti né pubblicità troppo lunghe', () => {
    expect(schedule.issues).toEqual({ overflows: 0, longAdBreaks: 0 });
  });

  it('coprono due giorni consecutivi, dalle 06:00 del primo alle 24:00 del secondo', () => {
    const rows = schedule.rows;
    expect(formatTimecode(rows[0].start)).toBe('06:00:00:00');
    expect(rows[rows.length - 1].end).toBe(2 * FRAMES_PER_DAY);
  });

  it('trasmettono anche di notte, senza buchi tra i due giorni', () => {
    expect(groupByDay(schedule.rows).map((day) => day.index)).toEqual([0, 1]);
  });

  it('hanno id univoci', () => {
    const ids = createSeedPrograms().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
