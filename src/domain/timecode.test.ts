import { describe, expect, it } from 'vitest';
import {
  FRAMES_PER_DAY,
  FRAMES_PER_HOUR,
  formatTimecode,
  fromParts,
  parseDuration,
  parseTimecode,
} from './timecode';

describe('costanti', () => {
  it('1 ora = 90.000 frame a 25 FPS', () => {
    expect(FRAMES_PER_HOUR).toBe(90_000);
  });
  it('1 giorno = 2.160.000 frame', () => {
    expect(FRAMES_PER_DAY).toBe(2_160_000);
  });
});

describe('formatTimecode', () => {
  it.each([
    [0, '00:00:00:00'],
    [1, '00:00:00:01'],
    [24, '00:00:00:24'],
    [25, '00:00:01:00'],
    [fromParts(0, 30, 0, 0), '00:30:00:00'],
    [fromParts(20, 0, 0, 0), '20:00:00:00'],
    [fromParts(1, 2, 3, 4), '01:02:03:04'],
    [FRAMES_PER_DAY, '24:00:00:00'],
  ])('%i frame → %s', (frames, expected) => {
    expect(formatTimecode(frames)).toBe(expected);
  });

  it('rifiuta valori negativi o non interi', () => {
    expect(() => formatTimecode(-1)).toThrow(RangeError);
    expect(() => formatTimecode(1.5)).toThrow(RangeError);
  });
});

describe('parseTimecode', () => {
  it('è l\'inverso di formatTimecode', () => {
    for (const frames of [0, 1, 24, 25, 1_499, 90_000, 1_234_567, FRAMES_PER_DAY]) {
      expect(parseTimecode(formatTimecode(frames))).toEqual({ ok: true, value: frames });
    }
  });

  it('tollera spazi ai lati', () => {
    expect(parseTimecode(' 00:00:01:00 ')).toEqual({ ok: true, value: 25 });
  });

  it.each([
    ['', 'Formato'],
    ['00:30:00', 'Formato'],
    ['0:30:00:00', 'Formato'],
    ['00:30:00:0a', 'Formato'],
    ['00:60:00:00', 'minuti'],
    ['00:00:60:00', 'secondi'],
    ['00:00:00:25', 'frame'],
  ])('rifiuta "%s"', (input, errorFragment) => {
    const result = parseTimecode(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(errorFragment);
  });
});

describe('parseDuration (D-005)', () => {
  it('accetta il minimo di 1 frame', () => {
    expect(parseDuration('00:00:00:01')).toEqual({ ok: true, value: 1 });
  });
  it('rifiuta la durata zero', () => {
    expect(parseDuration('00:00:00:00').ok).toBe(false);
  });
  it('accetta il massimo di 24 ore', () => {
    expect(parseDuration('24:00:00:00')).toEqual({ ok: true, value: FRAMES_PER_DAY });
  });
  it('rifiuta oltre le 24 ore', () => {
    expect(parseDuration('24:00:00:01').ok).toBe(false);
  });
});
