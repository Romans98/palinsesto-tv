import type { Frames } from './timecode';

/**
 * Programma così come viene salvato.
 * L'inizio dei programmi flottanti, la fine di ogni programma e i blocchi
 * pubblicitari non vengono salvati: si calcolano con `computeSchedule`.
 */
export type Program = {
  id: string;
  title: string;
  durationFrames: Frames;
  /** Orario di inizio per i programmi a orario fisso (ancore), `null` per i flottanti */
  fixedStartFrames: Frames | null;
  /** Incrementata a ogni modifica: serve a rilevare modifiche concorrenti */
  version: number;
  /** Utente che ha fatto l'ultima modifica */
  updatedBy: string;
  /** Istante dell'ultima modifica (millisecondi epoch), assegnato dal server */
  updatedAt: number;
};

export const isAnchor = (program: Program): boolean => program.fixedStartFrames !== null;
