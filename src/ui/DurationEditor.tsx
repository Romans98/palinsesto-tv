import { formatTimecode } from '../domain/timecode';
import type { Program } from '../domain/types';
import { useEditDurationViewModel } from '../hooks/useEditDurationViewModel';
import { ConflictDialog } from './ConflictDialog';
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

  const message = (() => {
    if (vm.status === 'saving' && !vm.conflict) return <span className={styles.hint}>Salvataggio…</span>;
    if (vm.status !== 'editing') return null;
    if (vm.error !== null) return <span className={styles.error}>{vm.error}</span>;
    if (vm.remoteChange) {
      return (
        <span className={styles.notice} role="status">
          <strong>{vm.remoteChange.by}</strong> ha appena cambiato la durata in{' '}
          <strong>{formatTimecode(vm.remoteChange.newDuration)}</strong>.
          <br />
          Se salvi ti verrà chiesto quale valore tenere.
        </span>
      );
    }
    return <span className={styles.hint}>Invio salva · Esc annulla</span>;
  })();

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
      {message}

      {vm.conflict && (
        <ConflictDialog
          programTitle={program.title}
          conflict={vm.conflict}
          saving={vm.status === 'saving'}
          onKeepMine={vm.keepMine}
          onKeepTheirs={vm.keepTheirs}
        />
      )}
    </div>
  );
}
