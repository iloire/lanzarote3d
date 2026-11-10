/** `date` as 'MM-DD' on Lanzarote, so the day turns over at the island's midnight for everyone */
export function islandDay(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Atlantic/Canary',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part('month')}-${part('day')}`;
}
