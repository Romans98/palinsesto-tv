import { FRAMES_PER_DAY, FRAMES_PER_MINUTE, MIN_DURATION, type Frames } from './timecode';
import type { Program } from './types';

/** Oltre questa durata un blocco pubblicitario viene segnalato come troppo lungo */
export const MAX_AD_BREAK: Frames = 12 * FRAMES_PER_MINUTE;

/** Ciò che viene invaso da un programma troppo lungo */
export type OverflowTarget =
  | { kind: 'anchor'; programId: string; title: string }
  | { kind: 'endOfDay' };

export type Overflow = {
  amount: Frames;
  against: OverflowTarget;
};

export type ProgramRow = {
  kind: 'program';
  program: Program;
  start: Frames;
  end: Frames;
  overflow: Overflow | null;
  /** Durata che elimina lo sforamento; `null` se non c'è sforamento o se non basta troncare */
  truncateTo: Frames | null;
};

export type AdBreakRow = {
  kind: 'adBreak';
  /** Chiave stabile: un blocco pubblicitario esiste sempre prima di una specifica ancora */
  id: string;
  start: Frames;
  end: Frames;
  duration: Frames;
  isLong: boolean;
};

export type ScheduleRow = ProgramRow | AdBreakRow;

export type ScheduleIssues = {
  overflows: number;
  longAdBreaks: number;
};

export type Schedule = {
  rows: ScheduleRow[];
  issues: ScheduleIssues;
};

/**
 * Calcola il palinsesto a partire dalla lista ordinata dei programmi.
 *
 * Regole:
 * - un flottante inizia dove finisce il programma precedente (il primo alle 00:00);
 * - un'ancora inizia sempre al suo orario fisso, qualunque cosa la preceda;
 * - lo spazio libero prima di un'ancora diventa un blocco pubblicitario;
 * - se il programma precedente finisce dopo l'inizio dell'ancora, quel programma sfora.
 *   L'ancora non si sposta, quindi ciò che viene dopo non è influenzato;
 * - lo spazio prima del primo programma è fuori palinsesto, non pubblicità.
 *
 * Si assume che le ancore compaiano nella lista in ordine crescente di orario.
 */
export function computeSchedule(programs: readonly Program[]): Schedule {
  const rows: ScheduleRow[] = [];
  let cursor: Frames | null = null;
  let previous: ProgramRow | null = null;

  for (const program of programs) {
    let start: Frames;

    if (program.fixedStartFrames !== null) {
      start = program.fixedStartFrames;
      if (cursor !== null && previous !== null) {
        if (cursor < start) {
          rows.push(adBreak(program.id, cursor, start));
        } else if (cursor > start) {
          markOverflow(previous, cursor - start, {
            kind: 'anchor',
            programId: program.id,
            title: program.title,
          });
        }
      }
    } else {
      start = cursor ?? 0;
    }

    const row: ProgramRow = {
      kind: 'program',
      program,
      start,
      end: start + program.durationFrames,
      overflow: null,
      truncateTo: null,
    };
    rows.push(row);
    cursor = row.end;
    previous = row;
  }

  if (previous !== null && previous.end > FRAMES_PER_DAY) {
    markOverflow(previous, previous.end - FRAMES_PER_DAY, { kind: 'endOfDay' });
  }

  return { rows, issues: countIssues(rows) };
}

function adBreak(anchorId: string, start: Frames, end: Frames): AdBreakRow {
  const duration = end - start;
  return { kind: 'adBreak', id: `ad-before-${anchorId}`, start, end, duration, isLong: duration > MAX_AD_BREAK };
}

function markOverflow(row: ProgramRow, amount: Frames, against: OverflowTarget): void {
  row.overflow = { amount, against };
  const truncated = row.program.durationFrames - amount;
  row.truncateTo = truncated >= MIN_DURATION ? truncated : null;
}

function countIssues(rows: readonly ScheduleRow[]): ScheduleIssues {
  let overflows = 0;
  let longAdBreaks = 0;
  for (const row of rows) {
    if (row.kind === 'program' && row.overflow !== null) overflows++;
    if (row.kind === 'adBreak' && row.isLong) longAdBreaks++;
  }
  return { overflows, longAdBreaks };
}
