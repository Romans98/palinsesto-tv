import { describe, expect, it, vi } from 'vitest';
import { FRAMES_PER_MINUTE } from '../domain/timecode';
import { FakeScheduleServer, type ExternalChanges, type StorageLike } from './FakeScheduleServer';
import { createSeedPrograms } from './seed';
import { SimulatedUser } from './SimulatedUser';
import { currentUserName } from './userIdentity';

const min = (minutes: number) => minutes * FRAMES_PER_MINUTE;

/**
 * Simula un localStorage condiviso tra più tab: quando una "tab" scrive,
 * le altre ricevono la notifica, come con l'evento `storage` del browser.
 */
function createSharedBrowser() {
  const data = new Map<string, string>();
  const tabListeners = new Set<() => void>();

  const openTab = () => {
    let ownListener: (() => void) | null = null;
    const storage: StorageLike = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
        // come nel browser, l'evento arriva solo alle altre tab
        for (const listener of tabListeners) if (listener !== ownListener) listener();
      },
    };
    const externalChanges: ExternalChanges = (onChange) => {
      ownListener = onChange;
      tabListeners.add(onChange);
      return () => tabListeners.delete(onChange);
    };
    return new FakeScheduleServer({ storage, externalChanges, latencyMs: 0, generateId: () => 'new-id' });
  };

  return { openTab };
}

const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('FakeScheduleServer', () => {
  it('al primo avvio carica i dati demo', () => {
    const server = createSharedBrowser().openTab();
    expect(server.getSnapshot()).toEqual(createSeedPrograms());
  });

  it('avvisa chi è iscritto a ogni modifica', async () => {
    const server = createSharedBrowser().openTab();
    const listener = vi.fn();
    server.subscribe(listener);
    await server.updateDuration({ programId: 'seed-2', durationFrames: min(100), expectedVersion: 1, user: 'u' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('non avvisa nessuno se il comando viene rifiutato', async () => {
    const server = createSharedBrowser().openTab();
    const listener = vi.fn();
    server.subscribe(listener);
    await server.updateDuration({ programId: 'seed-2', durationFrames: min(100), expectedVersion: 99, user: 'u' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('lo snapshot resta lo stesso oggetto finché i dati non cambiano', async () => {
    const server = createSharedBrowser().openTab();
    const before = server.getSnapshot();
    expect(server.getSnapshot()).toBe(before);
    await server.updateDuration({ programId: 'seed-2', durationFrames: min(100), expectedVersion: 1, user: 'u' });
    expect(server.getSnapshot()).not.toBe(before);
  });

  it('due tab: la modifica della prima arriva alla seconda', async () => {
    const browser = createSharedBrowser();
    const tab1 = browser.openTab();
    const tab2 = browser.openTab();
    const listener = vi.fn();
    tab2.subscribe(listener);

    await tab1.updateDuration({ programId: 'seed-2', durationFrames: min(100), expectedVersion: 1, user: 'Utente Test 1' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(tab2.getSnapshot().find((p) => p.id === 'seed-2')).toMatchObject({
      durationFrames: min(100),
      version: 2,
      updatedBy: 'Utente Test 1',
    });
  });

  it('due tab che modificano lo stesso programma: la seconda riceve un conflitto', async () => {
    const browser = createSharedBrowser();
    const tab1 = browser.openTab();
    const tab2 = browser.openTab();

    const first = await tab1.updateDuration({ programId: 'seed-2', durationFrames: min(100), expectedVersion: 1, user: '1' });
    const second = await tab2.updateDuration({ programId: 'seed-2', durationFrames: min(110), expectedVersion: 1, user: '2' });

    expect(first.status).toBe('ok');
    expect(second).toMatchObject({ status: 'conflict', current: { durationFrames: min(100) } });
  });

  it('il comando viene valutato sullo stato al termine del ritardo di rete', async () => {
    vi.useFakeTimers();
    const browser = createSharedBrowser();
    const slowTab = browser.openTab();
    const fastTab = browser.openTab();
    slowTab.setLatency(1000);

    const slow = slowTab.updateDuration({ programId: 'seed-2', durationFrames: min(100), expectedVersion: 1, user: 'lento' });
    const fast = fastTab.updateDuration({ programId: 'seed-2', durationFrames: min(110), expectedVersion: 1, user: 'veloce' });
    await vi.advanceTimersByTimeAsync(1000);

    expect((await fast).status).toBe('ok');
    expect((await slow).status).toBe('conflict');
    vi.useRealTimers();
  });

  it('reset ripristina i dati demo', async () => {
    const server = createSharedBrowser().openTab();
    await server.updateDuration({ programId: 'seed-2', durationFrames: min(100), expectedVersion: 1, user: 'u' });
    server.reset();
    expect(server.getSnapshot()).toEqual(createSeedPrograms());
  });
});

describe('SimulatedUser', () => {
  it('modifica la durata partendo dalla versione che vede', async () => {
    const server = createSharedBrowser().openTab();
    const bot = new SimulatedUser(server, 'Utente Test 2');
    const result = await bot.changeDuration('seed-2', min(2));
    expect(result).toMatchObject({ status: 'ok', program: { durationFrames: min(122), updatedBy: 'Utente Test 2' } });
  });

  it('aggiunge un programma flottante', async () => {
    const server = createSharedBrowser().openTab();
    const bot = new SimulatedUser(server, 'Utente Test 2');
    await bot.addProgram('Promo', min(1), 'seed-1');
    expect(server.getSnapshot()[1]).toMatchObject({ id: 'new-id', title: 'Promo' });
  });
});

describe('currentUserName', () => {
  it('assegna Utente Test 1, 2, … a tab diverse e mantiene il nome nella stessa tab', () => {
    const shared = memoryStorage();
    const tab1 = memoryStorage();
    const tab2 = memoryStorage();
    expect(currentUserName(tab1, shared)).toBe('Utente Test 1');
    expect(currentUserName(tab2, shared)).toBe('Utente Test 2');
    expect(currentUserName(tab1, shared)).toBe('Utente Test 1');
  });
});
