import type { Program } from './types';

export type RemoteChange =
  | { kind: 'updated'; program: Program }
  | { kind: 'added'; program: Program }
  | { kind: 'deleted'; program: Program };

/**
 * Confronta due versioni del palinsesto e restituisce le modifiche fatte da altri utenti.
 * Una modifica è "di altri" se la versione del programma è cresciuta (o il programma è nuovo)
 * e l'autore dell'ultima modifica non è `currentUser`.
 * Per le eliminazioni l'autore non è noto: vengono riportate tutte quelle non fatte da `currentUser`,
 * che le conosce già perché le ha appena chieste lui (vedi `ownDeletions`).
 */
export function detectRemoteChanges(
  previous: readonly Program[],
  next: readonly Program[],
  currentUser: string,
  ownDeletions: ReadonlySet<string> = new Set(),
): RemoteChange[] {
  const before = new Map(previous.map((p) => [p.id, p]));
  const after = new Set(next.map((p) => p.id));
  const changes: RemoteChange[] = [];

  for (const program of next) {
    const old = before.get(program.id);
    if (program.updatedBy === currentUser) continue;
    if (!old) changes.push({ kind: 'added', program });
    else if (program.version > old.version) changes.push({ kind: 'updated', program });
  }

  for (const program of previous) {
    if (!after.has(program.id) && !ownDeletions.has(program.id)) {
      changes.push({ kind: 'deleted', program });
    }
  }

  return changes;
}
