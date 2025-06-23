import { StoryOptions } from "./types";
import Animation from "./animation";
import Clouds from "./clouds";
import FlierPG from "./flier-pg";
import FlyZones from "./flyzones/index";
import Game from "./game/game";
import Glider from "./glider";
import HangGlider from "./hangglider";
import Head from "./head";
import Night from "./night";
import Paraglider from "./paraglider";
import ParagliderVoxel from "./paraglider-voxel";
import PhotoBooth from "./photobooth";
import Pilot from "./pilot";
import Terrain from "./terrain";
import Workshop from "./workshop";
import Helmet from "./helmet";
import VoxelExample from "./voxel/index";
import LocationEditor from "./location-editor";
export type StoryFunction = (options: StoryOptions) => Promise<any>;

const Stories: Record<string, StoryFunction> = {
  animation: Animation.load,
  clouds: Clouds.load,
  flier: FlierPG.load,
  flyzones: FlyZones.load,
  locationEditor: LocationEditor.load,
  game: Game.load,
  glider: Glider.load,
  hangglider: HangGlider.load,
  head: Head.load,
  helmet: Helmet.load,
  night: Night.load,
  paraglider: Paraglider.load,
  paragliderVoxel: ParagliderVoxel.load,
  photobooth: PhotoBooth.load,
  pilot: Pilot.load,
  terrain: Terrain.load,
  voxel: VoxelExample.load,  
  workshop: Workshop.load,
};

export default Stories;
