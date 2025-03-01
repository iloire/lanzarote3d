import * as THREE from "three";
import { PilotHeadOptions } from "../pilot-head";
import { DefaultHelmet } from "../helmets/DefaultHelmet";
import { FullFaceHelmet } from "../helmets/FullFaceHelmet";
import { HelmetWithHorns } from "../helmets/HelmetWithHorns";
import { HelmetType } from "../helmets/types";

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

  protected getHelmet(): THREE.Group {
    switch (this.options.helmetType) {
      case HelmetType.Default:
        return new DefaultHelmet(this.options.helmetOptions).load();
      case HelmetType.FullFace:
        return new FullFaceHelmet(this.options.helmetOptions).load();
      case HelmetType.WithHorns:
        return new HelmetWithHorns(this.options.helmetOptions).load();
      default:
        return new DefaultHelmet(this.options.helmetOptions).load();
    }
  }

  abstract load(): THREE.Group;
} 