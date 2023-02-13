import Default from "./default.js";
import Balloons from "./balloons.js";
import HG from "./hg.js";
import FlyZones from "./flyzones.js";

const Stories = {
  default: (camera, scene, renderer) => {
    Default.load(camera, scene, renderer);
  },
  balloons: (camera, scene, renderer) => {
    Balloons.load(camera, scene, renderer);
  },
  hg: (camera, scene, renderer) => {
    HG.load(camera, scene, renderer);
  },
  flyzones: (camera, scene, renderer) => {
    FlyZones.load(camera, scene, renderer);
  },
};

export default Stories;
