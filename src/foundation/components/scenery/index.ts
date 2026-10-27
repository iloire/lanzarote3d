// Scenery Components
export { default as Island } from './Island';
export { default as Pool } from './Pool';
export { default as Stone } from './Stone';
export { default as ProceduralRoad } from './ProceduralRoad';
export { Park } from './Park';
export type { ParkOptions } from './Park';

// Tree Components (organized in trees subfolder)
export { default as Tree } from './trees/Tree';
export * from './trees';

// Cactus Components (organized in cactus subfolder)
export { default as SaguaroCactus } from './cactus/SaguaroCactus';
export { default as BarrelCactus } from './cactus/BarrelCactus';
export { default as PricklyPearCactus } from './cactus/PricklyPearCactus';
export { default as OrganPipeCactus } from './cactus/OrganPipeCactus';
export * from './cactus';

export { default as Harbour } from './harbour/Harbour';
export type { HarbourFeature, HarbourFeatureKind, HarbourOptions } from './harbour/Harbour';

// Boat Components (organized in boats subfolder)
export * from './boats';

// Building Components (organized in buildings subfolder)
export * from './buildings';
