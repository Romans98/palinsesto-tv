import { dayIndexOf } from '../domain/schedule';
import { FRAMES_PER_DAY, formatTimecode, type Frames } from '../domain/timecode';

export type TimeOfDay = {
  text: string;
  /** L'orario cade nel giorno successivo a quello in cui inizia il programma */
  nextDay: boolean;
};

/** Ora del giorno `HH:MM:SS:FF` di un istante del palinsesto (il giorno è indicato dall'intestazione) */
export function formatStart(start: Frames): TimeOfDay {
  return { text: formatTimecode(start % FRAMES_PER_DAY), nextDay: false };
}

/**
 * Ora di fine, relativa al giorno in cui il programma inizia.
 * Se cade oltre la mezzanotte viene riportata al giorno successivo (`nextDay`);
 * le 24:00:00:00 restano valide come fine esatta del giorno.
 */
export function formatEnd(start: Frames, end: Frames): TimeOfDay {
  const sinceDayStart = end - dayIndexOf(start) * FRAMES_PER_DAY;
  return sinceDayStart > FRAMES_PER_DAY
    ? { text: formatTimecode(sinceDayStart - FRAMES_PER_DAY), nextDay: true }
    : { text: formatTimecode(sinceDayStart), nextDay: false };
}

const dayFormat = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

/** Etichetta di un giorno del palinsesto: il primo giorno è quello in cui si apre la demo */
export function formatDayLabel(dayIndex: number, firstDay: Date = new Date()): string {
  const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + dayIndex);
  return `Giorno ${dayIndex + 1} · ${dayFormat.format(date)}`;
}
