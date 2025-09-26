import * as THREE from 'three';
import { Weather } from '../../../foundation/components/physics';
import { Thermal, ThermalDimensions } from '../../../foundation/components/physics';
export type ThermalGenerationOptions = {
    position: THREE.Vector3;
    weather: Weather;
    superThermal: boolean;
    dimensions?: ThermalDimensions;
    opacity?: number;
};
export declare const generateThermalPair: (options: ThermalGenerationOptions) => Thermal[];
//# sourceMappingURL=thermal-utils.d.ts.map