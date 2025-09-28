// Modern character components using new architecture
export {
  PilotHeadComponent,
  PilotHeadType as ModernPilotHeadType,
  HelmetType,
  GlassesType
} from './PilotHeadComponent';
export type { PilotHeadOptions } from './PilotHeadComponent';

export {
  PilotVoxelComponent
} from './PilotVoxelComponent';
export type { PilotVoxelOptions } from './PilotVoxelComponent';

export {
  Pilot
} from './PilotComponent';
export type { PilotOptions, PilotState } from './PilotComponent';

export {
  CharacterType,
  characterRegistry,
  getCharacterAssetPath,
  createCharacterFolder
} from './CharacterRegistry';
export type {
  CharacterDefinition,
  CharacterAssets
} from './CharacterRegistry';

// Legacy character components (will be gradually replaced)
export { default as PilotVoxel } from './PilotVoxel';
export { default as TandemPilot } from './TandemPilot';
export { default as PilotHead, PilotHeadType as LegacyPilotHeadType } from './PilotHead';
export { default as CocoonHarness } from './CocoonHarness';
