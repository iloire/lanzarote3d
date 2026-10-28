import { birthdayPilots, islandDay } from '../../src/applications/home/birthdays';
import { CharacterType } from '../../src/foundation/components/characters/CharacterRegistry';

const birthdays = { [CharacterType.LUC]: '10-28', [CharacterType.MAGNE]: '03-01' };

test('the day turns over at midnight on Lanzarote, not in UTC', () => {
  // 23:30 UTC on 27 Oct is 23:30 on the island (winter time, UTC+0)
  expect(islandDay(new Date('2026-10-27T23:30:00Z'))).toBe('10-27');
  // 23:30 UTC on 27 Jul is already 00:30 on the 28th (summer time, UTC+1)
  expect(islandDay(new Date('2026-07-27T23:30:00Z'))).toBe('07-28');
});

test('finds whose birthday it is', () => {
  expect(birthdayPilots(new Date('2026-10-28T12:00:00Z'), '', birthdays)).toEqual([
    CharacterType.LUC,
  ]);
  expect(birthdayPilots(new Date('2026-10-29T12:00:00Z'), '', birthdays)).toEqual([]);
  expect(birthdayPilots(new Date('2028-02-29T12:00:00Z'), '', birthdays)).toEqual([]);
});

test('?birthday= previews any pilot on any day, and only them', () => {
  const day = new Date('2026-10-28T12:00:00Z');
  expect(birthdayPilots(day, '?birthday=Magne', birthdays)).toEqual([CharacterType.MAGNE]);
  expect(birthdayPilots(day, '?birthday=nobody', birthdays)).toEqual([]);
});
