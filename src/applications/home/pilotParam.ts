/** The query parameter that picks the pilot the camera follows: ?pilot=3 or ?pilot=bernt */
export const PILOT_PARAM = 'pilot';

/**
 * Which pilot `search` asks for, as an index into `names`: a 1-based number, as the arrows
 * count them, or a name in any case. Anything else, or nothing, is `fallback`.
 */
export function pilotFromSearch(search: string, names: string[], fallback = 0): number {
  const value = new URLSearchParams(search).get(PILOT_PARAM)?.trim().toLowerCase();
  if (!value) return fallback;
  if (/^\d+$/.test(value)) {
    const number = Number(value);
    return number >= 1 && number <= names.length ? number - 1 : fallback;
  }
  const index = names.findIndex(name => name.toLowerCase() === value);
  return index === -1 ? fallback : index;
}

/** `search` with the pilot set to `index`, by number so the URL never names anyone */
export function searchWithPilot(search: string, index: number): string {
  const params = new URLSearchParams(search);
  params.set(PILOT_PARAM, String(index + 1));
  return `?${params}`;
}
