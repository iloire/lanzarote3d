import Default from "./default";
import FlyZones from "./flyzones";
import Game from "./game";
import Mechanics from "./mechanics";

const Stories = {
  default: Default.load,
  flyzones: FlyZones.load,
  game: Game.load,
  mechanics: Mechanics.load,
};

export default Stories;
