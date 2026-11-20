import { describe, expect, it } from 'vitest';
import { detectRemoteChanges } from './remoteChanges';
import type { Program } from './types';

const program = (id: string, version = 1, updatedBy = 'Sistema'): Program => ({
  id,
  title: id,
  durationFrames: 100,
  fixedStartFrames: null,
  version,
  updatedBy,
  updatedAt: 0,
});

const ME = 'Utente Test 1';
const OTHER = 'Utente Test 2';

describe('detectRemoteChanges', () => {
  it('nessuna differenza: nessuna modifica', () => {
    const list = [program('a'), program('b')];
    expect(detectRemoteChanges(list, list, ME)).toEqual([]);
  });

  it('un programma modificato da un altro utente', () => {
    const changes = detectRemoteChanges([program('a')], [program('a', 2, OTHER)], ME);
    expect(changes).toEqual([{ kind: 'updated', program: program('a', 2, OTHER) }]);
  });

  it('le mie modifiche non vengono segnalate', () => {
    expect(detectRemoteChanges([program('a')], [program('a', 2, ME)], ME)).toEqual([]);
  });

  it('un programma aggiunto da un altro utente', () => {
    const changes = detectRemoteChanges([program('a')], [program('a'), program('b', 1, OTHER)], ME);
    expect(changes).toEqual([{ kind: 'added', program: program('b', 1, OTHER) }]);
  });

  it('un programma eliminato da altri', () => {
    const changes = detectRemoteChanges([program('a'), program('b')], [program('a')], ME);
    expect(changes).toEqual([{ kind: 'deleted', program: program('b') }]);
  });

  it('le mie eliminazioni non vengono segnalate', () => {
    expect(detectRemoteChanges([program('a'), program('b')], [program('a')], ME, new Set(['b']))).toEqual([]);
  });

  it('un ritorno a una versione più bassa (ripristino dei dati demo) non è una modifica del programma', () => {
    expect(detectRemoteChanges([program('a', 5, OTHER)], [program('a', 1)], ME)).toEqual([]);
  });
});
