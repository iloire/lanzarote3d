import * as THREE from "three";
import { DefaultHead } from "./heads/DefaultHead";
import { WarriorHead } from "./heads/WarriorHead";
import { SkeletonHead } from "./heads/SkeletonHead";
import { DevilHead } from "./heads/DevilHead";
import { DevilWithHelmet } from "./heads/DevilWithHelmet";
import { DinoHead } from "./heads/DinoHead";

export enum PilotHeadType {
  Default, Warrior, Skeleton, Devil, DevilWithHelmet, Dino
}

export enum GlassesType {
  Default, SunGlasses1
}

const DEFAULT_OPTIONS = {
  helmetColor: 'yellow',
  helmetColor2: 'white',
  helmetColor3: '#c2c2c2',
  skinColor: '#e0bea5',
  beardColor: '#cc613d',
  eyeColor: 'white',
  glassesColor: 'pink',
  headType: PilotHeadType.Default,
  glassesType: GlassesType.Default
}

export type PilotHeadOptions = {
  helmetColor?: string;
  helmetColor2?: string;
  helmetColor3?: string;
  skinColor?: string;
  beardColor?: string;
  eyeColor?: string;
  glassesColor?: string;
  headType?: PilotHeadType;
  glassesType?: GlassesType;
}

class PilotHead {
  private options: PilotHeadOptions;

  constructor(options: PilotHeadOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
  }

  load(): THREE.Group {
    switch (this.options.headType) {
      case PilotHeadType.Warrior:
        return new WarriorHead(this.options).load();
      case PilotHeadType.Skeleton:
        return new SkeletonHead(this.options).load();
      case PilotHeadType.Devil:
        return new DevilHead(this.options).load();
      case PilotHeadType.DevilWithHelmet:
        return new DevilWithHelmet(this.options).load();
      case PilotHeadType.Dino:
        return new DinoHead(this.options).load();
      case PilotHeadType.Default:
      default:
        return new DefaultHead(this.options).load();
    }
  }
}

export default PilotHead;
