import { StoryOptions } from "./types";

// Import core apps
import Animation from "../demos/animation/index";
import Game from "../experiences/game/game";
import FlyZones from "../experiences/flyzones/index";
import PhotoBooth from "../experiences/photobooth";
import LocationEditor from "../tools/location-editor/index";

// Import workshop demos
import Clouds from "../tools/workshop/demos/clouds";
import FlierPg from "../tools/workshop/demos/flier-pg";
import Glider from "../tools/workshop/demos/glider";
import HangGlider from "../tools/workshop/demos/hangglider";
import Head from "../tools/workshop/demos/head";
import Helmet from "../tools/workshop/demos/helmet";
import Night from "../tools/workshop/demos/night";
import ParagliderVoxelDemo from "../tools/workshop/demos/paraglider-voxel";
import ParagliderDemo from "../tools/workshop/demos/paraglider";
import Pilot from "../tools/workshop/demos/pilot";
import Terrain from "../tools/workshop/demos/terrain";
import Voxel from "../tools/workshop/demos/voxel/index";
import Workshop from "../tools/workshop/index";

export type StoryFunction = (options: StoryOptions) => Promise<any>;

const Stories: Record<string, any> = {
  // Core Independent Applications
  animation: Animation,
  game: Game,
  flyzones: FlyZones,
  photobooth: PhotoBooth,
  'location-editor': LocationEditor,
  locationEditor: LocationEditor, // camelCase alias

  // Workshop Demos
  clouds: Clouds,
  'flier-pg': FlierPg,
  flierPg: FlierPg, // camelCase alias
  flier: FlierPg, // short alias
  glider: Glider,
  hangglider: HangGlider,
  head: Head,
  helmet: Helmet,
  night: Night,
  'paraglider-voxel': ParagliderVoxelDemo,
  paragliderVoxel: ParagliderVoxelDemo, // camelCase alias
  paraglider: ParagliderDemo,
  pilot: Pilot,
  terrain: Terrain,
  voxel: Voxel,
  workshop: Workshop
};

export default Stories;