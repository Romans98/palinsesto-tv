const timeFormat = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const dateTimeFormat = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const fullFormat = new Intl.DateTimeFormat('it-IT', { dateStyle: 'full', timeStyle: 'medium' });

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Istante dell'ultima modifica in forma compatta: solo l'ora se è oggi, altrimenti anche la data */
export function formatUpdatedAt(timestamp: number, now: number = Date.now()): string {
  const date = new Date(timestamp);
  return sameDay(date, new Date(now)) ? timeFormat.format(date) : dateTimeFormat.format(date);
}

/** Istante completo, per il tooltip */
export function formatUpdatedAtFull(timestamp: number): string {
  return fullFormat.format(new Date(timestamp));
}
