import * as THREE from "three";
export declare enum HouseType {
    Small = 0,
    Medium = 1,
    Large = 2,
    Modern = 3
}
declare class House {
    height: number;
    type: HouseType;
    constructor(type: HouseType);
    private addBasicWindows;
    load(gui?: any): THREE.Mesh;
}
export default House;
//# sourceMappingURL=house.d.ts.map