import * as THREE from 'three';
import { SimpleThreeComponent } from '../base/SimpleThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';
import { PilotHead, PilotHeadType, HelmetType } from './PilotHead';
import CocoonHarness from './CocoonHarness';
import OpenHarness from './OpenHarness';
import SubmarineHarness from './SubmarineHarness';
import type { ComponentOptions } from '../base/BaseThreeComponent';

export enum HarnessType {
  Cocoon = 'cocoon',
  Open = 'open',
  Submarine = 'submarine',
}

export interface PilotOptions extends ComponentOptions {
  headType?: PilotHeadType;
  helmetType?: HelmetType;
  helmetColor?: string;
  skinColor?: string;
  suitColor?: string;
  suitColor2?: string;
  shoesColor?: string;
  carabinerColor?: string;
  carabinerSeparationMM?: number;
  showHead?: boolean;
  harnessType?: HarnessType;
  harnessColor1?: string;
  harnessColor2?: string;
}

export interface PilotState {
  leftBrakePosition: number; // 0-1
  rightBrakePosition: number; // 0-1
  speedBarPosition: number; // 0-1
  headVisible: boolean;
}

export class Pilot extends SimpleThreeComponent {
  private armRight: THREE.Mesh | null = null;
  private armLeft: THREE.Mesh | null = null;
  private body: THREE.Object3D | null = null;
  private head: THREE.Object3D | null = null;
  private pilotState: PilotState = {
    leftBrakePosition: 0,
    rightBrakePosition: 0,
    speedBarPosition: 0,
    headVisible: true,
  };

  // Constants
  private static readonly BREAK_Y_MOVE = 180; // mm

  constructor(options: PilotOptions = {}) {
    super(
      {
        name: 'Pilot',
        version: '1.0.0',
      },
      {
        headType: PilotHeadType.Default,
        helmetType: HelmetType.Default,
        helmetColor: '#ffffff',
        skinColor: '#e0bea5',
        suitColor: '#ff0000',
        suitColor2: '#cc0000',
        shoesColor: '#333333',
        carabinerColor: '#666666',
        carabinerSeparationMM: 300,
        showHead: true,
        harnessType: HarnessType.Cocoon,
        harnessColor1: '#333',
        harnessColor2: '#666',
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const container = new THREE.Object3D();
    container.name = 'PilotContainer';

    const options = this.options as PilotOptions;

    try {
      // Create pilot head asynchronously
      this.head = await this.createHead(options);
      this.head.visible = options.showHead ?? true;
      container.add(this.head);

      // Create pilot body
      this.body = this.createBody(options);
      container.add(this.body);

      return container;
    } catch (error) {
      console.error('❌ Failed to create pilot:', error);
      throw error;
    }
  }

  private async createHead(options: PilotOptions): Promise<THREE.Object3D> {
    try {
      const pilotHead = new PilotHead({
        headType: options.headType || PilotHeadType.Default,
        helmetType: options.helmetType || HelmetType.Default,
        helmetColor: options.helmetColor || '#ffffff',
        skinColor: options.skinColor || '#e0bea5',
        castShadow: this.options.castShadow,
        receiveShadow: this.options.receiveShadow,
      });

      // Load the head asynchronously
      return await pilotHead.load();
    } catch (error) {
      console.warn('Failed to create pilot head, using placeholder:', error);
      // Create a simple placeholder head
      const headGeometry = resourceManager.getOrCreateGeometry(
        'pilot_head_placeholder',
        () => new THREE.SphereGeometry(80, 16, 12)
      );
      const headMaterial = resourceManager.getOrCreateMaterial(
        `pilot_head_skin_${options.skinColor}`,
        () => new THREE.MeshPhongMaterial({ color: options.skinColor || '#e0bea5' })
      );

      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = this.options.castShadow ?? true;
      head.receiveShadow = this.options.receiveShadow ?? true;
      head.position.set(0, 0, 250);

      return head;
    }
  }

  private createBody(options: PilotOptions): THREE.Object3D {
    const group = new THREE.Object3D();
    group.name = 'PilotBody';

    // Create harness based on type
    const harnessType = options.harnessType || HarnessType.Cocoon;
    let harness: CocoonHarness | OpenHarness | SubmarineHarness;

    switch (harnessType) {
      case HarnessType.Open:
        harness = new OpenHarness({
          strapColor: options.harnessColor1 || '#222',
          carabinerColor: options.carabinerColor || '#666666',
          carabinerSeparationMM: options.carabinerSeparationMM || 300,
        });
        break;
      case HarnessType.Submarine:
        harness = new SubmarineHarness({
          hullColor: options.harnessColor1 || '#1a3a52',
          windowColor: options.harnessColor2 || '#88ccff',
          carabinerColor: options.carabinerColor || '#666666',
          carabinerSeparationMM: options.carabinerSeparationMM || 300,
        });
        break;
      case HarnessType.Cocoon:
      default:
        harness = new CocoonHarness({
          color1: options.harnessColor1 || '#333',
          color2: options.harnessColor2 || '#666',
          carabinerColor: options.carabinerColor || '#666666',
          carabinerSeparationMM: options.carabinerSeparationMM || 300,
        });
        break;
    }

    group.add(harness.load());

    // Create materials with resource sharing
    const suitMaterial = resourceManager.getOrCreateMaterial(
      `pilot_suit_${options.suitColor}`,
      () =>
        new THREE.MeshPhongMaterial({
          color: options.suitColor || '#ff0000',
        })
    );

    const skinMaterial = resourceManager.getOrCreateMaterial(
      `pilot_skin_${options.skinColor}`,
      () =>
        new THREE.MeshPhongMaterial({
          color: options.skinColor || '#e0bea5',
        })
    );

    // Create arms
    this.createArms(group, suitMaterial, skinMaterial);

    return group;
  }

  private createArms(
    group: THREE.Object3D,
    suitMaterial: THREE.Material,
    skinMaterial: THREE.Material
  ): void {
    // Create shared arm geometry
    const armGeometry = resourceManager.getOrCreateGeometry(
      'pilot_arm',
      () => new THREE.BoxGeometry(50, 390, 60)
    );

    // Right arm
    this.armRight = new THREE.Mesh(armGeometry, suitMaterial);
    this.armRight.name = 'RightArm';
    this.armRight.position.set(-190, -50, 150);
    this.armRight.castShadow = this.options.castShadow ?? true;
    this.armRight.receiveShadow = this.options.receiveShadow ?? true;

    // Left arm
    this.armLeft = new THREE.Mesh(armGeometry, suitMaterial);
    this.armLeft.name = 'LeftArm';
    this.armLeft.position.set(190, -50, 150);
    this.armLeft.castShadow = this.options.castShadow ?? true;
    this.armLeft.receiveShadow = this.options.receiveShadow ?? true;

    // Create hands
    const handGeometry = resourceManager.getOrCreateGeometry(
      'pilot_hand',
      () => new THREE.BoxGeometry(70, 70, 70)
    );

    const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
    leftHand.name = 'LeftHand';
    leftHand.position.y = 190;
    leftHand.castShadow = this.options.castShadow ?? true;

    const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
    rightHand.name = 'RightHand';
    rightHand.position.y = 190;
    rightHand.castShadow = this.options.castShadow ?? true;

    // Attach hands to arms
    this.armRight.add(rightHand);
    this.armLeft.add(leftHand);

    // Set arm rotations for natural pose
    const armRotation = -0.3;
    this.armLeft.rotateZ(armRotation);
    this.armLeft.rotateX(-armRotation);
    this.armRight.rotateZ(-armRotation);
    this.armRight.rotateX(-armRotation);

    // Add arms to group
    group.add(this.armLeft);
    group.add(this.armRight);
  }

  // Control methods
  public showHead(): void {
    this.pilotState.headVisible = true;
    if (this.head) {
      this.head.visible = true;
    }
  }

  public hideHead(): void {
    this.pilotState.headVisible = false;
    if (this.head) {
      this.head.visible = false;
    }
  }

  public speedBar(intensity: number = 1): void {
    this.pilotState.speedBarPosition = Math.max(0, Math.min(1, intensity));

    if (this.body) {
      const scale = 1 + 0.2 * this.pilotState.speedBarPosition;
      this.body.scale.z = scale;
      this.body.position.z = 40 * this.pilotState.speedBarPosition;
      this.body.scale.x = 1 - 0.1 * this.pilotState.speedBarPosition;
    }
  }

  public releaseSpeedBar(): void {
    this.pilotState.speedBarPosition = 0;

    if (this.body) {
      this.body.scale.z = 1;
      this.body.position.z = 0;
      this.body.scale.x = 1;
    }
  }

  public breakLeft(intensity: number = 1): void {
    this.pilotState.leftBrakePosition = Math.max(0, Math.min(1, intensity));

    if (this.armLeft) {
      this.armLeft.position.y = -Pilot.BREAK_Y_MOVE * this.pilotState.leftBrakePosition;
    }
  }

  public breakLeftRelease(): void {
    this.pilotState.leftBrakePosition = 0;

    if (this.armLeft) {
      this.armLeft.position.y = 0;
    }
  }

  public breakRight(intensity: number = 1): void {
    this.pilotState.rightBrakePosition = Math.max(0, Math.min(1, intensity));

    if (this.armRight) {
      this.armRight.position.y = -Pilot.BREAK_Y_MOVE * this.pilotState.rightBrakePosition;
    }
  }

  public breakRightRelease(): void {
    this.pilotState.rightBrakePosition = 0;

    if (this.armRight) {
      this.armRight.position.y = 0;
    }
  }

  public releaseBrakes(): void {
    this.breakLeftRelease();
    this.breakRightRelease();
  }

  // Getters
  public getPilotState(): PilotState {
    return { ...this.pilotState };
  }

  public getHead(): THREE.Object3D | null {
    return this.head;
  }

  public getBody(): THREE.Object3D | null {
    return this.body;
  }

  public getLeftArm(): THREE.Mesh | null {
    return this.armLeft;
  }

  public getRightArm(): THREE.Mesh | null {
    return this.armRight;
  }

  public override dispose(): void {
    this.armRight = null;
    this.armLeft = null;
    this.body = null;
    this.head = null;
    super.dispose();
  }

  public override validate(): string[] {
    const issues = super.validate();

    if (!this.armLeft || !this.armRight) {
      issues.push('Pilot arms not properly created');
    }

    if (!this.body) {
      issues.push('Pilot body not created');
    }

    if (!this.head) {
      issues.push('Pilot head not created');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as PilotOptions;

    return {
      name: 'Pilot',
      version: '1.0.0',
      type: 'character',
      pilotState: this.pilotState,
      appearance: {
        headType: options.headType,
        helmetType: options.helmetType,
        skinColor: options.skinColor,
        suitColor: options.suitColor,
      },
      hasHead: !!this.head,
      hasBody: !!this.body,
      hasArms: !!(this.armLeft && this.armRight),
    };
  }
}
