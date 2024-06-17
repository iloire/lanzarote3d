import * as THREE from "three";
import Weather from "../../elements/weather";
import Thermal, { ThermalDimensions } from "../../components/thermal";
import { rndIntBetween } from "../../utils/math";


const generateRandomLcl = (lclLevel: number): number => {
  return lclLevel + rndIntBetween(-200, 3000);
};


export type ThermalGenerationOptions = {
  position: THREE.Vector3,
  weather: Weather,
  superThermal: boolean,
  dimensions?: ThermalDimensions,
  opacity?: number;
}


const generateRandomThermalDimensions = (
  lclLevel: number,
  isSuperThermal: boolean
): ThermalDimensions => {
  const multiplier = isSuperThermal ? 1.4 : 1;
  const heightMultiplier = isSuperThermal ? 1.3 : 1;
  return {
    bottomRadius: rndIntBetween(420 * multiplier, 490 * multiplier),
    topRadius: rndIntBetween(500 * multiplier, 700 * multiplier),
    height: generateRandomLcl(lclLevel) * heightMultiplier,
  };
};

export const generateThermalPair = (
  options: ThermalGenerationOptions
): Thermal[] => {
  const thermal = new Thermal(
    options.dimensions ||
    generateRandomThermalDimensions(options.weather.getLclLevel(), options.superThermal),
    options.position,
    options.opacity,
    options.weather,
    true,
    options.superThermal
  );

  const interiorThermalDimensions = {
    bottomRadius: rndIntBetween(190, 250) / 2,
    topRadius: rndIntBetween(400, 600) / 2,
    height: generateRandomLcl(options.weather.getLclLevel()),
  };

  const thermalInside = new Thermal(
    interiorThermalDimensions,
    options.position,
    options.opacity,
    options.weather,
    false,
    false
  );
  return [thermal, thermalInside];
};
