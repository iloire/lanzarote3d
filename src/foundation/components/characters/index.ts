// Modern character components using new architecture
export {
  PilotHead,
  PilotHeadType,
  HelmetType,
  GlassesType
} from './PilotHead';
export type { PilotHeadOptions } from './PilotHead';

export {
  PilotVoxel
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
export { default as LegacyPilotVoxel } from './PilotVoxel';
export { default as TandemPilot } from './TandemPilot';
export { default as CocoonHarness } from './CocoonHarness';

// Legacy export aliases for backward compatibility
export { PilotHead as LegacyPilotHead, PilotHeadType as LegacyPilotHeadType } from './PilotHead';
