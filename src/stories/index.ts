import Default from "./default";
import FlyZones from "./flyzones";
import Game from "./game/game";
import DayTime from "./daytime";
import Night from "./night";
import Terrain from "./terrain";
import Workshop from "./workshop";
import Paraglider from "./paraglider";
import FlierPG from "./flier-pg";
import HangGlider from "./hangglider";
import Cloud from "./cloud";
import Clouds from "./clouds";
import PhotoBooth from "./photobooth";
import Animation from "./animation";
import Glider from "./glider";
import Pilot from "./pilot";
import Head from "./head";
import Voxel from "./voxel";

const Stories = {
  default: Default.load,
  flyzones: FlyZones.load,
  game: Game.load,
  daytime: DayTime.load,
  night: Night.load,
  terrain: Terrain.load,
  workshop: Workshop.load,
  paraglider: Paraglider.load,
  flier: FlierPG.load,
  hangglider: HangGlider.load,
  cloud: Cloud.load,
  clouds: Clouds.load,
  photobooth: PhotoBooth.load,
  animation: Animation.load,
  glider: Glider.load,
  pilot: Pilot.load,
  head: Head.load,
  voxel: Voxel.load,
};

export default Stories;
