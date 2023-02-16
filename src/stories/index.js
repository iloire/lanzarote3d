import Default from "./default.js";
import Balloons from "./balloons.js";
import HG from "./hg.js";
import FlyZones from "./flyzones.js";
import Game from "./game.js";

const Stories = {
  default: Default.load,
  balloons: Balloons.load,
  hg: HG.load,
  flyzones: FlyZones.load,
  game: Game.load,
};

export default Stories;
