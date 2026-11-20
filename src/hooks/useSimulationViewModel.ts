import { useState } from 'react';
import { useAppServices } from '../app/services';
import type { ProgramRow } from '../domain/schedule';
import { FRAMES_PER_MINUTE } from '../domain/timecode';

const STEP = 2 * FRAMES_PER_MINUTE;
const PROMO_DURATION = FRAMES_PER_MINUTE;

type Outcome = { status: string };

/** ViewModel del pannello "Strumenti demo": fa agire l'utente simulato sulla riga selezionata */
export function useSimulationViewModel(target: ProgramRow | undefined) {
  const { simulatedUser } = useAppServices();
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);

  const run = async (description: string, action: () => Promise<Outcome>) => {
    setLastOutcome(`${simulatedUser.name}: ${description}…`);
    const result = await action();
    setLastOutcome(
      result.status === 'ok'
        ? `${simulatedUser.name}: ${description} ✓`
        : result.status === 'conflict'
          ? `${simulatedUser.name}: ${description} rifiutato, i dati erano cambiati nel frattempo (conflitto)`
          : `${simulatedUser.name}: ${description} non riuscito (${result.status})`,
    );
  };

  const id = target?.program.id;

  return {
    userName: simulatedUser.name,
    target,
    lastOutcome,
    extend: () => id && void run('allunga di 2 minuti', () => simulatedUser.changeDuration(id, STEP)),
    shorten: () => id && void run('accorcia di 2 minuti', () => simulatedUser.changeDuration(id, -STEP)),
    remove: () => id && void run('elimina il programma', () => simulatedUser.deleteProgram(id)),
    addPromo: () => id && void run('aggiunge una promo', () => simulatedUser.addProgram('Promo', PROMO_DURATION, id)),
  };
}
