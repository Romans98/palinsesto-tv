import type {
  AddProgramCommand,
  AddResult,
  DeleteProgramCommand,
  DeleteResult,
  UpdateDurationCommand,
  UpdateResult,
} from '../domain/commands';
import type { Program } from '../domain/types';

export type { AddProgramCommand, AddResult, DeleteProgramCommand, DeleteResult, UpdateDurationCommand, UpdateResult };

/**
 * Contratto tra la UI e la sorgente dei dati del palinsesto.
 * Oggi è implementato da `FakeScheduleServer`; un backend reale
 * (REST + WebSocket) può sostituirlo senza modificare la UI.
 */
export interface ScheduleRepository {
  /** Registra un listener chiamato a ogni cambiamento dei dati; restituisce la funzione per annullare la registrazione */
  subscribe(listener: () => void): () => void;
  /** Stato attuale. Restituisce lo stesso oggetto finché i dati non cambiano */
  getSnapshot(): readonly Program[];
  updateDuration(command: UpdateDurationCommand): Promise<UpdateResult>;
  addProgram(command: AddProgramCommand): Promise<AddResult>;
  deleteProgram(command: DeleteProgramCommand): Promise<DeleteResult>;
  /** Ripristina i dati demo */
  reset(): void;
}
