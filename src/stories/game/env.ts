import * as THREE from "three";
import Environment from "../env/environment";
import Weather from "../../elements/weather";

const BIRDS = false;
const HGLIDER = false;

export const addGameEnvironment = (
  scene: THREE.Scene,
  terrain: THREE.Mesh,
  weather: Weather,
  water: THREE.Mesh,
  gui?: any
): Environment => {
  const env = new Environment(scene);

  const thermals = env.addThermals(weather);

  const cloudOptions = { colors: ['#F64A8A', '#F987C5', '#DE3163'] }
  env.addClouds(weather, thermals, cloudOptions);
  env.addTrees(terrain);
  env.addStones(terrain);
  env.addHouses(terrain);
  env.addBoats(water);

  if (BIRDS) {
    const birdsPath = [
      { x: 7500, y: 1090, z: -1068 },
      { x: 6500, y: 1190, z: -1368 },
      { x: 4500, y: 1390, z: -1768 },
    ];
    env.addBirds(
      birdsPath.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      gui
    );
  }

  if (HGLIDER) {
    const hgPath = [
      { x: 10000, y: 1090, z: -6068 },
      { x: 6500, y: 1190, z: -1368 },
      { x: 8200, y: 1190, z: -1668 },
      { x: 8900, y: 1390, z: -2768 },
      { x: 9500, y: 1790, z: -4268 },
      { x: 11000, y: 2790, z: -7468 },
    ];
    env.addHangGlider(
      hgPath.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      gui
    );
  }

  // await env.addOtherGliders(scene, weather, terrain, water);
  //
  return env;
};
