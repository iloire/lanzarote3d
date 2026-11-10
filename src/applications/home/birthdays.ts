import { CharacterType } from '../../foundation/components/characters/CharacterRegistry';
import { islandDay } from '../../foundation/utils/islandDay';

export { islandDay };

/** Each pilot's birthday as 'MM-DD', no year; leave a pilot out to keep theirs quiet */
export const BIRTHDAYS: Partial<Record<CharacterType, string>> = {
  [CharacterType.MIGUEL]: '01-23',
  [CharacterType.DANIEL]: '06-13',
  [CharacterType.FABIO]: '06-24',
  [CharacterType.JEHOSUA]: '06-24',
  [CharacterType.ROOS]: '08-24',
  [CharacterType.LUC]: '10-28',
};

/** The query parameter that throws a pilot's birthday today, to preview it: ?birthday=luc */
export const BIRTHDAY_PARAM = 'birthday';

/** The pilots whose birthday it is on `date`, or the one `search` names with ?birthday= */
export function birthdayPilots(date: Date, search = '', birthdays = BIRTHDAYS): CharacterType[] {
  const asked = new URLSearchParams(search).get(BIRTHDAY_PARAM)?.trim().toLowerCase();
  const pilots = Object.values(CharacterType);
  if (asked) return pilots.filter(pilot => pilot === asked);
  const today = islandDay(date);
  return pilots.filter(pilot => birthdays[pilot] === today);
}
