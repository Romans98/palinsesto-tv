import { useMemo, useState, useSyncExternalStore } from 'react';
import { useAppServices } from '../app/services';
import { computeSchedule, type ProgramRow } from '../domain/schedule';
import type { InsertionPoint } from './useAddProgramViewModel';

/** ViewModel della schermata del palinsesto */
export function useScheduleViewModel() {
  const { repository, currentUser } = useAppServices();

  // Si ridisegna ogni volta che il repository notifica un cambiamento (anche da altre tab)
  const programs = useSyncExternalStore(repository.subscribe, repository.getSnapshot);
  const schedule = useMemo(() => computeSchedule(programs), [programs]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Una sola riga alla volta può essere in modifica
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Un nuovo flottante va dopo la riga selezionata; senza selezione, in coda al palinsesto
  const programRows = schedule.rows.filter((row): row is ProgramRow => row.kind === 'program');
  const anchorRow = programRows.find((row) => row.program.id === selectedId) ?? programRows.at(-1);
  const insertAfter: InsertionPoint | null = anchorRow
    ? { programId: anchorRow.program.id, title: anchorRow.program.title, end: anchorRow.end }
    : null;

  return {
    rows: schedule.rows,
    issues: schedule.issues,
    currentUser,
    selectedId,
    select: setSelectedId,

    editingId,
    startEditing: (programId: string) => {
      setSelectedId(programId);
      setEditingId(programId);
    },
    stopEditing: () => setEditingId(null),

    isAdding,
    insertAfter,
    startAdding: () => {
      setEditingId(null);
      setIsAdding(true);
    },
    /** Chiude la finestra di aggiunta; se è stato creato un programma lo seleziona */
    finishAdding: (createdId: string | null) => {
      setIsAdding(false);
      if (createdId) setSelectedId(createdId);
    },

    resetDemo: () => {
      setEditingId(null);
      setSelectedId(null);
      repository.reset();
    },
  };
}
