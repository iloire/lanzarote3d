import * as THREE from 'three';
import {
  ParagliderVoxel,
  Hangglider,
  Cessna,
  Hercules,
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
} from '../../foundation/components/scenery';
import { Cloud } from '../../foundation/components/environment';
import { Gulls } from '../../foundation/components/wildlife/Gulls';
import { LevelOfDetail } from '../../foundation/types/lod';
import { paraglidersVoxel, cessnaConfig, herculesConfig } from '../home/config';

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

const lod = { levelOfDetail: LevelOfDetail.HIGH };

/** Every model the scenes place, grouped as the viewer lists them */
/** Boats drift off on their movement patterns and bob through the grid unless held still */
const STILL = { enableMovement: false, autoStartFloating: false };

export const MODEL_CATALOG: ModelEntry[] = [
  ...pilots,
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
  { id: 'cloud', name: 'Cloud', group: 'Nature', create: () => new Cloud({}) },
];
