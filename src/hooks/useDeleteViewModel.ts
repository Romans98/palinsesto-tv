import { useState } from 'react';
import { useAppServices } from '../app/services';
import type { ProgramRow } from '../domain/schedule';
import type { Frames } from '../domain/timecode';

export type DeleteProposal = {
  programId: string;
  title: string;
  version: number;
  duration: Frames;
  isAnchor: boolean;
};

/**
 * ViewModel della conferma di eliminazione.
 * Come per "Tronca", la richiesta viene fissata all'apertura: se nel frattempo il programma cambia,
 * l'eliminazione si blocca invece di cancellare qualcosa che l'utente non ha visto.
 *
 * @param liveRow la riga del programma aggiornata in tempo reale
 * @param onClose chiamata alla chiusura, con `true` se il programma è stato eliminato
 */
export function useDeleteViewModel(liveRow: ProgramRow | undefined, onClose: (deleted: boolean) => void) {
  const { repository, currentUser } = useAppServices();

  const [proposal] = useState<DeleteProposal | null>(() =>
    liveRow
      ? {
          programId: liveRow.program.id,
          title: liveRow.program.title,
          version: liveRow.program.version,
          duration: liveRow.program.durationFrames,
          isAnchor: liveRow.program.fixedStartFrames !== null,
        }
      : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletedMeanwhile = proposal !== null && liveRow === undefined;
  const changedBy =
    proposal !== null && liveRow !== undefined && liveRow.program.version !== proposal.version
      ? liveRow.program.updatedBy
      : null;

  const confirm = async () => {
    if (!proposal || changedBy || deletedMeanwhile || saving) return;
    setSaving(true);
    const result = await repository.deleteProgram({
      programId: proposal.programId,
      expectedVersion: proposal.version,
      user: currentUser,
    });
    setSaving(false);

    switch (result.status) {
      case 'ok':
        onClose(true);
        return;
      case 'conflict':
        setError(`${result.current.updatedBy} ha modificato il programma nel frattempo. Controlla il palinsesto aggiornato.`);
        return;
      case 'notFound':
        setError('Il programma è già stato eliminato da un altro utente.');
        return;
    }
  };

  return {
    proposal,
    changedBy,
    deletedMeanwhile,
    error,
    saving,
    canConfirm: proposal !== null && changedBy === null && !deletedMeanwhile && !saving,
    confirm: () => void confirm(),
    cancel: () => {
      if (!saving) onClose(false);
    },
  };
}
