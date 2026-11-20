import type { ChangeNotification } from '../hooks/useRemoteChangesFeedback';
import { InfoIcon } from './icons';
import styles from './Notifications.module.css';

type Props = {
  notifications: ChangeNotification[];
  onDismiss: (id: number) => void;
};

export function Notifications({ notifications, onDismiss }: Props) {
  return (
    <div className={styles.stack} aria-live="polite">
      {notifications.map((notification) => (
        <div key={notification.id} className={styles.notification} role="status">
          <InfoIcon className={styles.icon} />
          <span className={styles.text}>{notification.text}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => onDismiss(notification.id)}
            aria-label="Chiudi notifica"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
