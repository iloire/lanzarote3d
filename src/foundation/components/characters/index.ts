// Modern character components using new architecture
export {
  PilotHeadComponent,
  PilotHeadType as ModernPilotHeadType,
  HelmetType,
  GlassesType
} from './PilotHeadComponent';
export type { PilotHeadOptions } from './PilotHeadComponent';

// Legacy character components (will be gradually replaced)
export { default as PilotVoxel } from './PilotVoxel';
export { default as TandemPilot } from './TandemPilot';
export { default as PilotHead, PilotHeadType as LegacyPilotHeadType } from './PilotHead';
export { default as CocoonHarness } from './CocoonHarness';
