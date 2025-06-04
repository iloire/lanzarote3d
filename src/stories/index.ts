import AnimationFlyThrough from "./animation-flythrough";
import Animation from "./animation2";
import AnimationVoxel from "./animation-voxel";
import CannonWorkshop from "./cannon";
import Clouds from "./clouds";
import FlierPG from "./flier-pg";
import FlyZones from "./flyzones/index";
import Game from "./game/game";
import Glider from "./glider";
import HangGlider from "./hangglider";
import Head from "./head";
import Helmet from "./helmet";
import LocationEditor from "./location-editor";
import Night from "./night";
import Paraglider from "./paraglider";
import ParagliderVoxel from "./paraglider-voxel";
import PhotoBooth from "./photobooth";
import Physics from "./physics";
import Pilot from "./pilot";
import Terrain from "./terrain";
import { StoryOptions } from "./types";
import Voxel from "./voxel";
import VoxelExample from "./voxel/index";
import Workshop from "./workshop";

export type StoryFunction = (options: StoryOptions) => Promise<any>;

const Stories: Record<string, StoryFunction> = {
  animationFlyThrough: AnimationFlyThrough.load,
  animation: Animation.load,
  animationVoxel: AnimationVoxel.load,
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
  voxel: Voxel.load,
  voxelExample: VoxelExample.load,
  workshop: Workshop.load,
  physics: Physics.load,
  cannon: CannonWorkshop.load,
};

export default Stories;
