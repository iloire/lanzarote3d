import { StoryOptions } from './types';

// Export specialized base classes
export { AppBase } from './AppBase';
export { WorkshopDemoBase } from './WorkshopDemoBase';
export { ToolBase } from './ToolBase';
export { DemoBase } from './DemoBase';

// Import core apps
import Animation from '../demos/animation/index';
import Game from '../experiences/game/game';
import FlyZones from '../experiences/flyzones/index';
import PhotoBooth from '../demos/photobooth';
import Famara from '../demos/famara';
import LocationEditor from '../tools/location-editor/index';

// Import workshop demos
import Clouds from '../tools/workshop/demos/clouds';
import FlierPg from '../tools/workshop/demos/flier-pg';
import Glider from '../tools/workshop/demos/glider';
import HangGlider from '../tools/workshop/demos/hangglider';
import Head from '../tools/workshop/demos/head';
import Helmet from '../tools/workshop/demos/helmet';
import Igloo from '../tools/workshop/demos/igloo';
import Island from '../tools/workshop/demos/island';
import ParagliderVoxelDemo from '../tools/workshop/demos/paraglider-voxel';
import ParagliderDemo from '../tools/workshop/demos/paraglider';
import Pilot from '../tools/workshop/demos/pilot';
import Terrain from '../tools/workshop/demos/terrain';
import Voxel from '../tools/workshop/demos/voxel/index';
import Workshop from '../tools/workshop/demos/workshop';

export type StoryFunction = (options: StoryOptions) => Promise<any>;

// Story mappings organized by app registry structure
const storyModules = {
  // Experiences
  animation: Animation,
  game: Game,
  flyzones: FlyZones,
  photobooth: PhotoBooth,
  famara: Famara,

  // Tools
  'location-editor': LocationEditor,
  workshop: Workshop,

  // Demos
  clouds: Clouds,
  'flier-pg': FlierPg,
  glider: Glider,
  hangglider: HangGlider,
  head: Head,
  helmet: Helmet,
  igloo: Igloo,
  island: Island,
  'paraglider-voxel': ParagliderVoxelDemo,
  paraglider: ParagliderDemo,
  pilot: Pilot,
  terrain: Terrain,
  voxel: Voxel,
};

// Generate Stories with aliases for backward compatibility
const Stories: Record<string, any> = {
  ...storyModules,

  // Backward compatibility aliases
  locationEditor: LocationEditor,
  flierPg: FlierPg,
  flier: FlierPg,
  paragliderVoxel: ParagliderVoxelDemo,
};

export default Stories;
