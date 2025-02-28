import Animation from "./animation";
import Cloud from "./cloud";
import Clouds from "./clouds";
import Default from "./default";
import FlierPG from "./flier-pg";
import FlyZones from "./flyzones";
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
import Voxel from "./voxel";
import Workshop from "./workshop";

const Stories = {
  animation: Animation.load,
  cloud: Cloud.load,
  clouds: Clouds.load,
  default: Default.load,
  flier: FlierPG.load,
  flyzones: FlyZones.load,
  game: Game.load,
  glider: Glider.load,
  hangglider: HangGlider.load,
  head: Head.load,
  night: Night.load,
  paraglider: Paraglider.load,
  paragliderVoxel: ParagliderVoxel.load,
  photobooth: PhotoBooth.load,
  pilot: Pilot.load,
  terrain: Terrain.load,
  voxel: Voxel.load,
  workshop: Workshop.load,
};

export default Stories;
