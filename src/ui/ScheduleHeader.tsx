import { ResetIcon, UserIcon } from './icons';
import styles from './ScheduleHeader.module.css';

type Props = {
  currentUser: string;
  onResetDemo: () => void;
};

const today = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

export function ScheduleHeader({ currentUser, onResetDemo }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.context}>
        <span className={styles.product}>Palinsesto</span>
        <span className={styles.separator} />
        <span className={styles.channel}>Canale 1</span>
        <span className={styles.date}>{today}</span>
      </div>

      <div className={styles.actions}>
        <span className={styles.user} title="Utente di questa sessione">
          <UserIcon />
          {currentUser}
        </span>
        <button type="button" className={styles.button} onClick={onResetDemo}>
          <ResetIcon />
          Ripristina demo
        </button>
      </div>
    </header>
  );
}
