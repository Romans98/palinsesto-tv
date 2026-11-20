import { useState, type MouseEvent, type ReactNode } from 'react';
import type { ProgramRow } from '../domain/schedule';
import { useSimulationViewModel } from '../hooks/useSimulationViewModel';
import styles from './SimulationPanel.module.css';

/**
 * Un clic sui pulsanti del pannello non deve togliere il focus al campo in modifica:
 * così si può far agire l'utente simulato mentre si sta modificando una durata.
 */
const keepFocus = (event: MouseEvent) => event.preventDefault();

function ActionButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <button type="button" className={styles.button} onMouseDown={keepFocus} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function SimulationPanel({ target }: { target: ProgramRow | undefined }) {
  const vm = useSimulationViewModel(target);
  const [open, setOpen] = useState(true);
  const disabled = vm.target === undefined;

  return (
    <section className={styles.panel} aria-label="Strumenti demo">
      <button
        type="button"
        className={styles.toggle}
        onMouseDown={keepFocus}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
        Strumenti demo
        <span className={styles.subtitle}>simula un altro utente in questa tab</span>
      </button>

      {open && (
        <div className={styles.content}>
          <div className={styles.group}>
            <span className={styles.label}>
              {vm.userName} agisce su:{' '}
              <strong>{vm.target ? `«${vm.target.program.title}»` : 'seleziona una riga'}</strong>
            </span>
            <div className={styles.buttons}>
              <ActionButton onClick={vm.extend} disabled={disabled}>
                +2 min
              </ActionButton>
              <ActionButton onClick={vm.shorten} disabled={disabled}>
                −2 min
              </ActionButton>
              <ActionButton onClick={vm.addPromo} disabled={disabled}>
                Aggiungi promo dopo
              </ActionButton>
              <ActionButton onClick={vm.remove} disabled={disabled}>
                Elimina
              </ActionButton>
            </div>
          </div>

          <p className={styles.outcome} aria-live="polite">
            {vm.lastOutcome ?? 'Suggerimento: apri la modifica di una durata e fai agire l\'utente simulato sullo stesso programma.'}
          </p>
        </div>
      )}
    </section>
  );
}
