import type { AdBreakRow as AdBreakRowData } from '../domain/schedule';
import { MAX_AD_BREAK } from '../domain/schedule';
import { formatTimecode, FRAMES_PER_MINUTE } from '../domain/timecode';
import { InfoIcon } from './icons';
import styles from './ScheduleTable.module.css';

export function AdBreakRow({ row }: { row: AdBreakRowData }) {
  return (
    <tr className={`${styles.row} ${styles.adBreak} ${row.isLong ? styles.adBreakLong : ''}`}>
      <td className={styles.time}>
        <span className={styles.timeContent}>
          <span className={styles.lockSlot} />
          {formatTimecode(row.start)}
        </span>
      </td>
      <td className={styles.time}>{formatTimecode(row.duration)}</td>
      <td className={styles.time}>{formatTimecode(row.end)}</td>
      <td>
        <div className={styles.title}>
          <span className={styles.adBreakLabel}>Pubblicità</span>
          {row.isLong && (
            <span className={`${styles.badge} ${styles.badgeWarning}`}>
              <InfoIcon size={12} />
              Oltre {MAX_AD_BREAK / FRAMES_PER_MINUTE} minuti
            </span>
          )}
        </div>
      </td>
      <td />
      <td />
    </tr>
  );
}
