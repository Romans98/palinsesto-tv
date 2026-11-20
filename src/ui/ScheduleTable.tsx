import type { ScheduleRow } from '../domain/schedule';
import { AdBreakRow } from './AdBreakRow';
import { ProgramRow } from './ProgramRow';
import styles from './ScheduleTable.module.css';

type Props = {
  rows: ScheduleRow[];
  selectedId: string | null;
  highlightedIds: ReadonlyMap<string, number>;
  editingId: string | null;
  onSelect: (programId: string) => void;
  onStartEditing: (programId: string) => void;
  onStopEditing: () => void;
  onTruncate: (programId: string) => void;
  onDelete: (programId: string) => void;
};

export function ScheduleTable({
  rows,
  selectedId,
  highlightedIds,
  editingId,
  onSelect,
  onStartEditing,
  onStopEditing,
  onTruncate,
  onDelete,
}: Props) {
  return (
    <table className={styles.table}>
      <colgroup>
        <col className={styles.colTime} />
        <col className={styles.colTime} />
        <col className={styles.colTime} />
        <col />
        <col className={styles.colAuthor} />
        <col className={styles.colUpdatedAt} />
        <col className={styles.colActions} />
      </colgroup>
      <thead>
        <tr>
          <th>Inizio</th>
          <th>Durata</th>
          <th>Fine</th>
          <th>Titolo</th>
          <th>Modificato da</th>
          <th>Modificato alle</th>
          <th aria-label="Azioni" />
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
              isHighlighted={highlightedIds.has(row.program.id)}
              isEditing={row.program.id === editingId}
              onSelect={() => onSelect(row.program.id)}
              onStartEditing={() => onStartEditing(row.program.id)}
              onStopEditing={onStopEditing}
              onTruncate={() => onTruncate(row.program.id)}
              onDelete={() => onDelete(row.program.id)}
            />
          ),
        )}
      </tbody>
    </table>
  );
}
