import { groupByRegion, matchPlaces, neighbours } from '../../src/applications/relax/places';

const places = [
  { id: 'lanzarote', name: 'Lanzarote', region: 'Canary Islands' },
  { id: 'tenerife', name: 'Tenerife', region: 'Canary Islands' },
  { id: 'castejon-de-sos', name: 'Castejón de Sos', region: 'Pyrenees' },
  { id: 'rio-de-janeiro', name: 'Rio de Janeiro', region: 'Brazil' },
];

test('search ignores accents and case, and matches the region too', () => {
  expect(matchPlaces(places, 'castejon').map(({ id }) => id)).toEqual(['castejon-de-sos']);
  expect(matchPlaces(places, 'CANARY').map(({ id }) => id)).toEqual(['lanzarote', 'tenerife']);
  expect(matchPlaces(places, 'de').map(({ id }) => id)).toEqual([
    'castejon-de-sos',
    'rio-de-janeiro',
  ]);
});

test('every word of the search must match', () => {
  expect(matchPlaces(places, 'rio brazil').map(({ id }) => id)).toEqual(['rio-de-janeiro']);
  expect(matchPlaces(places, 'rio pyrenees')).toEqual([]);
  expect(matchPlaces(places, '  ')).toEqual(places);
});

test('groups keep the order the regions first appear in', () => {
  const groups = groupByRegion([places[0]!, places[2]!, places[1]!]);
  expect(groups.map(({ region }) => region)).toEqual(['Canary Islands', 'Pyrenees']);
  expect(groups[0]!.places.map(({ id }) => id)).toEqual(['lanzarote', 'tenerife']);
});

test('previous and next wrap round the ends', () => {
  expect(neighbours(places, 'lanzarote').previous.id).toBe('rio-de-janeiro');
  expect(neighbours(places, 'rio-de-janeiro').next.id).toBe('lanzarote');
  expect(neighbours(places, 'tenerife')).toEqual({ previous: places[0], next: places[2] });
});
