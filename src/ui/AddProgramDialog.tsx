import type { FormEvent } from 'react';
import { formatTimecode } from '../domain/timecode';
import { useAddProgramViewModel, type InsertionPoint } from '../hooks/useAddProgramViewModel';
import styles from './AddProgramDialog.module.css';
import { Modal } from './Modal';
import modal from './Modal.module.css';
import { TimecodeInput } from './TimecodeInput';

type Props = {
  insertAfter: InsertionPoint | null;
  onDone: (createdId: string | null) => void;
};

export function AddProgramDialog({ insertAfter, onDone }: Props) {
  const vm = useAddProgramViewModel(insertAfter, onDone);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    vm.submit();
  };

  return (
    <Modal title="Aggiungi programma" onCancel={vm.cancel}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={modal.body}>
          <label className={styles.field}>
            <span className={styles.label}>Titolo</span>
            <input
              className={`${styles.textInput} ${vm.errors.title ? styles.invalid : ''}`}
              value={vm.title}
              onChange={(event) => vm.setTitle(event.target.value)}
              autoFocus
              disabled={vm.saving}
            />
            {vm.errors.title && <span className={styles.error}>{vm.errors.title}</span>}
          </label>

          <div className={styles.field}>
            <span className={styles.label}>Durata</span>
            <TimecodeInput
              label="Durata"
              value={vm.duration}
              onChange={vm.setDuration}
              onEnter={vm.submit}
              onEscape={vm.cancel}
              invalid={vm.errors.duration !== null}
              disabled={vm.saving}
              autoFocus={false}
            />
            {vm.errors.duration && <span className={styles.error}>{vm.errors.duration}</span>}
          </div>

          <fieldset className={styles.field} disabled={vm.saving}>
            <legend className={styles.label}>Posizione</legend>

            <label className={styles.option}>
              <input
                type="radio"
                name="kind"
                checked={vm.kind === 'floating'}
                onChange={() => vm.setKind('floating')}
              />
              <span>
                <span className={styles.optionTitle}>Flottante</span>
                <span className={styles.optionHint}>
                  {vm.insertAfter ? (
                    <>
                      Dopo «{vm.insertAfter.title}», inizio previsto alle {formatTimecode(vm.insertAfter.end)}. Si sposta
                      se cambia la durata dei programmi precedenti.
                    </>
                  ) : (
                    'In cima al palinsesto.'
                  )}
                </span>
              </span>
            </label>

            <label className={styles.option}>
              <input type="radio" name="kind" checked={vm.kind === 'fixed'} onChange={() => vm.setKind('fixed')} />
              <span>
                <span className={styles.optionTitle}>A orario fisso</span>
                <span className={styles.optionHint}>Inizia sempre all'orario indicato e non viene mai spostato.</span>
              </span>
            </label>

            {vm.kind === 'fixed' && (
              <div className={styles.startField}>
                <span className={styles.label}>Inizio</span>
                <TimecodeInput
                  label="Orario di inizio"
                  value={vm.start}
                  onChange={vm.setStart}
                  onEnter={vm.submit}
                  onEscape={vm.cancel}
                  invalid={vm.errors.start !== null}
                  disabled={vm.saving}
                  autoFocus={false}
                />
                {vm.errors.start && <span className={styles.error}>{vm.errors.start}</span>}
              </div>
            )}
          </fieldset>

          {vm.submitError && (
            <p className={modal.error} role="alert">
              {vm.submitError}
            </p>
          )}
        </div>

        <footer className={modal.footer}>
          <button type="button" className={modal.secondary} onClick={vm.cancel} disabled={vm.saving}>
            Annulla
          </button>
          <button type="submit" className={modal.primary} disabled={vm.saving}>
            {vm.saving ? 'Aggiunta…' : 'Aggiungi'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
