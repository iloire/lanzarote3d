import * as THREE from "three";

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

const WEATHER_UPDATE_FRECUENCY = 5000;

export type WeatherOptions = {
  windDirectionDegreesFromNorth: number;
  speedMetresPerSecond: number;
  lclLevel: number;
};

class Weather extends THREE.EventDispatcher {
  options: WeatherOptions;

  constructor(options: WeatherOptions) {
    super();
    this.options = options;

    setInterval(() => {
      const newWindValue = getRandomArbitrary(
        this.options.speedMetresPerSecond * 0.95,
        this.options.speedMetresPerSecond * 1.05
      );
      const newDirectionValue = THREE.MathUtils.clamp(
        getRandomArbitrary(
          this.options.windDirectionDegreesFromNorth * 0.95,
          this.options.windDirectionDegreesFromNorth * 1.05
        ),
        0,
        360
      );
      this.options.speedMetresPerSecond = Math.round(newWindValue * 100) / 100;
      this.options.windDirectionDegreesFromNorth =
        Math.round(newDirectionValue * 100) / 100;

      const newLclValue = getRandomArbitrary(
        this.options.lclLevel * 0.95,
        this.options.lclLevel * 1.05
      );
      this.options.lclLevel = Math.round(newLclValue);

      this.dispatchEvent({
        type: "wind-speedChange",
        value: this.options.speedMetresPerSecond,
      });
      this.dispatchEvent({
        type: "wind-directionChange",
        value: this.options.windDirectionDegreesFromNorth,
      });
      this.dispatchEvent({
        type: "lclChange",
        value: this.options.lclLevel,
      });
    }, WEATHER_UPDATE_FRECUENCY);
  }

  changeWindSpeed(windSpeedMetresPerSecond: number) {
    this.options.speedMetresPerSecond = windSpeedMetresPerSecond;
    console.log(this.options.speedMetresPerSecond);
  }

  changeWindDirection(degreesFromNorth: number) {
    this.options.windDirectionDegreesFromNorth = degreesFromNorth;
  }

  getWindVelocity(multiplier: number = 1): THREE.Vector3 {
    return this.getWindDirectionFromNorth(
      this.options.windDirectionDegreesFromNorth
    ).multiplyScalar(multiplier * this.options.speedMetresPerSecond);
  }

  addGui(gui) {
    const weatherGui = gui.addFolder("Weather");
    weatherGui
      .add(this.options, "windDirectionDegreesFromNorth", 0, 360)
      .listen();
    weatherGui.add(this.options, "speedMetresPerSecond", 0, 60).listen();
  }

  getSpeedMetresPerSecond(): number {
    return this.options.speedMetresPerSecond;
  }

  getWindDirection(): THREE.Vector3 {
    return this.getWindDirectionFromNorth(
      this.options.windDirectionDegreesFromNorth
    );
  }

  getWindDirectionFromNorth(degreesFromNorth: number): THREE.Vector3 {
    const angleRadiansWind = THREE.MathUtils.degToRad(-degreesFromNorth);
    return new THREE.Vector3().setFromSphericalCoords(
      1,
      Math.PI / 2,
      angleRadiansWind
    );
  }

  getLclLevel(): number {
    return this.options.lclLevel;
  }
}

export default Weather;
