import * as THREE from "three";
import MathUtils from "../utils/math";

class Weather {
  degreesFromNorth: number;
  speedMetresPerSecond: number

  constructor(degreesFromNorth: number, speedMetresPerSecond: number) {
    this.degreesFromNorth = degreesFromNorth;
    this.speedMetresPerSecond = speedMetresPerSecond;
  }

  getWindDirection() : THREE.Vector3 {
    return MathUtils.getWindDirectionVector(
      this.degreesFromNorth
    );
  }

  getWindVelocity(multiplier: number): THREE.Vector3 {
    return this.getWindDirection().multiplyScalar(
      multiplier * this.speedMetresPerSecond
    );
  }

  getSpeedMetresPerSecond(): number {
    return this.speedMetresPerSecond;
  }
}

export default Weather;
