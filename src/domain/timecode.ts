/**
 * Timecode a 25 FPS (standard PAL/EBU), formato `HH:MM:SS:FF`.
 *
 * Internamente ogni durata e ogni orario è un numero intero di frame:
 * - nessun errore di arrotondamento (niente float);
 * - l'aritmetica è una somma di interi;
 * - la stringa `HH:MM:SS:FF` esiste solo ai bordi (visualizzazione e input).
 *
 * A 25 FPS non esiste il "drop-frame" (riguarda solo i 29,97 FPS NTSC).
 */

/** Numero intero di frame. Alias per rendere esplicito il significato nei tipi. */
export type Frames = number;

export const FPS = 25;
export const FRAMES_PER_SECOND: Frames = FPS;
export const FRAMES_PER_MINUTE: Frames = 60 * FRAMES_PER_SECOND;
export const FRAMES_PER_HOUR: Frames = 60 * FRAMES_PER_MINUTE;
export const FRAMES_PER_DAY: Frames = 24 * FRAMES_PER_HOUR;

/** Durata minima di un programma: 1 frame */
export const MIN_DURATION: Frames = 1;
/** Durata massima di un programma: l'intera giornata */
export const MAX_DURATION: Frames = FRAMES_PER_DAY;

/** Esito di un'operazione che può fallire */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Costruisce un numero di frame a partire dalle singole componenti */
export function fromParts(hours: number, minutes: number, seconds: number, frames: number): Frames {
  return hours * FRAMES_PER_HOUR + minutes * FRAMES_PER_MINUTE + seconds * FRAMES_PER_SECOND + frames;
}

/** Converte un numero di frame in `HH:MM:SS:FF` */
export function formatTimecode(total: Frames): string {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`Numero di frame non valido: ${total}`);
  }
  const hours = Math.floor(total / FRAMES_PER_HOUR);
  const minutes = Math.floor((total % FRAMES_PER_HOUR) / FRAMES_PER_MINUTE);
  const seconds = Math.floor((total % FRAMES_PER_MINUTE) / FRAMES_PER_SECOND);
  const frames = total % FRAMES_PER_SECOND;
  return [hours, minutes, seconds, frames].map((n) => String(n).padStart(2, '0')).join(':');
}

const TIMECODE_PATTERN = /^(\d{2}):(\d{2}):(\d{2}):(\d{2})$/;

/**
 * Converte `HH:MM:SS:FF` in frame, verificando solo il formato
 * (minuti e secondi 0–59, frame 0–24). I limiti di dominio sono in `validateDuration`.
 */
export function parseTimecode(input: string): Result<Frames> {
  const match = TIMECODE_PATTERN.exec(input.trim());
  if (!match) {
    return { ok: false, error: 'Formato atteso HH:MM:SS:FF' };
  }
  const [hours, minutes, seconds, frames] = match.slice(1).map(Number);
  if (minutes > 59) return { ok: false, error: 'I minuti devono essere tra 00 e 59' };
  if (seconds > 59) return { ok: false, error: 'I secondi devono essere tra 00 e 59' };
  if (frames >= FPS) return { ok: false, error: `I frame devono essere tra 00 e ${FPS - 1}` };
  return { ok: true, value: fromParts(hours, minutes, seconds, frames) };
}

/** Verifica che una durata rispetti i limiti di dominio */
export function validateDuration(duration: Frames): Result<Frames> {
  if (duration < MIN_DURATION) {
    return { ok: false, error: 'La durata minima è 00:00:00:01' };
  }
  if (duration > MAX_DURATION) {
    return { ok: false, error: `La durata massima è ${formatTimecode(MAX_DURATION)}` };
  }
  return { ok: true, value: duration };
}

/** Parse e validazione in un solo passaggio: è quello che usa il campo di input della durata */
export function parseDuration(input: string): Result<Frames> {
  const parsed = parseTimecode(input);
  return parsed.ok ? validateDuration(parsed.value) : parsed;
}
