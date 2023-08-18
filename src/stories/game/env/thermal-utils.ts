import * as THREE from "three";
import Weather from "../../../elements/weather";
import Thermal, { ThermalDimensions } from "../../../components/thermal";
import { rndBetween, rndIntBetween } from "../../../utils/math";

const THERMAL_OPACITY = 0.04;

const generateRandomLcl = (lclLevel: number): number => {
  return lclLevel + rndIntBetween(-200, 3000);
};

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
  position: THREE.Vector3,
  weather: Weather,
  superThermal: boolean = false,
  dimensions?: ThermalDimensions
): Thermal[] => {
  const thermal = new Thermal(
    dimensions ||
      generateRandomThermalDimensions(weather.getLclLevel(), superThermal),
    position,
    THERMAL_OPACITY,
    weather,
    true,
    superThermal
  );

  const interiorThermalDimensions = {
    bottomRadius: rndIntBetween(190, 250) / 2,
    topRadius: rndIntBetween(400, 600) / 2,
    height: generateRandomLcl(weather.getLclLevel()),
  };

  const thermalInside = new Thermal(
    interiorThermalDimensions,
    position,
    THERMAL_OPACITY,
    weather,
    false,
    false
  );
  return [thermal, thermalInside];
};
