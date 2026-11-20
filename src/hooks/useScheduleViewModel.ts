import { useMemo, useState, useSyncExternalStore } from 'react';
import { useAppServices } from '../app/services';
import { computeSchedule } from '../domain/schedule';

/** ViewModel della schermata del palinsesto */
export function useScheduleViewModel() {
  const { repository, currentUser } = useAppServices();

  // Si ridisegna ogni volta che il repository notifica un cambiamento (anche da altre tab)
  const programs = useSyncExternalStore(repository.subscribe, repository.getSnapshot);
  const schedule = useMemo(() => computeSchedule(programs), [programs]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Una sola riga alla volta può essere in modifica
  const [editingId, setEditingId] = useState<string | null>(null);

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
    resetDemo: () => {
      setEditingId(null);
      repository.reset();
    },
  };
}
