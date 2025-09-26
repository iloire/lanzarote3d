import * as THREE from 'three';
import { Sky as SkyExample } from 'three/examples/jsm/objects/Sky';
type SkyOptions = {
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
};
export default class Sky extends THREE.Object3D {
    sunPosition: THREE.Vector3;
    monthOfTheYear: number;
    sky: SkyExample;
    ambientLight: THREE.AmbientLight;
    pointLight: THREE.PointLight;
    directionalLight: THREE.DirectionalLight;
    directionalLightHelper: THREE.DirectionalLightHelper;
    skyOptions: SkyOptions;
    constructor(timeOfDayInHours: number, monthOfTheYear: number, skyOptions?: SkyOptions);
    addSkyGui(gui: any): void;
    addGui(gui: any): void;
    updateSunPosition(timeOfDayInHours: number): void;
    addToScene(scene: THREE.Scene): void;
    addFlare(light: THREE.Light): void;
    getSunPosition(): THREE.Vector3;
    /**
     * Apply sky theme settings
     */
    applyTheme(skyTheme: any, scene?: THREE.Scene): void;
}
export {};
//# sourceMappingURL=Sky.d.ts.map