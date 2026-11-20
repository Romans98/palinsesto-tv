import { useState } from 'react';
import { useAppServices } from '../app/services';
import type { Placement } from '../domain/commands';
import { formatTimecode, FRAMES_PER_DAY, parseDuration, parseTimecode, type Frames, type Result } from '../domain/timecode';

/** Programma dopo il quale verrà inserito un nuovo programma flottante */
export type InsertionPoint = {
  programId: string;
  title: string;
  end: Frames;
};

export type ProgramKind = 'floating' | 'fixed';

const DEFAULT_DURATION = '00:30:00:00';

function parseStart(input: string): Result<Frames> {
  const parsed = parseTimecode(input);
  if (!parsed.ok) return parsed;
  if (parsed.value >= FRAMES_PER_DAY) return { ok: false, error: "L'orario deve essere compreso nella giornata" };
  return parsed;
}

/**
 * ViewModel della finestra "Aggiungi programma".
 * Vive solo mentre la finestra è aperta.
 *
 * @param insertAfter programma dopo cui inserire un flottante (`null` se il palinsesto è vuoto)
 * @param onDone chiamata alla chiusura, con l'id del programma creato se l'aggiunta è riuscita
 */
export function useAddProgramViewModel(insertAfter: InsertionPoint | null, onDone: (createdId: string | null) => void) {
  const { repository, currentUser } = useAppServices();

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [kind, setKind] = useState<ProgramKind>('floating');
  const [start, setStart] = useState(() =>
    formatTimecode(insertAfter && insertAfter.end < FRAMES_PER_DAY ? insertAfter.end : 0),
  );
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsedDuration = parseDuration(duration);
  const parsedStart = parseStart(start);

  const errors = {
    title: title.trim() === '' ? 'Il titolo è obbligatorio' : null,
    duration: parsedDuration.ok ? null : parsedDuration.error,
    start: kind === 'fixed' && !parsedStart.ok ? parsedStart.error : null,
  };
  const valid = errors.title === null && errors.duration === null && errors.start === null;

  const clearSubmitError = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setSubmitError(null);
  };

  const submit = async () => {
    setAttempted(true);
    if (!valid || saving || !parsedDuration.ok) return;

    const placement: Placement =
      kind === 'fixed' && parsedStart.ok
        ? { kind: 'fixed', startFrames: parsedStart.value }
        : { kind: 'after', programId: insertAfter?.programId ?? null };

    setSaving(true);
    const result = await repository.addProgram({
      title,
      durationFrames: parsedDuration.value,
      placement,
      user: currentUser,
    });
    setSaving(false);

    if (result.status === 'ok') onDone(result.program.id);
    else setSubmitError(result.error);
  };

  return {
    title,
    setTitle: clearSubmitError(setTitle),
    duration,
    setDuration: clearSubmitError(setDuration),
    kind,
    setKind: clearSubmitError(setKind),
    start,
    setStart: clearSubmitError(setStart),
    insertAfter,
    /** Gli errori di compilazione si mostrano solo dopo il primo tentativo di conferma */
    errors: attempted ? errors : { title: null, duration: errors.duration, start: errors.start },
    submitError,
    saving,
    submit: () => void submit(),
    cancel: () => {
      if (!saving) onDone(null);
    },
  };
}
