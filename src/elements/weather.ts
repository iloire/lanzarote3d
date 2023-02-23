import * as THREE from "three";

class Weather {
  degreesFromNorth: number;
  speedMetresPerSecond: number;

  constructor(degreesFromNorth: number, speedMetresPerSecond: number) {
    this.degreesFromNorth = degreesFromNorth;
    this.speedMetresPerSecond = speedMetresPerSecond;
  }

  getWindVelocity(multiplier: number = 1): THREE.Vector3 {
    return this.getWindDirectionFromNorth(this.degreesFromNorth).multiplyScalar(
      multiplier * this.speedMetresPerSecond
    );
  }

  addGui(gui) {
    const weatherGui = gui.addFolder("Weather");
    weatherGui.add(this, "degreesFromNorth", 0, 360).listen();
    weatherGui.add(this, "speedMetresPerSecond", 0, 60).listen();
  }

  getSpeedMetresPerSecond(): number {
    return this.speedMetresPerSecond;
  }

  getWindDirection(): THREE.Vector3 {
    return this.getWindDirectionFromNorth(this.degreesFromNorth);
  }

  getWindDirectionFromNorth(degreesFromNorth: number): THREE.Vector3 {
    const angleRadiansWind = THREE.MathUtils.degToRad(-degreesFromNorth);
    return new THREE.Vector3().setFromSphericalCoords(
      1,
      Math.PI / 2,
      angleRadiansWind
    );
  }
}

export default Weather;
