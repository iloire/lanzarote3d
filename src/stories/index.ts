import Default from "./default";
import Balloons from "./balloons";
import HG from "./hg";
import FlyZones from "./flyzones";
import Game from "./game";
import Mechanics from "./mechanics";

const Stories = {
  default: Default.load,
  balloons: Balloons.load,
  hg: HG.load,
  flyzones: FlyZones.load,
  game: Game.load,
  mechanics: Mechanics.load,
};

export default Stories;
