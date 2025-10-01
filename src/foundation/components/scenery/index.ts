// Scenery Components
export { default as Island } from './Island';
export { default as Igloo, IglooSize } from './Igloo';
export { default as CoconutPalm } from './CoconutPalm';
export { default as DatePalm } from './DatePalm';
export { default as FanPalm } from './FanPalm';
export { default as Pool } from './Pool';
export { default as Stone } from './Stone';
export { default as ProceduralRoad } from './ProceduralRoad';
export { Park } from './Park';
export type { ParkOptions } from './Park';

// Tree Components (organized in trees subfolder)
export { default as Tree } from './trees/Tree';
export { default as PineTree } from './trees/PineTree';
export { default as PalmTree } from './trees/PalmTree';
export * from './trees';

// Cactus Components (organized in cactus subfolder)
export { default as SaguaroCactus } from './cactus/SaguaroCactus';
export { default as BarrelCactus } from './cactus/BarrelCactus';
export { default as PricklyPearCactus } from './cactus/PricklyPearCactus';
export { default as OrganPipeCactus } from './cactus/OrganPipeCactus';
export * from './cactus';

// Boat Components (organized in boats subfolder)
export * from './boats';

// Building Components (organized in buildings subfolder)
export * from './buildings';
