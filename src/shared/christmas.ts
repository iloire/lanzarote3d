import { islandDay } from '../foundation/utils/islandDay';

/**
 * Christmas on the island runs from 1 December to Reyes, 6 January, the day Spanish children
 * get their presents. Both ends are 'MM-DD' and count.
 */
export const CHRISTMAS_SEASON = { from: '12-01', to: '01-06' };

/**
 * The query parameter that turns the Christmas mode on out of season, to preview it
 * (?christmas or ?christmas=1), or off in season (?christmas=0)
 */
export const CHRISTMAS_PARAM = 'christmas';

const OFF = ['0', 'false', 'off', 'no'];

/** Whether the scenes dress for Christmas on `date`, unless `search` says otherwise */
export function christmasOn(date: Date, search = ''): boolean {
  const asked = new URLSearchParams(search).get(CHRISTMAS_PARAM);
  if (asked !== null) return !OFF.includes(asked.trim().toLowerCase());
  const today = islandDay(date);
  return today >= CHRISTMAS_SEASON.from || today <= CHRISTMAS_SEASON.to;
}

let cached: boolean | undefined;

/** Whether this page dresses for Christmas: decided once, from today and the address */
export function isChristmas(): boolean {
  cached ??= christmasOn(new Date(), typeof window === 'undefined' ? '' : window.location.search);
  return cached;
}
