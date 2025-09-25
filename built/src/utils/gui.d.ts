import * as THREE from "three";
export type GuiHelperOptions = {
    max: number;
    min: number;
};
declare const GuiHelper: {
    addRotationGui: (gui: any, name: string, rotation: THREE.Euler, options?: GuiHelperOptions) => void;
    addPositionGui: (gui: any, name: string, pos: THREE.Vector3, options?: GuiHelperOptions) => void;
    addLocationGui: (gui: any, name: string, obj: THREE.Object3D, options?: GuiHelperOptions) => void;
};
export default GuiHelper;
//# sourceMappingURL=gui.d.ts.map