import { useState } from 'react';
import { useAppServices } from '../app/services';
import type { OverflowTarget, ProgramRow } from '../domain/schedule';
import type { Frames } from '../domain/timecode';

export type TruncateProposal = {
  programId: string;
  title: string;
  version: number;
  start: Frames;
  currentDuration: Frames;
  newDuration: Frames;
  against: OverflowTarget;
};

/**
 * ViewModel della conferma "Tronca all'ancora".
 * La proposta viene fissata all'apertura: se nel frattempo qualcuno modifica il programma,
 * la conferma viene bloccata invece di applicare un calcolo fatto su dati vecchi.
 *
 * @param liveRow la riga del programma aggiornata in tempo reale
 */
export function useTruncateViewModel(liveRow: ProgramRow | undefined, onClose: () => void) {
  const { repository, currentUser } = useAppServices();

  const [proposal] = useState<TruncateProposal | null>(() =>
    liveRow && liveRow.overflow && liveRow.truncateTo !== null
      ? {
          programId: liveRow.program.id,
          title: liveRow.program.title,
          version: liveRow.program.version,
          start: liveRow.start,
          currentDuration: liveRow.program.durationFrames,
          newDuration: liveRow.truncateTo,
          against: liveRow.overflow.against,
        }
      : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changedMeanwhile =
    proposal !== null && (liveRow === undefined || liveRow.program.version !== proposal.version)
      ? (liveRow?.program.updatedBy ?? 'Un altro utente')
      : null;

  const confirm = async () => {
    if (!proposal || changedMeanwhile || saving) return;
    setSaving(true);
    const result = await repository.updateDuration({
      programId: proposal.programId,
      durationFrames: proposal.newDuration,
      expectedVersion: proposal.version,
      user: currentUser,
    });
    setSaving(false);

    switch (result.status) {
      case 'ok':
        onClose();
        return;
      case 'conflict':
        setError(`${result.current.updatedBy} ha modificato il programma nel frattempo. Controlla il palinsesto aggiornato.`);
        return;
      case 'invalid':
        setError(result.error);
        return;
      case 'notFound':
        setError('Il programma non esiste più');
        return;
    }
  };

  return {
    proposal,
    /** Nome di chi ha modificato il programma dopo l'apertura della conferma */
    changedMeanwhile,
    error,
    saving,
    canConfirm: proposal !== null && changedMeanwhile === null && !saving,
    confirm: () => void confirm(),
    cancel: () => {
      if (!saving) onClose();
    },
  };
}
