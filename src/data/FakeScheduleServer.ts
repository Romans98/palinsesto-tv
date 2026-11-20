import {
  applyAddProgram,
  applyUpdateDuration,
  type AddProgramCommand,
  type AddResult,
  type UpdateDurationCommand,
  type UpdateResult,
} from '../domain/commands';
import type { Program } from '../domain/types';
import type { ScheduleRepository } from './ScheduleRepository';
import { createSeedPrograms } from './seed';

export const STORAGE_KEY = 'palinsesto-tv/schedule';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** Notifica le modifiche fatte da altre istanze (in browser: altre tab) */
export type ExternalChanges = (onChange: () => void) => () => void;

export type FakeScheduleServerOptions = {
  storage: StorageLike;
  externalChanges: ExternalChanges;
  latencyMs?: number;
  generateId?: () => string;
};

/**
 * Backend simulato nel browser.
 * Il "database" è uno storage condiviso (in browser il localStorage, comune a tutte le tab):
 * ogni comando legge lo stato più recente, applica le regole di dominio e salva.
 * Il ritardo di rete è simulato prima di eseguire il comando, quindi nel frattempo
 * altri utenti possono modificare gli stessi dati, come succederebbe con un server reale.
 */
export class FakeScheduleServer implements ScheduleRepository {
  private readonly storage: StorageLike;
  private readonly generateId: () => string;
  private readonly listeners = new Set<() => void>();
  private latencyMs: number;
  private raw: string | null = null;
  private snapshot: readonly Program[] = [];

  constructor(options: FakeScheduleServerOptions) {
    this.storage = options.storage;
    this.latencyMs = options.latencyMs ?? 500;
    this.generateId = options.generateId ?? (() => crypto.randomUUID());

    if (this.storage.getItem(STORAGE_KEY) === null) {
      this.write(createSeedPrograms());
    }
    this.refresh();
    options.externalChanges(() => {
      if (this.refresh()) this.notify();
    });
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): readonly Program[] => this.snapshot;

  getLatency(): number {
    return this.latencyMs;
  }

  setLatency(ms: number): void {
    this.latencyMs = ms;
  }

  async updateDuration(command: UpdateDurationCommand): Promise<UpdateResult> {
    await this.networkDelay();
    return this.execute((programs) => applyUpdateDuration(programs, command));
  }

  async addProgram(command: AddProgramCommand): Promise<AddResult> {
    await this.networkDelay();
    return this.execute((programs) => applyAddProgram(programs, command, this.generateId()));
  }

  reset(): void {
    this.write(createSeedPrograms());
    if (this.refresh()) this.notify();
  }

  private execute<R extends { status: string }>(
    run: (programs: readonly Program[]) => { programs: Program[]; result: R },
  ): R {
    this.refresh();
    const { programs, result } = run(this.snapshot);
    if (result.status === 'ok') {
      this.write(programs);
      if (this.refresh()) this.notify();
    }
    return result;
  }

  /** Rilegge lo storage; restituisce `true` se i dati sono cambiati */
  private refresh(): boolean {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === this.raw) return false;
    this.raw = raw;
    this.snapshot = raw === null ? [] : (JSON.parse(raw) as Program[]);
    return true;
  }

  private write(programs: readonly Program[]): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(programs));
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private networkDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }
}

/** Collega il server agli eventi `storage` del browser, emessi quando un'altra tab modifica il localStorage */
export const browserStorageChanges: ExternalChanges = (onChange) => {
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
};
