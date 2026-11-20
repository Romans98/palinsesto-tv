import { useEffect, useRef, useState } from 'react';
import { detectRemoteChanges, type RemoteChange } from '../domain/remoteChanges';
import type { Program } from '../domain/types';

/** Per quanto tempo una riga modificata da altri resta evidenziata */
const HIGHLIGHT_MS = 2500;
/** Per quanto tempo resta visibile una notifica */
const NOTIFICATION_MS = 5000;
const MAX_NOTIFICATIONS = 3;

export type ChangeNotification = {
  id: number;
  text: string;
};

let nextToken = 0;

function describe(changes: RemoteChange[], editingId: string | null): string {
  if (changes.length > 1) {
    return `Palinsesto aggiornato da altri utenti: ${changes.length} modifiche`;
  }
  const [change] = changes;
  const { program } = change;
  switch (change.kind) {
    case 'updated':
      return `${program.updatedBy} ha modificato «${program.title}»`;
    case 'added':
      return `${program.updatedBy} ha aggiunto «${program.title}»`;
    case 'deleted':
      return program.id === editingId
        ? `«${program.title}», che stavi modificando, è stato eliminato da un altro utente`
        : `«${program.title}» è stato eliminato da un altro utente`;
  }
}

/**
 * Feedback sulle modifiche fatte da altri utenti:
 * evidenzia per qualche secondo le righe cambiate e mostra una notifica (utile soprattutto
 * per le eliminazioni, che non hanno più una riga da evidenziare).
 *
 * @param ownDeletionId programma che l'utente corrente sta eliminando, da non notificare
 * @param editingId programma che l'utente corrente sta modificando
 */
export function useRemoteChangesFeedback(
  programs: readonly Program[],
  currentUser: string,
  ownDeletionId: string | null,
  editingId: string | null,
) {
  const previous = useRef(programs);
  // Valori letti quando arrivano nuovi dati: non devono far ripartire il confronto quando cambiano da soli
  const context = useRef({ currentUser, ownDeletionId, editingId });
  useEffect(() => {
    context.current = { currentUser, ownDeletionId, editingId };
  });
  const [highlighted, setHighlighted] = useState<ReadonlyMap<string, number>>(new Map());
  const [notifications, setNotifications] = useState<ChangeNotification[]>([]);

  useEffect(() => {
    const { currentUser, ownDeletionId, editingId } = context.current;
    const changes = detectRemoteChanges(
      previous.current,
      programs,
      currentUser,
      new Set(ownDeletionId ? [ownDeletionId] : []),
    );
    previous.current = programs;
    if (changes.length === 0) return;

    const token = ++nextToken;
    setHighlighted((current) => {
      const next = new Map(current);
      for (const change of changes) {
        if (change.kind !== 'deleted') next.set(change.program.id, token);
      }
      return next;
    });
    setNotifications((current) => [...current, { id: token, text: describe(changes, editingId) }].slice(-MAX_NOTIFICATIONS));

    // Allo scadere si rimuovono solo gli elementi di questo aggiornamento: una modifica successiva alla stessa riga ne prolunga l'evidenziazione
    setTimeout(() => {
      setHighlighted((current) => new Map([...current].filter(([, t]) => t !== token)));
    }, HIGHLIGHT_MS);
    setTimeout(() => {
      setNotifications((current) => current.filter((n) => n.id !== token));
    }, NOTIFICATION_MS);
  }, [programs]);

  return {
    highlightedIds: highlighted,
    notifications,
    dismissNotification: (id: number) => setNotifications((current) => current.filter((n) => n.id !== id)),
  };
}
