/** A place in the picker: its ?location= id, its name and the region it is listed under */
export interface Place {
  id: string;
  name: string;
  region: string;
}

/** Lower case without accents, so "castejon" finds Castejón */
const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** The places whose name or region contains every word of the query, in their order */
export const matchPlaces = (places: Place[], query: string): Place[] => {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return places.filter(({ name, region }) => {
    const text = fold(`${name} ${region}`);
    return words.every(word => text.includes(word));
  });
};

/** Places grouped by region, the regions in the order they first appear */
export const groupByRegion = (places: Place[]): { region: string; places: Place[] }[] => {
  const groups = new Map<string, Place[]>();
  places.forEach(place => {
    groups.set(place.region, [...(groups.get(place.region) ?? []), place]);
  });
  return [...groups].map(([region, list]) => ({ region, places: list }));
};

/** The places before and after the current one, wrapping round the ends */
export const neighbours = (places: Place[], current: string): { previous: Place; next: Place } => {
  const at = Math.max(
    0,
    places.findIndex(({ id }) => id === current)
  );
  return {
    previous: places[(at - 1 + places.length) % places.length]!,
    next: places[(at + 1) % places.length]!,
  };
};

/** This page's URL in another place, keeping its other parameters, so it can be shared */
export const placeHref = (id: string): string => {
  const search = new URLSearchParams(window.location.search);
  search.set('location', id);
  return `?${search.toString()}`;
};
