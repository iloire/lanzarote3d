import * as THREE from "three";
import Weather from "../../elements/weather";
import Thermal, { ThermalDimensions } from "../../components/thermal";
export type ThermalGenerationOptions = {
    position: THREE.Vector3;
    weather: Weather;
    superThermal: boolean;
    dimensions?: ThermalDimensions;
    opacity?: number;
};
export declare const generateThermalPair: (options: ThermalGenerationOptions) => Thermal[];
//# sourceMappingURL=thermal-utils.d.ts.map