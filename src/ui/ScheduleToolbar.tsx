import type { ScheduleIssues } from '../domain/schedule';
import { AlertIcon, CheckIcon, InfoIcon, LockIcon } from './icons';
import styles from './ScheduleToolbar.module.css';

export function ScheduleToolbar({ issues }: { issues: ScheduleIssues }) {
  const clean = issues.overflows === 0 && issues.longAdBreaks === 0;

  return (
    <div className={styles.toolbar}>
      <div className={styles.issues} aria-live="polite">
        {clean && (
          <span className={`${styles.pill} ${styles.ok}`}>
            <CheckIcon size={12} /> Nessun problema
          </span>
        )}
        {issues.overflows > 0 && (
          <span className={`${styles.pill} ${styles.danger}`}>
            <AlertIcon size={12} /> {issues.overflows} {issues.overflows === 1 ? 'sforamento' : 'sforamenti'}
          </span>
        )}
        {issues.longAdBreaks > 0 && (
          <span className={`${styles.pill} ${styles.warning}`}>
            <InfoIcon size={12} /> {issues.longAdBreaks}{' '}
            {issues.longAdBreaks === 1 ? 'blocco pubblicitario lungo' : 'blocchi pubblicitari lunghi'}
          </span>
        )}
      </div>

      <div className={styles.legend}>
        <span>
          <LockIcon size={12} /> Orario fisso
        </span>
        <span>
          <span className={styles.adSwatch} /> Pubblicità (calcolata)
        </span>
        <span>Timecode a 25 fps</span>
      </div>
    </div>
  );
}
