import { useScheduleViewModel } from '../hooks/useScheduleViewModel';
import { ScheduleHeader } from './ScheduleHeader';
import styles from './ScheduleScreen.module.css';
import { ScheduleTable } from './ScheduleTable';
import { ScheduleToolbar } from './ScheduleToolbar';

export function ScheduleScreen() {
  const vm = useScheduleViewModel();

  return (
    <div className={styles.screen}>
      <ScheduleHeader currentUser={vm.currentUser} onResetDemo={vm.resetDemo} />
      <main className={styles.content}>
        <ScheduleToolbar issues={vm.issues} />
        <div className={styles.grid}>
          <ScheduleTable
            rows={vm.rows}
            selectedId={vm.selectedId}
            editingId={vm.editingId}
            onSelect={vm.select}
            onStartEditing={vm.startEditing}
            onStopEditing={vm.stopEditing}
          />
        </div>
      </main>
    </div>
  );
}
