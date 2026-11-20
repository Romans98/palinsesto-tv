import type { Frames } from '../domain/timecode';
import type { AddResult, DeleteResult, ScheduleRepository, UpdateResult } from './ScheduleRepository';

/**
 * Un altro utente simulato.
 * Usa lo stesso repository di qualunque client, senza accessi privilegiati:
 * se lavora su dati non aggiornati riceve anche lui un conflitto.
 */
export class SimulatedUser {
  private readonly repository: ScheduleRepository;
  readonly name: string;

  constructor(repository: ScheduleRepository, name: string) {
    this.repository = repository;
    this.name = name;
  }

  /** Cambia la durata di un programma di `deltaFrames` partendo dalla versione che vede in questo momento */
  async changeDuration(programId: string, deltaFrames: Frames): Promise<UpdateResult> {
    const program = this.repository.getSnapshot().find((p) => p.id === programId);
    if (!program) return { status: 'notFound' };
    return this.repository.updateDuration({
      programId,
      durationFrames: program.durationFrames + deltaFrames,
      expectedVersion: program.version,
      user: this.name,
    });
  }

  /** Aggiunge un programma flottante dopo `afterProgramId` */
  addProgram(title: string, durationFrames: Frames, afterProgramId: string | null): Promise<AddResult> {
    return this.repository.addProgram({
      title,
      durationFrames,
      placement: { kind: 'after', programId: afterProgramId },
      user: this.name,
    });
  }

  /** Elimina un programma partendo dalla versione che vede in questo momento */
  async deleteProgram(programId: string): Promise<DeleteResult> {
    const program = this.repository.getSnapshot().find((p) => p.id === programId);
    if (!program) return { status: 'notFound' };
    return this.repository.deleteProgram({ programId, expectedVersion: program.version, user: this.name });
  }
}
