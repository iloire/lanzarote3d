import * as THREE from "three";
import { HelmetOptions } from "./types";

export abstract class BaseHelmet {
  protected options: HelmetOptions;

  constructor(options: HelmetOptions) {
    this.options = options;
  }

  protected getColoredMaterial(color: string): THREE.Material {
    return new THREE.MeshBasicMaterial({ color: color });
  }

  abstract load(): THREE.Group;
} 