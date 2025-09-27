import { StoryOptions } from './types';

// Export specialized base classes
export { AppBase } from './AppBase';
export { WorkshopDemoBase } from './WorkshopDemoBase';
export { TerrainBase } from './TerrainBase';

// Import core apps
import Animation from '../demos/animation/index';
import Game from '../experiences/game/game';
import FlyZones from '../experiences/flyzones/index';
import PhotoBooth from '../demos/photobooth';
import Famara from '../demos/famara';
import LocationEditor from '../tools/location-editor/index';

// Import workshop demos
import Clouds from '../tools/workshop/demos/clouds/index';
import FlierPg from '../tools/workshop/demos/flier-pg/index';
import Glider from '../tools/workshop/demos/glider/index';
import HangGlider from '../tools/workshop/demos/hangglider/index';
import Head from '../tools/workshop/demos/head/index';
import Helmet from '../tools/workshop/demos/helmet/index';
import Igloo from '../tools/workshop/demos/igloo/index';
import Island from '../tools/workshop/demos/island/index';
import ParagliderVoxelDemo from '../tools/workshop/demos/paraglider-voxel/index';
import ParagliderDemo from '../tools/workshop/demos/paraglider/index';
import Pilot from '../tools/workshop/demos/pilot/index';
import Terrain from '../tools/workshop/demos/terrain/index';
import Voxel from '../tools/workshop/demos/voxel/index';
import Workshop from '../tools/workshop/demos/workshop/index';

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
