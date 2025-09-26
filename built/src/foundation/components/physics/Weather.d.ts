import * as THREE from 'three';
export type WeatherOptions = {
    windDirectionDegreesFromNorth: number;
    speedMetresPerSecond: number;
    lclLevel: number;
};
export interface WeatherEventMap {
    'wind-speedChange': {
        value: number;
    };
    'wind-directionChange': {
        value: number;
    };
    lclChange: {
        value: number;
    };
}
declare class Weather extends THREE.EventDispatcher<WeatherEventMap> {
    options: WeatherOptions;
    constructor(options: WeatherOptions);
    changeWindSpeed(windSpeedMetresPerSecond: number): void;
    changeWindDirection(degreesFromNorth: number): void;
    getWindVelocity(multiplier?: number): THREE.Vector3;
    addGui(gui: any): void;
    getSpeedMetresPerSecond(): number;
    getWindDirection(): THREE.Vector3;
    getWindDirectionFromNorth(degreesFromNorth: number): THREE.Vector3;
    getLclLevel(): number;
}
export default Weather;
//# sourceMappingURL=Weather.d.ts.map