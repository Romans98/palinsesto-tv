import { useEffect, useRef, type MouseEvent } from 'react';
import type { Overflow, OverflowTarget, ProgramRow as ProgramRowData } from '../domain/schedule';
import { formatTimecode } from '../domain/timecode';
import { DurationEditor } from './DurationEditor';
import { formatUpdatedAt, formatUpdatedAtFull } from './formatUpdatedAt';
import { AlertIcon, LockIcon, TrashIcon } from './icons';
import styles from './ScheduleTable.module.css';

type Props = {
  row: ProgramRowData;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onTruncate: () => void;
  onDelete: () => void;
};

const targetLabel = (target: OverflowTarget) =>
  target.kind === 'anchor' ? `«${target.title}»` : 'la fine della giornata';

const overflowLabel = (overflow: Overflow) =>
  overflow.startsAfterLimit
    ? `Dopo l'inizio di ${targetLabel(overflow.against)}`
    : `Sfora ${targetLabel(overflow.against)} di ${formatTimecode(overflow.amount)}`;

/** Esegue l'azione senza attivare anche la selezione della riga */
const withoutSelecting = (action: () => void) => (event: MouseEvent) => {
  event.stopPropagation();
  action();
};

export function ProgramRow({
  row,
  isSelected,
  isEditing,
  onSelect,
  onStartEditing,
  onStopEditing,
  onTruncate,
  onDelete,
}: Props) {
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
    overflow || row.incomingOverflow ? styles.overflow : '',
    isSelected ? styles.selected : '',
  ].join(' ');

  return (
    <tr ref={rowRef} className={classes} onClick={onSelect} aria-selected={isSelected}>
      <td className={`${styles.time} ${anchor ? styles.fixedTime : ''}`}>
        <span className={styles.timeContent}>
          <span className={styles.lockSlot} title={anchor ? 'Orario fisso' : undefined}>
            {anchor && <LockIcon size={12} />}
          </span>
          <span
            className={overflow?.startsAfterLimit ? styles.impossibleTime : undefined}
            title={overflow?.startsAfterLimit ? 'Orario non realizzabile' : undefined}
          >
            {formatTimecode(row.start)}
          </span>
        </span>
      </td>
      <td className={styles.time}>
        {isEditing ? (
          <DurationEditor program={program} onClose={onStopEditing} />
        ) : (
          <button
            type="button"
            className={styles.durationButton}
            onClick={withoutSelecting(onStartEditing)}
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

          {row.incomingOverflow !== null && (
            <span className={`${styles.badge} ${styles.badgeDanger}`}>
              <AlertIcon size={12} />I programmi precedenti sforano di {formatTimecode(row.incomingOverflow)}
            </span>
          )}

          {overflow && (
            <span className={`${styles.badge} ${styles.badgeDanger}`}>
              <AlertIcon size={12} />
              {overflowLabel(overflow)}
            </span>
          )}

          {overflow?.isLast && (
            <button
              type="button"
              className={styles.truncateButton}
              disabled={row.truncateTo === null}
              title={
                row.truncateTo === null
                  ? `Sforamento totale di ${formatTimecode(overflow.total)}: troncare questo programma non basta, accorcia o elimina anche altri programmi`
                  : `Riduci la durata a ${formatTimecode(row.truncateTo)}`
              }
              onClick={withoutSelecting(onTruncate)}
            >
              Tronca
            </button>
          )}
        </div>
      </td>
      <td className={styles.author}>{program.updatedBy}</td>
      <td className={`${styles.time} ${styles.author}`} title={formatUpdatedAtFull(program.updatedAt)}>
        {formatUpdatedAt(program.updatedAt)}
      </td>
      <td className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={withoutSelecting(onDelete)}
          title={`Elimina «${program.title}»`}
          aria-label={`Elimina ${program.title}`}
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
}
