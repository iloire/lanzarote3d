import * as THREE from "three";
import Thermal from "../../../components/thermal";
import Environment from "../env/environment";
import Weather from "../../../elements/weather";

export const addGameEnvironment = (
  scene: THREE.Scene,
  terrain: THREE.Mesh,
  weather: Weather,
  water: THREE.Mesh,
  gui?: any
): Environment => {
  const env = new Environment();

  const thermals = env.addThermals(scene, weather);

  env.addClouds(scene, weather, thermals);
  env.addTrees(scene, terrain);
  env.addStones(scene, terrain);
  env.addHouses(scene, terrain);
  env.addBoats(scene, water);
  const birdsPath = [
    { x: 7500, y: 1090, z: -1068 },
    { x: 6500, y: 1190, z: -1368 },
    { x: 4500, y: 1390, z: -1768 },
  ];
  env.addBirds(
    scene,
    birdsPath.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    gui
  );
  const hgPath = [
    { x: 10000, y: 1090, z: -6068 },
    { x: 6500, y: 1190, z: -1368 },
    { x: 8200, y: 1190, z: -1668 },
    { x: 8900, y: 1390, z: -2768 },
    { x: 9500, y: 1790, z: -4268 },
    { x: 11000, y: 2790, z: -7468 },
  ];
  env.addHangGlider(
    scene,
    hgPath.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    gui
  );
  // await env.addOtherGliders(scene, weather, terrain, water);
  //
  return env;
};
