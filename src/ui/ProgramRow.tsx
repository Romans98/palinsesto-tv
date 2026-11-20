import { useEffect, useRef } from 'react';
import type { OverflowTarget, ProgramRow as ProgramRowData } from '../domain/schedule';
import { formatTimecode } from '../domain/timecode';
import { DurationEditor } from './DurationEditor';
import { formatUpdatedAt, formatUpdatedAtFull } from './formatUpdatedAt';
import { AlertIcon, LockIcon } from './icons';
import styles from './ScheduleTable.module.css';

type Props = {
  row: ProgramRowData;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartEditing: () => void;
  onStopEditing: () => void;
};

const overflowTargetLabel = (target: OverflowTarget) =>
  target.kind === 'anchor' ? `«${target.title}»` : 'la fine della giornata';

export function ProgramRow({ row, isSelected, isEditing, onSelect, onStartEditing, onStopEditing }: Props) {
  const { program, overflow } = row;
  const anchor = program.fixedStartFrames !== null;
  const rowRef = useRef<HTMLTableRowElement>(null);

  // Una riga selezionata (es. un programma appena aggiunto) deve essere visibile
  useEffect(() => {
    if (isSelected) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isSelected]);

  const classes = [
    styles.row,
    anchor ? styles.anchor : '',
    overflow ? styles.overflow : '',
    isSelected ? styles.selected : '',
  ].join(' ');

  return (
    <tr ref={rowRef} className={classes} onClick={onSelect} aria-selected={isSelected}>
      <td className={`${styles.time} ${anchor ? styles.fixedTime : ''}`}>
        <span className={styles.timeContent}>
          <span className={styles.lockSlot} title={anchor ? 'Orario fisso' : undefined}>
            {anchor && <LockIcon size={12} />}
          </span>
          {formatTimecode(row.start)}
        </span>
      </td>
      <td className={styles.time}>
        {isEditing ? (
          <DurationEditor program={program} onClose={onStopEditing} />
        ) : (
          <button
            type="button"
            className={styles.durationButton}
            onClick={(event) => {
              event.stopPropagation();
              onStartEditing();
            }}
            title="Modifica la durata"
          >
            {formatTimecode(program.durationFrames)}
          </button>
        )}
      </td>
      <td className={styles.time}>{formatTimecode(row.end)}</td>
      <td>
        <div className={styles.title}>
          <span className={styles.titleText}>{program.title}</span>
          {overflow && (
            <span className={`${styles.badge} ${styles.badgeDanger}`}>
              <AlertIcon size={12} />
              Sfora {overflowTargetLabel(overflow.against)} di {formatTimecode(overflow.amount)}
            </span>
          )}
        </div>
      </td>
      <td className={styles.author}>{program.updatedBy}</td>
      <td className={`${styles.time} ${styles.author}`} title={formatUpdatedAtFull(program.updatedAt)}>
        {formatUpdatedAt(program.updatedAt)}
      </td>
    </tr>
  );
}
