import { StoryOptions } from "./types";

// Import core apps
import Animation from "../animation/index";
import Game from "../game/game";
import FlyZones from "../flyzones/index";
import PhotoBooth from "../photobooth";
import LocationEditor from "../location-editor/index";

// Import workshop demos
import Clouds from "../workshop/demos/clouds";
import FlierPg from "../workshop/demos/flier-pg";
import Glider from "../workshop/demos/glider";
import HangGlider from "../workshop/demos/hangglider";
import Head from "../workshop/demos/head";
import Helmet from "../workshop/demos/helmet";
import Night from "../workshop/demos/night";
import ParagliderVoxelDemo from "../workshop/demos/paraglider-voxel";
import ParagliderDemo from "../workshop/demos/paraglider";
import Pilot from "../workshop/demos/pilot";
import Terrain from "../workshop/demos/terrain";
import Voxel from "../workshop/demos/voxel/index";
import Workshop from "../workshop/index";

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