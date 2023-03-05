import * as THREE from "three";
import Clouds from "../../elements/clouds";
import Weather from "../../elements/weather";
import Thermal from "../../elements/thermal";

const Environment = {
  addThermals: (scene: THREE.Scene, weather: Weather): Thermal[] => {
    const lclLevel = weather.getLclLevel();
    const thermalPos = new THREE.Vector3(5727, 0, -535);
    const thermalPos2 = new THREE.Vector3(7127, 0, -1405);
    const thermalPos3 = new THREE.Vector3(3027, 0, 1005);
    const thermal = new Thermal(thermalPos, lclLevel * 0.95, weather, 1.5);
    const thermal2 = new Thermal(thermalPos2, lclLevel * 1.1, weather, 2);
    const thermal3 = new Thermal(thermalPos3, lclLevel * 1.05, weather, 2);
    scene.add(thermal.mesh);
    scene.add(thermal2.mesh);
    scene.add(thermal3.mesh);
    return [thermal, thermal2, thermal3];
  },

  async addClouds(
    scene: THREE.Scene,
    weather: Weather,
    thermals: Thermal[]
  ): Promise<THREE.Object3D[]> {
    const lclLevel = weather.getLclLevel();
    const c = await Clouds.load(
      1,
      new THREE.Vector3(
        thermals[0].getPosition().x,
        lclLevel * 1.2,
        thermals[0].getPosition().z
      )
    );
    scene.add(c);
    const c2 = await Clouds.load(
      1,
      new THREE.Vector3(
        thermals[1].getPosition().x,
        lclLevel * 1.1,
        thermals[1].getPosition().z
      )
    );
    scene.add(c2);
    const c3 = await Clouds.load(
      1,
      new THREE.Vector3(
        thermals[2].getPosition().x,
        lclLevel * 1.3,
        thermals[2].getPosition().z
      )
    );
    scene.add(c3);
    return [c, c2, c3];
  },
};

export default Environment;
