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
    bottomRadius: rndIntBetween(400 * multiplier, 440 * multiplier),
    topRadius: rndIntBetween(500 * multiplier, 900 * multiplier),
    height: generateRandomLcl(lclLevel) * heightMultiplier,
  };
};

export const generateThermalPair = (
  options: ThermalGenerationOptions
): Thermal[] => {

  const dimensions = options.dimensions ||
    generateRandomThermalDimensions(options.weather.getLclLevel(), options.superThermal);

  const thermal = new Thermal(
    dimensions,
    options.position,
    options.opacity,
    options.weather,
    true,
    options.superThermal
  );

  const coreDimensions = {
    bottomRadius: dimensions.bottomRadius * 0.4,
    topRadius: dimensions.topRadius * 0.6,
    height: dimensions.height
  };

  const core = new Thermal(
    coreDimensions,
    options.position,
    options.opacity,
    options.weather,
    false,
    false
  );
  return [thermal, core];
};
