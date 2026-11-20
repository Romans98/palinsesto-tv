import { describe, expect, it } from 'vitest';
import { FRAMES_PER_DAY, fromParts } from '../domain/timecode';
import { formatDayLabel, formatEnd, formatStart } from './formatTimeOfDay';

const day2 = (h: number, m = 0) => FRAMES_PER_DAY + fromParts(h, m, 0, 0);

describe('formatStart', () => {
  it("mostra l'ora del giorno anche per i giorni successivi al primo", () => {
    expect(formatStart(fromParts(23, 30, 0, 0))).toEqual({ text: '23:30:00:00', nextDay: false });
    expect(formatStart(day2(6))).toEqual({ text: '06:00:00:00', nextDay: false });
  });
});

describe('formatEnd', () => {
  it('fine nello stesso giorno', () => {
    expect(formatEnd(day2(6), day2(6, 30))).toEqual({ text: '06:30:00:00', nextDay: false });
  });

  it('fine esattamente a mezzanotte: 24:00', () => {
    expect(formatEnd(fromParts(23, 50, 0, 0), FRAMES_PER_DAY)).toEqual({ text: '24:00:00:00', nextDay: false });
  });

  it('fine oltre la mezzanotte: ora del giorno successivo con +1', () => {
    expect(formatEnd(fromParts(23, 30, 0, 0), day2(0, 50))).toEqual({ text: '00:50:00:00', nextDay: true });
  });
});

describe('formatDayLabel', () => {
  it('numera i giorni a partire dalla data indicata', () => {
    const first = new Date(2026, 10, 20);
    expect(formatDayLabel(0, first)).toBe('Giorno 1 · venerdì 20 novembre');
    expect(formatDayLabel(1, first)).toBe('Giorno 2 · sabato 21 novembre');
  });
});
