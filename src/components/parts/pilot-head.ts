import * as THREE from "three";
import { DefaultHead } from "./heads/DefaultHead";
import { WarriorHead } from "./heads/WarriorHead";
import { SkeletonHead } from "./heads/SkeletonHead";
import { DevilHead } from "./heads/DevilHead";
import { HelmetType, HelmetOptions } from "./helmets/types";

export enum PilotHeadType {
  Default, Warrior, Skeleton, Devil
}

export enum GlassesType {
  Default, SunGlasses1
}

export interface PilotHeadOptions {
  headType: PilotHeadType;
  helmetType?: HelmetType;
  helmetOptions?: HelmetOptions;
  glassesType?: GlassesType;
  skinColor?: string;
  beardColor?: string;
  eyeColor?: string;
  glassesColor?: string;
}

const DEFAULT_OPTIONS = {
  skinColor: '#e0bea5',
  beardColor: '#cc613d',
  eyeColor: 'white',
  glassesColor: 'pink',
  headType: PilotHeadType.Default,
  glassesType: GlassesType.Default,
  helmetType: HelmetType.Default,
  helmetOptions: {
    color: 'yellow',
    color2: 'white',
    color3: '#c2c2c2'
  }
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
      case PilotHeadType.Default:
      default:
        return new DefaultHead(this.options).load();
    }
  }
}

export default PilotHead;
