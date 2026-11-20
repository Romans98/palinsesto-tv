import { describe, expect, it } from 'vitest';
import { computeSchedule, type AdBreakRow, type ProgramRow, type ScheduleRow } from './schedule';
import { FRAMES_PER_MINUTE, fromParts, type Frames } from './timecode';
import type { Program } from './types';

// --- helper ---------------------------------------------------------------

const at = (hours: number, minutes = 0): Frames => fromParts(hours, minutes, 0, 0);
const min = (minutes: number): Frames => minutes * FRAMES_PER_MINUTE;

const floating = (id: string, duration: Frames): Program => ({
  id,
  title: id,
  durationFrames: duration,
  fixedStartFrames: null,
  version: 1,
  updatedBy: 'test',
  updatedAt: 0,
});

const anchor = (id: string, start: Frames, duration: Frames): Program => ({
  ...floating(id, duration),
  fixedStartFrames: start,
});

const programRows = (rows: ScheduleRow[]) => rows.filter((r): r is ProgramRow => r.kind === 'program');
const adRows = (rows: ScheduleRow[]) => rows.filter((r): r is AdBreakRow => r.kind === 'adBreak');
const row = (rows: ScheduleRow[], id: string) => {
  const found = programRows(rows).find((r) => r.program.id === id);
  if (!found) throw new Error(`Riga ${id} non trovata`);
  return found;
};

// --- casi -----------------------------------------------------------------

describe('computeSchedule: base e cascata', () => {
  it('lista vuota: nessuna riga', () => {
    expect(computeSchedule([])).toEqual({ rows: [], issues: { overflows: 0, longAdBreaks: 0 } });
  });

  it('un flottante come primo programma inizia alle 00:00', () => {
    const { rows } = computeSchedule([floating('a', min(30))]);
    expect(row(rows, 'a')).toMatchObject({ start: 0, end: min(30) });
  });

  it("un'ancora come primo programma inizia al suo orario, senza pubblicità prima", () => {
    const { rows } = computeSchedule([anchor('tg', at(6), min(30))]);
    expect(rows).toHaveLength(1);
    expect(row(rows, 'tg')).toMatchObject({ start: at(6), end: at(6, 30) });
  });

  it('i flottanti si susseguono: ognuno inizia dove finisce il precedente', () => {
    const { rows } = computeSchedule([floating('a', min(30)), floating('b', min(45)), floating('c', min(10))]);
    expect(row(rows, 'b').start).toBe(min(30));
    expect(row(rows, 'c').start).toBe(min(75));
    expect(row(rows, 'c').end).toBe(min(85));
  });

  it('allungando un flottante, i successivi slittano in avanti', () => {
    const { rows } = computeSchedule([floating('a', min(32)), floating('b', min(45)), floating('c', min(10))]);
    expect(row(rows, 'b').start).toBe(min(32));
    expect(row(rows, 'c').start).toBe(min(77));
  });

  it('accorciando un flottante, i successivi si anticipano', () => {
    const { rows } = computeSchedule([floating('a', min(28)), floating('b', min(45)), floating('c', min(10))]);
    expect(row(rows, 'b').start).toBe(min(28));
    expect(row(rows, 'c').start).toBe(min(73));
  });
});

describe('computeSchedule: pubblicità', () => {
  it("lo spazio libero prima di un'ancora diventa pubblicità", () => {
    const { rows } = computeSchedule([anchor('quiz', at(19, 30), min(25)), anchor('tg', at(20), min(30))]);
    expect(rows.map((r) => r.kind)).toEqual(['program', 'adBreak', 'program']);
    expect(adRows(rows)[0]).toMatchObject({ start: at(19, 55), end: at(20), duration: min(5), isLong: false });
  });

  it("nessuna pubblicità se il programma finisce esattamente all'inizio dell'ancora", () => {
    const { rows } = computeSchedule([anchor('quiz', at(19, 30), min(30)), anchor('tg', at(20), min(30))]);
    expect(adRows(rows)).toHaveLength(0);
  });

  it('una pubblicità di esattamente 12 minuti non è lunga', () => {
    const { rows } = computeSchedule([anchor('a', at(19), min(48)), anchor('tg', at(20), min(30))]);
    expect(adRows(rows)[0]).toMatchObject({ duration: min(12), isLong: false });
  });

  it('una pubblicità di 12 minuti e 1 frame è lunga', () => {
    const { rows } = computeSchedule([anchor('a', at(19), min(48) - 1), anchor('tg', at(20), min(30))]);
    expect(adRows(rows)[0]).toMatchObject({ duration: min(12) + 1, isLong: true });
  });

  it("allungando un flottante la pubblicità si riduce e l'ancora resta ferma", () => {
    const { rows } = computeSchedule([
      anchor('a', at(19), min(30)),
      floating('quiz', min(27)),
      anchor('tg', at(20), min(30)),
    ]);
    expect(adRows(rows)[0].duration).toBe(min(3));
    expect(row(rows, 'tg').start).toBe(at(20));
  });
});

describe('computeSchedule: sforamento e paratia', () => {
  const overflowing = [
    anchor('a', at(19), min(30)),
    floating('quiz', min(32)),
    anchor('tg', at(20), min(30)),
    floating('film', min(90)),
  ];

  it("il programma che sfora l'ancora viene segnalato e l'ancora resta al suo orario", () => {
    const { rows } = computeSchedule(overflowing);
    expect(row(rows, 'quiz').overflow).toEqual({
      amount: min(2),
      against: { kind: 'anchor', programId: 'tg', title: 'tg' },
    });
    expect(row(rows, 'tg').start).toBe(at(20));
    expect(adRows(rows)).toHaveLength(0);
  });

  it("paratia: ciò che viene dopo l'ancora non è influenzato dallo sforamento", () => {
    const { rows } = computeSchedule(overflowing);
    expect(row(rows, 'film').start).toBe(at(20, 30));
  });

  it("lo sforamento è attribuito all'ultimo programma prima dell'ancora", () => {
    const { rows } = computeSchedule([
      anchor('a', at(19), min(10)),
      floating('lungo', min(40)),
      floating('ultimo', min(20)),
      anchor('tg', at(20), min(30)),
    ]);
    expect(row(rows, 'lungo').overflow).toBeNull();
    expect(row(rows, 'ultimo').overflow?.amount).toBe(min(10));
  });

  it("un'ancora che sfora l'ancora successiva viene segnalata come un flottante", () => {
    const { rows } = computeSchedule([anchor('tg', at(20), min(40)), anchor('film', at(20, 30), min(90))]);
    expect(row(rows, 'tg').overflow?.amount).toBe(min(10));
    expect(row(rows, 'tg').truncateTo).toBe(min(30));
  });

  it('sforamento della fine della giornata', () => {
    const { rows } = computeSchedule([anchor('notte', at(23, 30), min(45))]);
    expect(row(rows, 'notte').overflow).toEqual({ amount: min(15), against: { kind: 'endOfDay' } });
  });
});

describe('computeSchedule: Tronca', () => {
  it("propone la durata che fa finire il programma all'inizio dell'ancora", () => {
    const { rows } = computeSchedule([
      anchor('a', at(19), min(30)),
      floating('quiz', min(32)),
      anchor('tg', at(20), min(30)),
    ]);
    expect(row(rows, 'quiz').truncateTo).toBe(min(30));
  });

  it('non propone il troncamento se lo sforamento supera la durata del programma', () => {
    const { rows } = computeSchedule([
      anchor('a', at(19), min(62)),
      floating('breve', min(1)),
      anchor('tg', at(20), min(30)),
    ]);
    expect(row(rows, 'breve').overflow?.amount).toBe(min(3));
    expect(row(rows, 'breve').truncateTo).toBeNull();
  });

  it('nessuna proposta se non c\'è sforamento', () => {
    const { rows } = computeSchedule([floating('a', min(30)), anchor('tg', at(20), min(30))]);
    expect(row(rows, 'a').truncateTo).toBeNull();
  });
});

describe('computeSchedule: riepilogo', () => {
  it('conta sforamenti e pubblicità lunghe', () => {
    const { issues } = computeSchedule([
      anchor('a', at(18), min(20)),
      anchor('b', at(19), min(32)),
      anchor('tg', at(19, 30), min(30)),
      anchor('notte', at(23, 50), min(20)),
    ]);
    expect(issues).toEqual({ overflows: 2, longAdBreaks: 2 });
  });
});
