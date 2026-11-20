import type { ScheduleRow } from '../domain/schedule';
import { AdBreakRow } from './AdBreakRow';
import { ProgramRow } from './ProgramRow';
import styles from './ScheduleTable.module.css';

type Props = {
  rows: ScheduleRow[];
  selectedId: string | null;
  editingId: string | null;
  onSelect: (programId: string) => void;
  onStartEditing: (programId: string) => void;
  onStopEditing: () => void;
};

export function ScheduleTable({ rows, selectedId, editingId, onSelect, onStartEditing, onStopEditing }: Props) {
  return (
    <table className={styles.table}>
      <colgroup>
        <col className={styles.colTime} />
        <col className={styles.colTime} />
        <col className={styles.colTime} />
        <col />
        <col className={styles.colAuthor} />
        <col className={styles.colUpdatedAt} />
      </colgroup>
      <thead>
        <tr>
          <th>Inizio</th>
          <th>Durata</th>
          <th>Fine</th>
          <th>Titolo</th>
          <th>Modificato da</th>
          <th>Modificato alle</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) =>
          row.kind === 'adBreak' ? (
            <AdBreakRow key={row.id} row={row} />
          ) : (
            <ProgramRow
              key={row.program.id}
              row={row}
              isSelected={row.program.id === selectedId}
              isEditing={row.program.id === editingId}
              onSelect={() => onSelect(row.program.id)}
              onStartEditing={() => onStartEditing(row.program.id)}
              onStopEditing={onStopEditing}
            />
          ),
        )}
      </tbody>
    </table>
  );
}
