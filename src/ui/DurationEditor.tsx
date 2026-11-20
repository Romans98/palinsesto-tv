import { formatTimecode } from '../domain/timecode';
import type { Program } from '../domain/types';
import { useEditDurationViewModel } from '../hooks/useEditDurationViewModel';
import styles from './DurationEditor.module.css';
import { TimecodeInput } from './TimecodeInput';

type Props = {
  program: Program;
  onClose: () => void;
};

export function DurationEditor({ program, onClose }: Props) {
  const vm = useEditDurationViewModel(program, onClose);

  const handleBlur = () => {
    // Se è l'intera finestra a perdere il focus (es. si passa a un'altra tab) la modifica resta aperta
    if (document.hasFocus()) vm.focusLost();
  };

  return (
    <div className={styles.editor}>
      <TimecodeInput
        label={`Durata di ${program.title}`}
        value={vm.draft}
        onChange={vm.setDraft}
        onEnter={vm.save}
        onEscape={vm.cancel}
        onBlur={handleBlur}
        invalid={vm.error !== null}
        disabled={vm.status !== 'editing'}
      />
      {vm.status === 'saving' && <span className={styles.hint}>Salvataggio…</span>}
      {vm.status === 'editing' && vm.error === null && <span className={styles.hint}>Invio salva · Esc annulla</span>}
      {vm.error !== null && <span className={styles.error}>{vm.error}</span>}

      {vm.conflict && (
        <div className={styles.conflict} role="alert">
          <span>
            {vm.conflict.theirs.updatedBy} l'ha appena cambiata in{' '}
            <strong>{formatTimecode(vm.conflict.theirs.durationFrames)}</strong>
          </span>
          <div className={styles.conflictActions}>
            <button type="button" className={styles.primary} onClick={vm.keepMine}>
              Usa la mia ({formatTimecode(vm.conflict.mine)})
            </button>
            <button type="button" className={styles.secondary} onClick={vm.keepTheirs}>
              Tieni la sua
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
