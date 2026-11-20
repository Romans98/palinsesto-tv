import type { StorageLike } from './FakeScheduleServer';

const SESSION_KEY = 'palinsesto-tv/user';
const COUNTER_KEY = 'palinsesto-tv/user-counter';

/** Prossimo nome utente libero ("Utente Test 1", "Utente Test 2", …), condiviso tra tutte le tab */
export function nextUserName(shared: StorageLike): string {
  const next = Number(shared.getItem(COUNTER_KEY) ?? '0') + 1;
  shared.setItem(COUNTER_KEY, String(next));
  return `Utente Test ${next}`;
}

/**
 * Nome dell'utente di questa tab.
 * Resta lo stesso se si ricarica la pagina (sessionStorage), cambia aprendo una nuova tab.
 */
export function currentUserName(session: StorageLike, shared: StorageLike): string {
  const existing = session.getItem(SESSION_KEY);
  if (existing !== null) return existing;
  const name = nextUserName(shared);
  session.setItem(SESSION_KEY, name);
  return name;
}
