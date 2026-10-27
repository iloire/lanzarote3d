import { pilotFromSearch, searchWithPilot } from '../../src/applications/home/pilotParam';

const names = ['ivan', 'miguel', 'bernt', 'hangglider'];

test('picks a pilot by its 1-based number', () => {
  expect(pilotFromSearch('?pilot=1', names)).toBe(0);
  expect(pilotFromSearch('?pilot=3', names)).toBe(2);
  expect(pilotFromSearch('?pilot=4', names)).toBe(3);
});

test('picks a pilot by name in any case', () => {
  expect(pilotFromSearch('?pilot=bernt', names)).toBe(2);
  expect(pilotFromSearch('?pilot=Miguel', names)).toBe(1);
  expect(pilotFromSearch('?embed=1&pilot=hangglider', names)).toBe(3);
});

test('falls back to the first pilot', () => {
  expect(pilotFromSearch('', names)).toBe(0);
  expect(pilotFromSearch('?pilot=', names)).toBe(0);
  expect(pilotFromSearch('?pilot=0', names)).toBe(0);
  expect(pilotFromSearch('?pilot=5', names)).toBe(0);
  expect(pilotFromSearch('?pilot=-2', names)).toBe(0);
  expect(pilotFromSearch('?pilot=nobody', names)).toBe(0);
});

test('falls back to the given lead instead', () => {
  expect(pilotFromSearch('', names, 1)).toBe(1);
  expect(pilotFromSearch('?pilot=5', names, 1)).toBe(1);
  expect(pilotFromSearch('?pilot=nobody', names, 1)).toBe(1);
  expect(pilotFromSearch('?pilot=3', names, 1)).toBe(2);
});

test('writes the pilot by number and keeps other parameters', () => {
  expect(searchWithPilot('', 2)).toBe('?pilot=3');
  expect(searchWithPilot('?embed=1&pilot=bernt', 0)).toBe('?embed=1&pilot=1');
});
