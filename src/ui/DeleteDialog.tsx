import type { ProgramRow } from '../domain/schedule';
import { formatTimecode } from '../domain/timecode';
import { useDeleteViewModel } from '../hooks/useDeleteViewModel';
import { Modal } from './Modal';
import modal from './Modal.module.css';

type Props = {
  liveRow: ProgramRow | undefined;
  onClose: (deleted: boolean) => void;
};

export function DeleteDialog({ liveRow, onClose }: Props) {
  const vm = useDeleteViewModel(liveRow, onClose);
  const { proposal } = vm;

  return (
    <Modal title={proposal ? `Elimina «${proposal.title}»` : 'Elimina programma'} onCancel={vm.cancel}>
      <div className={modal.body}>
        {proposal && (
          <p className={modal.text}>
            {proposal.isAnchor ? (
              <>
                È un programma a <strong>orario fisso</strong>: eliminandolo, i programmi che lo seguono partiranno dalla
                fine del programma precedente.
              </>
            ) : (
              <>
                I programmi successivi, fino al prossimo programma a orario fisso, si anticiperanno di{' '}
                <strong>{formatTimecode(proposal.duration)}</strong> e la pubblicità prima di quel programma aumenterà.
              </>
            )}
          </p>
        )}

        {vm.changedBy && (
          <p className={modal.notice} role="status">
            {vm.changedBy} ha modificato questo programma dopo l'apertura della finestra: chiudi e ricontrolla il
            palinsesto aggiornato.
          </p>
        )}
        {vm.deletedMeanwhile && (
          <p className={modal.notice} role="status">
            Il programma è già stato eliminato da un altro utente.
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
          <button type="button" className={modal.danger} onClick={vm.confirm} disabled={!vm.canConfirm} autoFocus>
            {vm.saving ? 'Eliminazione…' : 'Elimina'}
          </button>
        )}
      </footer>
    </Modal>
  );
}
