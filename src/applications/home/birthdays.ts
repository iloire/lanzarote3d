import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';

/** Each pilot's birthday as 'MM-DD', no year; leave a pilot out to keep theirs quiet */
export const BIRTHDAYS: Partial<Record<CharacterType, string>> = {
  [CharacterType.LUC]: '10-28',
};

/** The query parameter that throws a pilot's birthday today, to preview it: ?birthday=luc */
export const BIRTHDAY_PARAM = 'birthday';

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

/** The pilots whose birthday it is on `date`, or the one `search` names with ?birthday= */
export function birthdayPilots(date: Date, search = '', birthdays = BIRTHDAYS): CharacterType[] {
  const asked = new URLSearchParams(search).get(BIRTHDAY_PARAM)?.trim().toLowerCase();
  const pilots = Object.values(CharacterType);
  if (asked) return pilots.filter(pilot => pilot === asked);
  const today = islandDay(date);
  return pilots.filter(pilot => birthdays[pilot] === today);
}
