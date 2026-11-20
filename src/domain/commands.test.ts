import { describe, expect, it } from 'vitest';
import { applyAddProgram, applyUpdateDuration as applyUpdate } from './commands';
import { computeSchedule } from './schedule';
import { FRAMES_PER_DAY, FRAMES_PER_MINUTE, fromParts, type Frames } from './timecode';
import type { Program } from './types';

const at = (hours: number, minutes = 0): Frames => fromParts(hours, minutes, 0, 0);
const min = (minutes: number): Frames => minutes * FRAMES_PER_MINUTE;

const floating = (id: string, duration: Frames, version = 1): Program => ({
  id,
  title: id,
  durationFrames: duration,
  fixedStartFrames: null,
  version,
  updatedBy: 'seed',
  updatedAt: 0,
});
const anchor = (id: string, start: Frames, duration: Frames): Program => ({
  ...floating(id, duration),
  fixedStartFrames: start,
});

const ids = (programs: Program[]) => programs.map((p) => p.id);

const NOW = Date.UTC(2026, 10, 20, 14, 30);
const applyUpdateDuration = (programs: Program[], command: Parameters<typeof applyUpdate>[1]) =>
  applyUpdate(programs, command, NOW);

describe('applyUpdateDuration', () => {
  const programs = [floating('a', min(30), 3), floating('b', min(45))];

  it('con la versione corretta aggiorna durata, versione e autore', () => {
    const { programs: next, result } = applyUpdateDuration(programs, {
      programId: 'a',
      durationFrames: min(32),
      expectedVersion: 3,
      user: 'Utente Test 1',
    });
    expect(result.status).toBe('ok');
    expect(next[0]).toMatchObject({ durationFrames: min(32), version: 4, updatedBy: 'Utente Test 1', updatedAt: NOW });
  });

  it('non modifica la lista originale', () => {
    applyUpdateDuration(programs, { programId: 'a', durationFrames: min(32), expectedVersion: 3, user: 'u' });
    expect(programs[0].durationFrames).toBe(min(30));
  });

  it('con una versione vecchia restituisce un conflitto e la lista non cambia', () => {
    const { programs: next, result } = applyUpdateDuration(programs, {
      programId: 'a',
      durationFrames: min(32),
      expectedVersion: 2,
      user: 'u',
    });
    expect(result).toEqual({ status: 'conflict', current: programs[0] });
    expect(next).toEqual(programs);
  });

  it('due client sulla stessa versione: il primo vince, il secondo riceve un conflitto', () => {
    const first = applyUpdateDuration(programs, {
      programId: 'a',
      durationFrames: min(35),
      expectedVersion: 3,
      user: 'Utente Test 1',
    });
    const second = applyUpdateDuration(first.programs, {
      programId: 'a',
      durationFrames: min(25),
      expectedVersion: 3,
      user: 'Utente Test 2',
    });
    expect(first.result.status).toBe('ok');
    expect(second.result).toMatchObject({
      status: 'conflict',
      current: { durationFrames: min(35), version: 4, updatedBy: 'Utente Test 1' },
    });
  });

  it('due client su programmi diversi: entrambe le modifiche vanno a buon fine', () => {
    const first = applyUpdateDuration(programs, { programId: 'a', durationFrames: min(35), expectedVersion: 3, user: '1' });
    const second = applyUpdateDuration(first.programs, { programId: 'b', durationFrames: min(50), expectedVersion: 1, user: '2' });
    expect(second.result.status).toBe('ok');
    expect(second.programs.map((p) => p.durationFrames)).toEqual([min(35), min(50)]);
  });

  it.each([0, FRAMES_PER_DAY + 1])('rifiuta una durata non valida (%i frame)', (duration) => {
    const { result } = applyUpdateDuration(programs, { programId: 'a', durationFrames: duration, expectedVersion: 3, user: 'u' });
    expect(result.status).toBe('invalid');
  });

  it('programma inesistente', () => {
    const { result } = applyUpdateDuration(programs, { programId: 'x', durationFrames: min(1), expectedVersion: 1, user: 'u' });
    expect(result).toEqual({ status: 'notFound' });
  });
});

describe('applyAddProgram', () => {
  const programs = [
    anchor('mattino', at(6), min(30)),
    floating('show', min(60)),
    anchor('tg', at(20), min(30)),
    floating('film', min(90)),
  ];
  const add = (placement: Parameters<typeof applyAddProgram>[1]['placement'], duration = min(10), title = 'Nuovo') =>
    applyAddProgram(programs, { title, durationFrames: duration, placement, user: 'Utente Test 1' }, 'new', NOW);

  it('flottante dopo un programma', () => {
    const { programs: next, result } = add({ kind: 'after', programId: 'show' });
    expect(result).toMatchObject({ status: 'ok', program: { id: 'new', fixedStartFrames: null, version: 1, updatedAt: NOW } });
    expect(ids(next)).toEqual(['mattino', 'show', 'new', 'tg', 'film']);
  });

  it('flottante in cima alla lista', () => {
    expect(ids(add({ kind: 'after', programId: null }).programs)).toEqual(['new', 'mattino', 'show', 'tg', 'film']);
  });

  it('flottante dopo un programma che non esiste più', () => {
    expect(add({ kind: 'after', programId: 'x' }).result.status).toBe('invalid');
  });

  it("un'ancora viene inserita dopo i programmi che iniziano prima del suo orario", () => {
    expect(ids(add({ kind: 'fixed', startFrames: at(12) }).programs)).toEqual(['mattino', 'show', 'new', 'tg', 'film']);
    expect(ids(add({ kind: 'fixed', startFrames: at(23) }).programs)).toEqual(['mattino', 'show', 'tg', 'film', 'new']);
    expect(ids(add({ kind: 'fixed', startFrames: at(5) }).programs)).toEqual(['new', 'mattino', 'show', 'tg', 'film']);
  });

  it("rifiuta un'ancora che si sovrappone a un'altra ancora", () => {
    const { result } = add({ kind: 'fixed', startFrames: at(19, 55) });
    expect(result).toMatchObject({ status: 'invalid' });
    if (result.status === 'invalid') expect(result.error).toContain('tg');
  });

  it("accetta un'ancora che finisce esattamente quando inizia l'altra", () => {
    expect(add({ kind: 'fixed', startFrames: at(19, 50) }).result.status).toBe('ok');
  });

  it("un'ancora sovrapposta a un flottante è valida e lo sforamento viene segnalato", () => {
    // "show" va dalle 06:30 alle 07:30: un'ancora alle 07:00 lo fa sforare di 30 minuti
    const { programs: next, result } = add({ kind: 'fixed', startFrames: at(7) });
    expect(result.status).toBe('ok');
    const show = computeSchedule(next).rows.find((r) => r.kind === 'program' && r.program.id === 'show');
    expect(show).toMatchObject({ overflow: { amount: min(30) } });
  });

  it('rifiuta un orario di inizio fuori dalla giornata', () => {
    expect(add({ kind: 'fixed', startFrames: FRAMES_PER_DAY }).result.status).toBe('invalid');
  });

  it('rifiuta un titolo vuoto e una durata non valida', () => {
    expect(add({ kind: 'after', programId: null }, min(10), '   ').result.status).toBe('invalid');
    expect(add({ kind: 'after', programId: null }, 0).result.status).toBe('invalid');
  });

  it('elimina gli spazi superflui dal titolo', () => {
    expect(add({ kind: 'after', programId: null }, min(10), '  Promo  ').result).toMatchObject({ program: { title: 'Promo' } });
  });
});
