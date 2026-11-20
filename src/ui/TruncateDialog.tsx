import type { ProgramRow } from '../domain/schedule';
import { formatTimecode } from '../domain/timecode';
import { useTruncateViewModel } from '../hooks/useTruncateViewModel';
import { formatEnd } from './formatTimeOfDay';
import { Modal } from './Modal';
import modal from './Modal.module.css';
import styles from './TruncateDialog.module.css';

type Props = {
  liveRow: ProgramRow | undefined;
  onClose: () => void;
};

export function TruncateDialog({ liveRow, onClose }: Props) {
  const vm = useTruncateViewModel(liveRow, onClose);
  const { proposal } = vm;

  return (
    <Modal title={proposal ? `Tronca «${proposal.title}»` : 'Tronca'} onCancel={vm.cancel}>
      <div className={modal.body}>
        {proposal ? (
          <>
            <table className={styles.values}>
              <tbody>
                <tr>
                  <th>Durata attuale</th>
                  <td>{formatTimecode(proposal.currentDuration)}</td>
                </tr>
                <tr className={styles.highlight}>
                  <th>Nuova durata</th>
                  <td>{formatTimecode(proposal.newDuration)}</td>
                </tr>
                <tr>
                  <th>Taglio</th>
                  <td>−{formatTimecode(proposal.currentDuration - proposal.newDuration)}</td>
                </tr>
                <tr>
                  <th>Terminerà alle</th>
                  <td>{formatEnd(proposal.start, proposal.start + proposal.newDuration).text}</td>
                </tr>
                <tr>
                  <th>Limite</th>
                  <td className={styles.target}>inizio di «{proposal.against.title}»</td>
                </tr>
              </tbody>
            </table>
            <p className={modal.text}>Troncare significa tagliare la parte finale del programma.</p>
          </>
        ) : (
          <p className={modal.text}>Non c'è più nessuno sforamento da risolvere.</p>
        )}

        {vm.changedMeanwhile && (
          <p className={modal.notice} role="status">
            {vm.changedMeanwhile} ha modificato questo programma dopo l'apertura della finestra: chiudi e ricontrolla il
            palinsesto aggiornato.
          </p>
        )}
        {vm.error && (
          <p className={modal.error} role="alert">
            {vm.error}
          </p>
        )}
      </div>

      <footer className={modal.footer}>
        <button type="button" className={modal.secondary} onClick={vm.cancel} disabled={vm.saving}>
          {vm.canConfirm ? 'Annulla' : 'Chiudi'}
        </button>
        {proposal && (
          <button type="button" className={modal.primary} onClick={vm.confirm} disabled={!vm.canConfirm} autoFocus>
            {vm.saving ? 'Salvataggio…' : 'Tronca'}
          </button>
        )}
      </footer>
    </Modal>
  );
}
