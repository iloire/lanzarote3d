import * as THREE from "three";
export type CloudOptions = {
    colors?: string[];
};
declare class Cloud {
    options: CloudOptions;
    constructor(options: CloudOptions);
    interval: number | null;
    load(): Promise<THREE.Object3D>;
}
export default Cloud;
//# sourceMappingURL=cloud.d.ts.map