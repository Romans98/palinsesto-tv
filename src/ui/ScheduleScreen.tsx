import { useScheduleViewModel } from '../hooks/useScheduleViewModel';
import { AddProgramDialog } from './AddProgramDialog';
import { DeleteDialog } from './DeleteDialog';
import { Notifications } from './Notifications';
import { ScheduleHeader } from './ScheduleHeader';
import styles from './ScheduleScreen.module.css';
import { ScheduleTable } from './ScheduleTable';
import { ScheduleToolbar } from './ScheduleToolbar';
import { SimulationPanel } from './SimulationPanel';
import { TruncateDialog } from './TruncateDialog';

export function ScheduleScreen() {
  const vm = useScheduleViewModel();

  return (
    <div className={styles.screen}>
      <ScheduleHeader currentUser={vm.currentUser} onResetDemo={vm.resetDemo} />
      <main className={styles.content}>
        <ScheduleToolbar issues={vm.issues} onAdd={vm.startAdding} />
        <div className={styles.grid}>
          <ScheduleTable
            rows={vm.rows}
            selectedId={vm.selectedId}
            highlightedIds={vm.highlightedIds}
            editingId={vm.editingId}
            onSelect={vm.toggleSelection}
            onStartEditing={vm.startEditing}
            onStopEditing={vm.stopEditing}
            onTruncate={vm.startTruncating}
            onDelete={vm.startDeleting}
          />
        </div>
      </main>
      <SimulationPanel target={vm.selectedRow} />
      <Notifications notifications={vm.notifications} onDismiss={vm.dismissNotification} />
      {vm.isAdding && <AddProgramDialog insertAfter={vm.insertAfter} dayCount={vm.dayCount} onDone={vm.finishAdding} />}
      {vm.truncating && <TruncateDialog liveRow={vm.truncating.row} onClose={vm.finishTruncating} />}
      {vm.deleting && <DeleteDialog liveRow={vm.deleting.row} onClose={vm.finishDeleting} />}
    </div>
  );
}
