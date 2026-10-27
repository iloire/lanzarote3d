import * as THREE from 'three';
import {
  ParagliderVoxel,
  Hangglider,
  Cessna,
  Hercules,
  Glider,
} from '../../foundation/components/vehicles';
import {
  House,
  HouseType,
  Villa,
  Townhouse,
  Barn,
  DesertHouse,
  DesertHouseWithPool,
  FishingBoat,
  SmallSailBoat,
  SpeedBoat,
  Yacht,
  Tree,
  Stone,
  BarrelCactus,
  SaguaroCactus,
  PricklyPearCactus,
  OrganPipeCactus,
  Pool,
  Park,
  Harbour,
} from '../../foundation/components/scenery';
import { Cloud } from '../../foundation/components/environment';
import { Gulls } from '../../foundation/components/wildlife/Gulls';
import { LevelOfDetail } from '../../foundation/types/lod';
import {
  paraglidersVoxel,
  cessnaConfig,
  herculesConfig,
  GREEN_ROLLER,
  PURPLE_ROLLER,
  IVAN_RUSH,
} from '../home/config';
import { HARBOUR_FEATURES } from '../puerto-del-carmen/harbour';

/** Anything the viewer can show: every scene component, and Cloud, load like this */
interface Loadable {
  load(): Promise<THREE.Object3D>;
  dispose?(): void;
}

export interface ModelEntry {
  id: string;
  name: string;
  group: string;
  /** The scale the scenes draw it at, so the dimensions shown are the ones seen in the scenes */
  scale?: number;
  create: () => Loadable;
}

const pilots: ModelEntry[] = paraglidersVoxel.map(p => ({
  id: `paraglider-${p.options.pilot.characterType}`,
  name: `Paraglider (${p.options.pilot.characterType})`,
  group: 'Aerial',
  scale: 0.01,
  create: () => new ParagliderVoxel(p.options),
}));

/** A small flock on tighter circles than the scenes', so the birds stay in frame; they fly in the shader */
const gullFlock = (): Loadable => {
  const gulls = new Gulls([{ center: new THREE.Vector3(), count: 8 }], {
    minRadius: 6,
    maxRadius: 14,
    spread: 0.1,
  });
  return { load: async () => gulls.mesh, dispose: () => gulls.dispose() };
};

/** Buildings and cacti at the detail ?lod= asks for (ultra_low, low, medium or high), else HIGH */
const lodParam = new URLSearchParams(window.location.search).get('lod')?.toUpperCase();
const lod = {
  levelOfDetail: LevelOfDetail[lodParam as keyof typeof LevelOfDetail] ?? LevelOfDetail.HIGH,
};

/** Boats drift off on their movement patterns and bob through the grid unless held still */
const STILL = { enableMovement: false, autoStartFloating: false };

/** Every model the scenes place, grouped as the viewer lists them */

export const MODEL_CATALOG: ModelEntry[] = [
  ...pilots,
  // The bare wing models: the standard one, the Ozone Rush and the smaller, flatter roller
  {
    id: 'wing-standard',
    name: 'Wing (standard)',
    group: 'Aerial',
    scale: 0.01,
    create: () => new Glider({}),
  },
  {
    id: 'wing-rush',
    name: 'Wing (Ozone Rush)',
    group: 'Aerial',
    scale: 0.01,
    create: () => new Glider(IVAN_RUSH),
  },
  {
    id: 'wing-roller',
    name: 'Wing (roller)',
    group: 'Aerial',
    scale: 0.01,
    create: () => new Glider(GREEN_ROLLER),
  },
  {
    id: 'wing-roller-purple',
    name: 'Wing (roller, purple)',
    group: 'Aerial',
    scale: 0.01,
    create: () => new Glider(PURPLE_ROLLER),
  },
  { id: 'hangglider', name: 'Hangglider', group: 'Aerial', create: () => new Hangglider() },
  { id: 'cessna', name: 'Cessna', group: 'Aerial', create: () => new Cessna(cessnaConfig) },
  { id: 'hercules', name: 'Hercules', group: 'Aerial', create: () => new Hercules(herculesConfig) },

  {
    id: 'fishing-boat',
    name: 'Fishing boat',
    group: 'Boats',
    scale: 2.5,
    create: () => new FishingBoat(STILL),
  },
  {
    id: 'sail-boat',
    name: 'Small sail boat',
    group: 'Boats',
    scale: 2.5,
    create: () => new SmallSailBoat(STILL),
  },
  {
    id: 'speed-boat',
    name: 'Speed boat',
    group: 'Boats',
    scale: 2.5,
    create: () => new SpeedBoat(STILL),
  },
  { id: 'yacht', name: 'Yacht', group: 'Boats', scale: 2.5, create: () => new Yacht(STILL) },

  {
    id: 'house',
    name: 'House',
    group: 'Buildings',
    create: () => new House({ type: HouseType.Medium, ...lod }),
  },
  { id: 'villa', name: 'Villa', group: 'Buildings', create: () => new Villa(lod) },
  { id: 'townhouse', name: 'Townhouse', group: 'Buildings', create: () => new Townhouse(lod) },
  { id: 'barn', name: 'Barn', group: 'Buildings', create: () => new Barn(lod) },
  {
    id: 'desert-house',
    name: 'Desert house',
    group: 'Buildings',
    create: () => new DesertHouse(lod),
  },
  {
    id: 'desert-house-pool',
    name: 'Desert house with pool',
    group: 'Buildings',
    create: () => new DesertHouseWithPool(lod),
  },
  { id: 'pool', name: 'Pool', group: 'Buildings', create: () => new Pool() },
  {
    id: 'harbour',
    name: 'Harbour (Puerto del Carmen)',
    group: 'Buildings',
    create: () => new Harbour({ features: HARBOUR_FEATURES }),
  },
  { id: 'park', name: 'Park', group: 'Buildings', create: () => new Park() },

  { id: 'tree', name: 'Tree', group: 'Nature', create: () => new Tree() },
  { id: 'stone', name: 'Stone', group: 'Nature', create: () => new Stone() },
  {
    id: 'barrel-cactus',
    name: 'Barrel cactus',
    group: 'Nature',
    create: () => new BarrelCactus(lod),
  },
  {
    id: 'saguaro-cactus',
    name: 'Saguaro cactus',
    group: 'Nature',
    create: () => new SaguaroCactus(lod),
  },
  {
    id: 'prickly-pear-cactus',
    name: 'Prickly pear cactus',
    group: 'Nature',
    create: () => new PricklyPearCactus(lod),
  },
  {
    id: 'organ-pipe-cactus',
    name: 'Organ pipe cactus',
    group: 'Nature',
    create: () => new OrganPipeCactus(lod),
  },
  { id: 'gulls', name: 'Gulls', group: 'Nature', create: gullFlock },
  { id: 'cloud', name: 'Cloud', group: 'Nature', create: () => new Cloud({ kind: 'puff' }) },
  {
    id: 'cloud-tower',
    name: 'Cloud (tower)',
    group: 'Nature',
    create: () => new Cloud({ kind: 'tower' }),
  },
];
