import * as THREE from "three";

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

const WEATHER_UPDATE_FRECUENCY = 5000;

class Weather extends THREE.EventDispatcher {
  degreesFromNorth: number;
  speedMetresPerSecond: number;

  constructor(degreesFromNorth: number, speedMetresPerSecond: number) {
    super();
    this.degreesFromNorth = degreesFromNorth;
    this.speedMetresPerSecond = speedMetresPerSecond;
    setInterval(() => {
      const newWindValue = getRandomArbitrary(
        speedMetresPerSecond * 0.9,
        speedMetresPerSecond * 1.1
      );
      const newDirectionValue = getRandomArbitrary(
        degreesFromNorth * 0.95,
        degreesFromNorth * 1.05
      );
      this.speedMetresPerSecond = Math.round(newWindValue * 100) / 100;
      this.degreesFromNorth = Math.round(newDirectionValue * 100) / 100;
      this.dispatchEvent({
        type: "wind-speedChange",
        value: this.speedMetresPerSecond,
      });
      this.dispatchEvent({
        type: "wind-directionChange",
        value: this.degreesFromNorth,
      });
    }, WEATHER_UPDATE_FRECUENCY);
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
    // console.log(this.speedMetresPerSecond);
    return this.speedMetresPerSecond;
  }

  getWindDirection(): THREE.Vector3 {
    return this.getWindDirectionFromNorth(this.degreesFromNorth);
  }
  t;
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
