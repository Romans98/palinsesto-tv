import { useState } from 'react';
import { useAppServices } from '../app/services';
import { formatTimecode, parseDuration, type Frames } from '../domain/timecode';
import type { Program } from '../domain/types';

export type EditStatus = 'editing' | 'saving' | 'conflict';

export type DurationConflict = {
  /** Durata quando ho iniziato a modificare */
  original: Frames;
  /** Durata che ho provato a salvare */
  mine: Frames;
  /** Versione attuale sul server, modificata da un altro utente */
  theirs: Program;
};

export type RemoteChange = {
  by: string;
  newDuration: Frames;
};

/**
 * ViewModel di una sessione di modifica della durata.
 * Vive solo mentre la riga è in modifica: alla chiusura il suo stato viene scartato.
 *
 * @param program lo stato attuale del programma, aggiornato in tempo reale
 * @param onClose chiamata quando la sessione termina (salvataggio riuscito o annullamento)
 */
export function useEditDurationViewModel(program: Program, onClose: () => void) {
  const { repository, currentUser } = useAppServices();

  // Versione e durata su cui l'utente ha iniziato a lavorare
  const [base] = useState(() => ({ version: program.version, duration: program.durationFrames }));
  const [draft, setDraftState] = useState(() => formatTimecode(program.durationFrames));
  const [status, setStatus] = useState<EditStatus>('editing');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<DurationConflict | null>(null);

  const parsed = parseDuration(draft);
  const validationError = parsed.ok ? null : parsed.error;

  // Il programma è stato modificato da qualcun altro dopo l'apertura della modifica
  const remoteChange: RemoteChange | null =
    program.version !== base.version && program.updatedBy !== currentUser
      ? { by: program.updatedBy, newDuration: program.durationFrames }
      : null;

  const setDraft = (value: string) => {
    setDraftState(value);
    setSubmitError(null);
  };

  const submit = async (durationFrames: Frames, expectedVersion: number) => {
    setStatus('saving');
    setSubmitError(null);
    const result = await repository.updateDuration({
      programId: program.id,
      durationFrames,
      expectedVersion,
      user: currentUser,
    });
    switch (result.status) {
      case 'ok':
        onClose();
        return;
      case 'conflict':
        setConflict({ original: base.duration, mine: durationFrames, theirs: result.current });
        setStatus('conflict');
        return;
      case 'invalid':
        setConflict(null);
        setSubmitError(result.error);
        setStatus('editing');
        return;
      case 'notFound':
        setConflict(null);
        setSubmitError('Il programma non esiste più');
        setStatus('editing');
        return;
    }
  };

  return {
    draft,
    setDraft,
    error: submitError ?? validationError,
    status,
    remoteChange,
    conflict,

    save: () => {
      if (!parsed.ok || status !== 'editing') return;
      // Nessuna modifica: si chiude senza disturbare il server
      if (parsed.value === base.duration && program.version === base.version) {
        onClose();
        return;
      }
      void submit(parsed.value, base.version);
    },

    cancel: () => {
      if (status !== 'saving') onClose();
    },

    /** Il campo ha perso il focus: equivale ad annullare, ma solo mentre si sta ancora scrivendo */
    focusLost: () => {
      if (status === 'editing') onClose();
    },

    /** Conflitto: ripropone il mio valore sopra la versione aggiornata, dopo aver visto quella dell'altro */
    keepMine: () => {
      if (conflict) void submit(conflict.mine, conflict.theirs.version);
    },

    /** Conflitto: accetta il valore dell'altro utente */
    keepTheirs: () => onClose(),
  };
}
