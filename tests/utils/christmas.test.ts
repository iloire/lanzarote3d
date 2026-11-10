import { christmasOn } from '../../src/shared/christmas';

test('the season runs from 1 December to Reyes, island time', () => {
  expect(christmasOn(new Date('2026-11-30T12:00:00Z'))).toBe(false);
  expect(christmasOn(new Date('2026-12-01T00:30:00Z'))).toBe(true);
  expect(christmasOn(new Date('2026-12-25T12:00:00Z'))).toBe(true);
  expect(christmasOn(new Date('2027-01-01T12:00:00Z'))).toBe(true);
  expect(christmasOn(new Date('2027-01-06T23:30:00Z'))).toBe(true);
  expect(christmasOn(new Date('2027-01-07T00:30:00Z'))).toBe(false);
  expect(christmasOn(new Date('2027-07-15T12:00:00Z'))).toBe(false);
});

test('?christmas previews it out of season and ?christmas=0 turns it off in season', () => {
  const november = new Date('2026-11-10T12:00:00Z');
  const christmas = new Date('2026-12-25T12:00:00Z');
  expect(christmasOn(november, '?christmas')).toBe(true);
  expect(christmasOn(november, '?christmas=1')).toBe(true);
  expect(christmasOn(november, '?pilot=3&christmas=true')).toBe(true);
  expect(christmasOn(christmas, '?christmas=0')).toBe(false);
  expect(christmasOn(christmas, '?christmas=off')).toBe(false);
});
