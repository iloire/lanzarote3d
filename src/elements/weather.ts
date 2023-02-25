import * as THREE from "three";

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

const WEATHER_UPDATE_FRECUENCY = 5000;

class Weather extends THREE.EventDispatcher {
  degreesFromNorth: number;
  speedMetresPerSecond: number;
  lclLevel: number;

  constructor(
    degreesFromNorth: number,
    speedMetresPerSecond: number,
    lclLevel: number
  ) {
    super();
    this.degreesFromNorth = degreesFromNorth;
    this.speedMetresPerSecond = speedMetresPerSecond;
    this.lclLevel = lclLevel;

    setInterval(() => {
      const newWindValue = getRandomArbitrary(
        this.speedMetresPerSecond * 0.9,
        this.speedMetresPerSecond * 1.1
      );
      const newDirectionValue = getRandomArbitrary(
        this.degreesFromNorth * 0.95,
        this.degreesFromNorth * 1.05
      );
      const newLclValue = getRandomArbitrary(lclLevel * 0.95, lclLevel * 1.05);
      this.speedMetresPerSecond = Math.round(newWindValue * 100) / 100;
      this.degreesFromNorth = Math.round(newDirectionValue * 100) / 100;
      this.lclLevel = Math.round(newLclValue);

      this.dispatchEvent({
        type: "wind-speedChange",
        value: this.speedMetresPerSecond,
      });
      this.dispatchEvent({
        type: "wind-directionChange",
        value: this.degreesFromNorth,
      });
      this.dispatchEvent({
        type: "lclChange",
        value: this.lclLevel,
      });
    }, WEATHER_UPDATE_FRECUENCY);
  }

  changeWindSpeed(windSpeedMetresPerSecond: number) {
    this.speedMetresPerSecond = windSpeedMetresPerSecond;
    console.log(this.speedMetresPerSecond);
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
