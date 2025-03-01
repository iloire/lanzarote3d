import * as THREE from "three";
import { PilotHeadOptions } from "../pilot-head";

export abstract class BaseHead {
  protected options: PilotHeadOptions;

  constructor(options: PilotHeadOptions) {
    this.options = options;
  }

  protected getColoredMaterial(color: string) {
    return new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
    });
  }

  protected applyDefaultScale(group: THREE.Group) {
    const scale = 200;
    group.translateY(-230);
    group.scale.set(scale, scale, scale);
    return group;
  }

  abstract load(): THREE.Group;
} 