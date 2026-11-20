import type { StorageLike } from './FakeScheduleServer';

const COUNTER_KEY = 'palinsesto-tv/user-counter';
export const CURRENT_USER_KEY = 'palinsesto-tv/user';
export const SIMULATED_USER_KEY = 'palinsesto-tv/simulated-user';

/** Prossimo nome utente libero ("Utente Test 1", "Utente Test 2", …), condiviso tra tutte le tab */
export function nextUserName(shared: StorageLike): string {
  const next = Number(shared.getItem(COUNTER_KEY) ?? '0') + 1;
  shared.setItem(COUNTER_KEY, String(next));
  return `Utente Test ${next}`;
}

/**
 * Nome utente legato alla tab.
 * Resta lo stesso se si ricarica la pagina (sessionStorage), cambia aprendo una nuova tab.
 */
export function sessionUserName(session: StorageLike, shared: StorageLike, key: string = CURRENT_USER_KEY): string {
  const existing = session.getItem(key);
  if (existing !== null) return existing;
  const name = nextUserName(shared);
  session.setItem(key, name);
  return name;
}
