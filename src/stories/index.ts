import Default from "./default";
import FlyZones from "./flyzones";
import Game from "./game";
import Mechanics from "./mechanics";
import DayTime from "./daytime";
import Night from "./night";
import Terrain from "./terrain";

const Stories = {
  default: Default.load,
  flyzones: FlyZones.load,
  game: Game.load,
  mechanics: Mechanics.load,
  daytime: DayTime.load,
  night: Night.load,
  terrain: Terrain.load,
};

export default Stories;
