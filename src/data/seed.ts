import { FRAMES_PER_DAY, fromParts, type Frames } from '../domain/timecode';
import type { Program } from '../domain/types';

const tc = (h: number, m: number, s = 0, f = 0): Frames => fromParts(h, m, s, f);

type SeedEntry = [title: string, duration: Frames, fixedStart?: Frames];

/** Programmazione diurna, dalle 06:00 alle 24:00 (orari delle ancore relativi al giorno) */
const DAYTIME: SeedEntry[] = [
  ['Notiziario del Mattino', tc(0, 30), tc(6, 0)],
  ['Buongiorno a Tutti', tc(2, 0)],
  ['Meteo', tc(0, 4, 50, 12)],
  ['Cartoni Animati', tc(0, 20)],
  ['Rassegna Stampa', tc(0, 30), tc(9, 0)],
  ['Documentario Natura', tc(1, 0)],
  ['Telefilm', tc(0, 44, 37, 12)],
  ['Cucina con Noi', tc(0, 40)],
  ['Telegiornale', tc(0, 30), tc(12, 0)],
  ['Talk Show', tc(1, 30)],
  ['Soap Opera', tc(0, 30)],
  ['Film del Pomeriggio', tc(1, 45)],
  ['Rubrica Salute', tc(0, 30)],
  ['Gioco a Premi', tc(1, 10)],
  ['Attualità', tc(1, 10)],
  ['Quiz Show', tc(0, 49, 30, 0)],
  ['Telegiornale della Sera', tc(0, 30), tc(20, 0)],
  ['Film di Prima Serata', tc(2, 0)],
  ['Approfondimento', tc(0, 55)],
  ['Telegiornale della Notte', tc(0, 20), tc(23, 30)],
  ['Sport Replay', tc(0, 10)],
];

/** Programmazione notturna, dalle 00:00 alle 05:55 circa: il canale trasmette 24 ore su 24 */
const NIGHT: SeedEntry[] = [
  ['Film della Notte', tc(1, 50)],
  ['Repliche', tc(2, 0)],
  ['Musica nella Notte', tc(2, 5)],
];

const shiftToDay = (entries: SeedEntry[], day: number): SeedEntry[] =>
  entries.map(([title, duration, fixedStart]) => [
    title,
    duration,
    fixedStart === undefined ? undefined : day * FRAMES_PER_DAY + fixedStart,
  ]);

const ENTRIES: SeedEntry[] = [...shiftToDay(DAYTIME, 0), ...NIGHT, ...shiftToDay(DAYTIME, 1)];

/** Palinsesto dimostrativo di due giorni consecutivi, dalle 06:00 del primo alle 24:00 del secondo */
export function createSeedPrograms(now: number = 0): Program[] {
  return ENTRIES.map(([title, duration, fixedStart], index) => ({
    id: `seed-${index + 1}`,
    title,
    durationFrames: duration,
    fixedStartFrames: fixedStart ?? null,
    version: 1,
    updatedBy: 'Sistema',
    updatedAt: now,
  }));
}
