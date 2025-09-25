import * as THREE from 'three';
import { WindCondition } from './types';
export declare const createWindArrow: (position: THREE.Vector3, direction: number, speed: number, color?: number) => THREE.Object3D;
export declare const createWindArrowsForTakeoff: (takeoffPosition: THREE.Vector3, conditions: WindCondition[]) => THREE.Object3D[];
//# sourceMappingURL=wind.d.ts.map