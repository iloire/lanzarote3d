// Building Components
// House exports legacy constructor as default (synchronous load)
export { default as House, HouseType } from './House';

// Other buildings export both original class and legacy constructor
export { Villa, default as VillaLegacy } from './Villa';
export { Townhouse, default as TownhouseLegacy } from './Townhouse';
export { Barn, default as BarnLegacy } from './Barn';
export { DesertHouse, default as DesertHouseLegacy } from './DesertHouse';
export { DesertHouseWithPool, default as DesertHouseWithPoolLegacy } from './DesertHouseWithPool';
export { RoundBungalow } from './RoundBungalow';

// Export types
export type { HouseOptions } from './House';
export type { VillaOptions } from './Villa';
export type { TownhouseOptions } from './Townhouse';
export type { BarnOptions } from './Barn';
export type { DesertHouseOptions } from './DesertHouse';
export type { DesertHouseWithPoolOptions } from './DesertHouseWithPool';
export type { RoundBungalowOptions } from './RoundBungalow';
