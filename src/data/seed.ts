import { fromParts, type Frames } from '../domain/timecode';
import type { Program } from '../domain/types';

const tc = (h: number, m: number, s = 0, f = 0): Frames => fromParts(h, m, s, f);

type SeedEntry = [title: string, duration: Frames, fixedStart?: Frames];

const ENTRIES: SeedEntry[] = [
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

/** Palinsesto dimostrativo di una giornata, dalle 06:00 alle 24:00 */
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
