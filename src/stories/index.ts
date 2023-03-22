import Default from "./default";
import FlyZones from "./flyzones";
import Game from "./game";
import Mechanics from "./mechanics";
import DayTime from "./daytime";
import Night from "./night";
import Terrain from "./terrain";
import Workshop from "./workshop";
import Paraglider from "./paraglider";
import HangGlider from "./hangglider";
import Cloud from "./cloud";
import Clouds from "./clouds";

const Stories = {
  default: Default.load,
  flyzones: FlyZones.load,
  game: Game.load,
  mechanics: Mechanics.load,
  daytime: DayTime.load,
  night: Night.load,
  terrain: Terrain.load,
  workshop: Workshop.load,
  paraglider: Paraglider.load,
  hangglider: HangGlider.load,
  cloud: Cloud.load,
  clouds: Clouds.load,
};

export default Stories;
