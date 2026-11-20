import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

type Props = {
  title: string;
  /** Chiamata con Esc */
  onCancel: () => void;
  tone?: 'default' | 'warning';
  width?: number;
  children: ReactNode;
};

/**
 * Finestra modale basata sull'elemento `<dialog>` nativo:
 * sfondo oscurato, focus confinato nella finestra ed Esc sono gestiti dal browser.
 * Viene montata direttamente nel `body` (portal), così non eredita gli stili del punto in cui è usata
 * (es. una cella della tabella). Gli eventi di un portal risalgono comunque l'albero dei componenti React:
 * i clic vengono fermati qui per non attivare, ad esempio, la selezione della riga sottostante.
 * Il contenuto usa le classi `body` e `footer` di `Modal.module.css`.
 */
export function Modal({ title, onCancel, tone = 'default', width = 440, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${tone === 'warning' ? styles.warning : ''}`}
      style={{ width }}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => event.stopPropagation()}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <h2 id={titleId}>{title}</h2>
      </header>
      {children}
    </dialog>,
    document.body,
  );
}
