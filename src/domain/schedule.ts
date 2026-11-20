import { FRAMES_PER_DAY, FRAMES_PER_MINUTE, MIN_DURATION, type Frames } from './timecode';
import type { Program } from './types';

/** Oltre questa durata un blocco pubblicitario viene segnalato come troppo lungo */
export const MAX_AD_BREAK: Frames = 12 * FRAMES_PER_MINUTE;

/** Ancora il cui orario viene invaso dai programmi precedenti */
export type OverflowTarget = { programId: string; title: string };

/** Coinvolgimento di un programma in uno sforamento */
export type Overflow = {
  against: OverflowTarget;
  /** Di quanto la fine di questo programma supera il limite */
  amount: Frames;
  /** Il programma inizia già oltre il limite: il suo orario non è realizzabile */
  startsAfterLimit: boolean;
  /** È l'ultimo programma prima del limite: è lì che si propone "Tronca" */
  isLast: boolean;
  /** Sforamento complessivo del segmento, cioè di quanto bisogna accorciare in totale */
  total: Frames;
};

export type ProgramRow = {
  kind: 'program';
  program: Program;
  start: Frames;
  end: Frames;
  overflow: Overflow | null;
  /** Durata che elimina lo sforamento troncando solo questo programma; `null` se non basta o non serve */
  truncateTo: Frames | null;
  /** Solo per le ancore: di quanto i programmi precedenti invadono il suo orario */
  incomingOverflow: Frames | null;
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
  /** Numero di ancore invase, non di righe coinvolte */
  overflows: number;
  longAdBreaks: number;
};

export type Schedule = {
  rows: ScheduleRow[];
  issues: ScheduleIssues;
};

/**
 * Calcola il palinsesto a partire dalla lista ordinata dei programmi.
 * Il tempo è espresso in frame dalle 00:00 del primo giorno: il palinsesto può estendersi su più giorni.
 *
 * Regole:
 * - un flottante inizia dove finisce il programma precedente (il primo alle 00:00 del primo giorno);
 * - un'ancora inizia sempre al suo orario fisso, qualunque cosa la preceda;
 * - lo spazio libero prima di un'ancora diventa un blocco pubblicitario;
 * - se i programmi di un segmento (quelli tra due ancore) finiscono dopo l'inizio dell'ancora successiva,
 *   l'ancora segnala lo sforamento complessivo e ogni programma che supera il suo orario viene segnalato.
 *   L'ancora non si sposta, quindi ciò che viene dopo non è influenzato;
 * - lo spazio prima del primo programma è fuori palinsesto, non pubblicità.
 *
 * Si assume che le ancore compaiano nella lista in ordine crescente di orario.
 */
export function computeSchedule(programs: readonly Program[]): Schedule {
  const rows: ScheduleRow[] = [];
  let segment: ProgramRow[] = [];
  let cursor: Frames | null = null;
  let overflows = 0;

  for (const program of programs) {
    let start: Frames;
    let incomingOverflow: Frames | null = null;

    if (program.fixedStartFrames !== null) {
      start = program.fixedStartFrames;
      if (cursor !== null && segment.length > 0) {
        if (cursor < start) {
          rows.push(adBreak(program.id, cursor, start));
        } else if (cursor > start) {
          incomingOverflow = cursor - start;
          overflows++;
          markOverflow(segment, start, { programId: program.id, title: program.title });
        }
      }
      segment = [];
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
      incomingOverflow,
    };
    rows.push(row);
    segment.push(row);
    cursor = row.end;
  }

  return { rows, issues: { overflows, longAdBreaks: countLongAdBreaks(rows) } };
}

export type ScheduleDay = {
  /** 0 = primo giorno del palinsesto */
  index: number;
  rows: ScheduleRow[];
};

/** Giorno del palinsesto (0 = primo) in cui cade un istante */
export const dayIndexOf = (frames: Frames): number => Math.floor(frames / FRAMES_PER_DAY);

/** Raggruppa le righe per giorno: ogni riga appartiene al giorno in cui inizia */
export function groupByDay(rows: readonly ScheduleRow[]): ScheduleDay[] {
  const days: ScheduleDay[] = [];
  for (const row of rows) {
    const index = dayIndexOf(row.start);
    const current = days[days.length - 1];
    if (current && current.index === index) current.rows.push(row);
    else days.push({ index, rows: [row] });
  }
  return days;
}

function adBreak(anchorId: string, start: Frames, end: Frames): AdBreakRow {
  const duration = end - start;
  return { kind: 'adBreak', id: `ad-before-${anchorId}`, start, end, duration, isLong: duration > MAX_AD_BREAK };
}

/** Segnala tutti i programmi del segmento che finiscono oltre `limit` */
function markOverflow(segment: ProgramRow[], limit: Frames, against: OverflowTarget): void {
  const last = segment[segment.length - 1];
  const total = last.end - limit;

  for (const row of segment) {
    if (row.end <= limit) continue;
    row.overflow = {
      against,
      amount: row.end - limit,
      startsAfterLimit: row.start >= limit,
      isLast: row === last,
      total,
    };
  }

  const truncated = last.program.durationFrames - total;
  last.truncateTo = truncated >= MIN_DURATION ? truncated : null;
}

function countLongAdBreaks(rows: readonly ScheduleRow[]): number {
  return rows.filter((row) => row.kind === 'adBreak' && row.isLong).length;
}
