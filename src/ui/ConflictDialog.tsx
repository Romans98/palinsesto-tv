import { formatTimecode } from '../domain/timecode';
import type { DurationConflict } from '../hooks/useEditDurationViewModel';
import styles from './ConflictDialog.module.css';
import { formatUpdatedAt } from './formatUpdatedAt';
import { Modal } from './Modal';
import modal from './Modal.module.css';

type Props = {
  programTitle: string;
  conflict: DurationConflict;
  saving: boolean;
  onKeepMine: () => void;
  onKeepTheirs: () => void;
};

export function ConflictDialog({ programTitle, conflict, saving, onKeepMine, onKeepTheirs }: Props) {
  const { original, mine, theirs } = conflict;

  return (
    <Modal title="Modifica in conflitto" tone="warning" width={480} onCancel={onKeepTheirs}>
      <div className={modal.body}>
        <p className={modal.text}>
          Mentre modificavi la durata di <strong>«{programTitle}»</strong>, {theirs.updatedBy} l'ha cambiata a sua volta.
          Scegli quale valore tenere.
        </p>

        <table className={styles.values}>
          <tbody>
            <tr>
              <th>Quando hai iniziato</th>
              <td>{formatTimecode(original)}</td>
            </tr>
            <tr className={styles.mine}>
              <th>Il tuo valore</th>
              <td>{formatTimecode(mine)}</td>
            </tr>
            <tr className={styles.theirs}>
              <th>
                Valore di {theirs.updatedBy}
                <span className={styles.when}> · alle {formatUpdatedAt(theirs.updatedAt)}</span>
              </th>
              <td>{formatTimecode(theirs.durationFrames)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer className={modal.footer}>
        <button type="button" className={modal.secondary} onClick={onKeepTheirs} disabled={saving}>
          Tieni il suo
        </button>
        <button type="button" className={modal.primary} onClick={onKeepMine} disabled={saving} autoFocus>
          {saving ? 'Salvataggio…' : 'Usa il mio'}
        </button>
      </footer>
    </Modal>
  );
}
