import * as THREE from "three";
import Clouds from "../../elements/clouds";
import Weather from "../../elements/weather";
import Thermal, { ThermalDimensions } from "../../elements/thermal";

const generateThermalPair = (
  dimensions: ThermalDimensions,
  position: THREE.Vector3,
  weather: Weather
): Thermal[] => {
  const thermal = new Thermal(dimensions, position, 0.05, weather, true);
  const thermalInside = new Thermal(
    {
      bottomRadius: dimensions.bottomRadius / 2,
      topRadius: dimensions.topRadius / 2,
      height: dimensions.height,
    },
    position,
    0.09,
    weather,
    false
  );
  return [thermal, thermalInside];
};

const Environment = {
  addThermals: (scene: THREE.Scene, weather: Weather): Thermal[] => {
    const lclLevel = weather.getLclLevel();
    const thermalPair1 = generateThermalPair(
      { bottomRadius: 360, topRadius: 160, height: lclLevel },
      new THREE.Vector3(5727, 0, -535),
      weather
    );
    const thermalPair2 = generateThermalPair(
      { bottomRadius: 360, topRadius: 160, height: lclLevel },
      new THREE.Vector3(7127, 0, -1405),
      weather
    );
    const thermalPair3 = generateThermalPair(
      { bottomRadius: 360, topRadius: 160, height: lclLevel },
      new THREE.Vector3(3027, 0, 1005),
      weather
    );
    const allThermals = thermalPair1.concat(thermalPair2).concat(thermalPair3);
    allThermals.forEach((t) => {
      scene.add(t.getMesh());
    });
    return allThermals;
  },

  async addClouds(
    scene: THREE.Scene,
    weather: Weather,
    thermals: Thermal[]
  ): Promise<THREE.Object3D[]> {
    const lclLevel = weather.getLclLevel();
    const mainThermals = thermals.filter((t) => t.isMainThermal());
    const clouds = await Promise.all(
      mainThermals.map((t) => {
        return Clouds.load(
          1,
          new THREE.Vector3(
            thermals[0].getPosition().x,
            lclLevel * 1.2,
            thermals[0].getPosition().z
          )
        );
      })
    );
    clouds.forEach((c) => {
      scene.add(c);
    });
    return clouds;
  },
};

export default Environment;
