import { computeSchedule } from './schedule';
import { FRAMES_PER_DAY, validateDuration, type Frames } from './timecode';
import type { Program } from './types';

/**
 * Regole di modifica del palinsesto, come funzioni pure:
 * stato attuale + comando → nuovo stato + esito.
 * È la logica che un backend reale eseguirebbe lato server.
 */

export type UpdateDurationCommand = {
  programId: string;
  durationFrames: Frames;
  /** Versione del programma che l'utente stava guardando quando ha iniziato la modifica */
  expectedVersion: number;
  user: string;
};

export type UpdateResult =
  | { status: 'ok'; program: Program }
  | { status: 'conflict'; current: Program }
  | { status: 'invalid'; error: string }
  | { status: 'notFound' };

export type Placement =
  /** Programma flottante inserito dopo `programId` (`null` = in cima alla lista) */
  | { kind: 'after'; programId: string | null }
  /** Programma a orario fisso */
  | { kind: 'fixed'; startFrames: Frames };

export type AddProgramCommand = {
  title: string;
  durationFrames: Frames;
  placement: Placement;
  user: string;
};

export type AddResult = { status: 'ok'; program: Program } | { status: 'invalid'; error: string };

export type CommandOutcome<R> = { programs: Program[]; result: R };

/** Modifica la durata con controllo ottimistico della versione */
export function applyUpdateDuration(
  programs: readonly Program[],
  command: UpdateDurationCommand,
): CommandOutcome<UpdateResult> {
  const unchanged = [...programs];
  const index = programs.findIndex((p) => p.id === command.programId);
  if (index === -1) {
    return { programs: unchanged, result: { status: 'notFound' } };
  }

  const validation = validateDuration(command.durationFrames);
  if (!validation.ok) {
    return { programs: unchanged, result: { status: 'invalid', error: validation.error } };
  }

  const current = programs[index];
  if (current.version !== command.expectedVersion) {
    return { programs: unchanged, result: { status: 'conflict', current } };
  }

  const updated: Program = {
    ...current,
    durationFrames: command.durationFrames,
    version: current.version + 1,
    updatedBy: command.user,
  };
  const next = [...programs];
  next[index] = updated;
  return { programs: next, result: { status: 'ok', program: updated } };
}

/** Aggiunge un programma flottante o a orario fisso */
export function applyAddProgram(
  programs: readonly Program[],
  command: AddProgramCommand,
  id: string,
): CommandOutcome<AddResult> {
  const invalid = (error: string): CommandOutcome<AddResult> => ({
    programs: [...programs],
    result: { status: 'invalid', error },
  });

  const title = command.title.trim();
  if (title === '') return invalid('Il titolo è obbligatorio');

  const validation = validateDuration(command.durationFrames);
  if (!validation.ok) return invalid(validation.error);

  const { placement } = command;
  const program: Program = {
    id,
    title,
    durationFrames: command.durationFrames,
    fixedStartFrames: placement.kind === 'fixed' ? placement.startFrames : null,
    version: 1,
    updatedBy: command.user,
  };

  let index: number;
  if (placement.kind === 'after') {
    if (placement.programId === null) {
      index = 0;
    } else {
      const reference = programs.findIndex((p) => p.id === placement.programId);
      if (reference === -1) return invalid('Il programma di riferimento non esiste più');
      index = reference + 1;
    }
  } else {
    const start = placement.startFrames;
    if (!Number.isInteger(start) || start < 0 || start >= FRAMES_PER_DAY) {
      return invalid("L'orario di inizio deve essere compreso nella giornata");
    }
    const overlapping = findOverlappingAnchor(programs, start, start + command.durationFrames);
    if (overlapping) {
      return invalid(`Si sovrappone al programma a orario fisso "${overlapping.title}"`);
    }
    index = anchorInsertionIndex(programs, start);
  }

  const next = [...programs];
  next.splice(index, 0, program);
  return { programs: next, result: { status: 'ok', program } };
}

function findOverlappingAnchor(programs: readonly Program[], start: Frames, end: Frames): Program | undefined {
  return programs.find((p) => {
    if (p.fixedStartFrames === null) return false;
    const otherEnd = p.fixedStartFrames + p.durationFrames;
    return start < otherEnd && p.fixedStartFrames < end;
  });
}

/** Un'ancora va dopo tutti i programmi che iniziano prima del suo orario */
function anchorInsertionIndex(programs: readonly Program[], start: Frames): number {
  const starts = computeSchedule(programs)
    .rows.filter((row) => row.kind === 'program')
    .map((row) => row.start);
  const index = starts.findIndex((s) => s >= start);
  return index === -1 ? programs.length : index;
}
