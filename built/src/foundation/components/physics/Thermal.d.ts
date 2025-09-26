import * as THREE from 'three';
export type ThermalDimensions = {
    bottomRadius: number;
    topRadius: number;
    height: number;
};
declare class Thermal {
    mesh: THREE.Mesh;
    dimensions: ThermalDimensions;
    mainThermal: boolean;
    superThermal: boolean;
    constructor(dimensions: ThermalDimensions, initialPosition: THREE.Vector3, opacity: any, isMainThermal: boolean, isSuperThermal: boolean);
    getPosition(): THREE.Vector3;
    getDimensions(): ThermalDimensions;
    getMesh(): THREE.Mesh;
    isMainThermal(): boolean;
    isSuperThermal(): boolean;
}
export default Thermal;
//# sourceMappingURL=Thermal.d.ts.map