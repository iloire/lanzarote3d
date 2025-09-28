import * as THREE from 'three';
import { SimpleThreeComponent } from '../base/SimpleThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';
import type { ComponentOptions } from '../base/BaseThreeComponent';

export interface GliderOptions extends ComponentOptions {
  wingColor1?: string;
  wingColor2?: string;
  breakColor?: string;
  inletsColor?: string;
  lineFrontColor?: string;
  lineBackColor?: string;
  numeroCajones?: number;
  carabinersSeparationMM?: number;
  bandLength?: number;
  showBreakLines?: boolean;
}

export interface GliderState {
  leftBrakePosition: number;  // 0-1
  rightBrakePosition: number; // 0-1
  handsPosition: number;      // 0-1 (0 = down, 1 = up)
}

interface HalfWing {
  wing: THREE.Object3D;
  wingBreakSystem: THREE.Object3D;
}

export class GliderComponent extends SimpleThreeComponent {
  private leftWing: HalfWing | null = null;
  private rightWing: HalfWing | null = null;
  private fullWing: THREE.Object3D | null = null;
  private gliderState: GliderState = {
    leftBrakePosition: 0,
    rightBrakePosition: 0,
    handsPosition: 0
  };

  // Constants
  private static readonly HALF_WING_LENGTH = 4000; // mm
  private static readonly DEFAULT_BAND_LENGTH = 400; // mm
  private static readonly DEFAULT_CARABINERS_SEPARATION = 300; // mm
  private static readonly BAND_WIDTH = 30;

  constructor(options: GliderOptions = {}) {
    super({
      name: 'GliderComponent',
      version: '1.0.0',
      wingColor1: '#FFA500',
      wingColor2: '#b100cd',
      breakColor: '#ffffff',
      lineFrontColor: '#ffffff',
      lineBackColor: '#ffffff',
      inletsColor: '#333333',
      numeroCajones: 40,
      carabinersSeparationMM: GliderComponent.DEFAULT_CARABINERS_SEPARATION,
      bandLength: GliderComponent.DEFAULT_BAND_LENGTH,
      showBreakLines: true,
      ...options
    });
  }

  protected createSyncContent(): THREE.Object3D {
    const container = new THREE.Object3D();
    container.name = 'GliderContainer';

    const options = this.options as GliderOptions;

    try {
      this.fullWing = this.createCompleteWing(options);
      container.add(this.fullWing);

      return container;

    } catch (error) {
      console.error('❌ Failed to create glider:', error);
      throw error;
    }
  }

  private createCompleteWing(options: GliderOptions): THREE.Object3D {
    const wing = new THREE.Object3D();
    wing.name = 'CompleteWing';

    // Create left wing
    this.leftWing = this.createHalfWing(options, true);
    this.leftWing.wing.scale.z = -1;
    wing.add(this.leftWing.wing);

    // Create right wing by cloning and mirroring
    this.rightWing = {
      wing: this.leftWing.wing.clone(),
      wingBreakSystem: this.leftWing.wingBreakSystem.clone()
    };
    this.rightWing.wing.scale.y = -1;
    this.rightWing.wing.translateY(GliderComponent.HALF_WING_LENGTH * 2);
    wing.add(this.rightWing.wing);

    // Position the complete wing
    wing.translateZ(-1 * GliderComponent.HALF_WING_LENGTH);
    wing.translateY(3000 + (options.bandLength || GliderComponent.DEFAULT_BAND_LENGTH));

    return wing;
  }

  private createHalfWing(options: GliderOptions, isLeft: boolean): HalfWing {
    const group = new THREE.Object3D();
    group.name = `${isLeft ? 'Left' : 'Right'}Wing`;

    // Create materials with resource sharing
    const wingMaterial = resourceManager.getOrCreateMaterial(
      `glider_wing_${options.wingColor1}`,
      () => new THREE.MeshPhongMaterial({ color: options.wingColor1 })
    );

    const breakMaterial = resourceManager.getOrCreateMaterial(
      `glider_break_${options.breakColor}`,
      () => new THREE.MeshPhongMaterial({ color: options.breakColor })
    );

    const frontMaterial = resourceManager.getOrCreateMaterial(
      `glider_inlets_${options.inletsColor}`,
      () => new THREE.MeshPhongMaterial({ color: options.inletsColor })
    );

    const lineMaterial = resourceManager.getOrCreateMaterial(
      `glider_line_${options.lineBackColor}`,
      () => new THREE.LineBasicMaterial({
        color: options.lineBackColor,
        transparent: true,
        opacity: 0.01
      })
    );

    const breakLineMaterial = resourceManager.getOrCreateMaterial(
      'glider_break_line_yellow',
      () => new THREE.LineBasicMaterial({
        color: 'yellow',
        transparent: true,
        opacity: 0.4
      })
    );

    // Create wing structure
    let distanceCajon = 0;
    const lineLocations: THREE.Vector3[] = [];
    const breakLineLocations: THREE.Vector3[] = [];
    const wingBreakSystem = new THREE.Group();
    const frontCajones = new THREE.Group();

    let shape = 0;
    const numeroCajones = options.numeroCajones || 8;

    // Calculate key positions
    const carabinerLocation = new THREE.Vector3(
      -3000,
      GliderComponent.HALF_WING_LENGTH - (options.carabinersSeparationMM || GliderComponent.DEFAULT_CARABINERS_SEPARATION) / 2,
      0
    );

    const handsLocation = new THREE.Vector3(
      -3100,
      GliderComponent.HALF_WING_LENGTH - (options.carabinersSeparationMM || GliderComponent.DEFAULT_CARABINERS_SEPARATION) / 2,
      120
    );

    const breaksJoinLocation = new THREE.Vector3(-2400, GliderComponent.HALF_WING_LENGTH / 1.1, 250);

    // Create cajones (wing cells)
    for (let n = 0; n < numeroCajones; n++) {
      const cajonWidth = GliderComponent.HALF_WING_LENGTH / numeroCajones;
      const cajonHeight = 10 + n * 5;
      const deep = 700 + n * 35;

      distanceCajon += cajonWidth;

      // Main wing cajon
      const cajon = this.createCajon(cajonWidth, cajonHeight, deep, wingMaterial);
      shape = (shape + (numeroCajones - n)) ^ (2 * 13.05);
      cajon.position.set(shape, distanceCajon, 0);
      group.add(cajon);

      // Break system
      const breakDeep = deep / 10;
      const breakBox = this.createCajon(cajonWidth, cajonHeight, breakDeep, breakMaterial);
      breakBox.position.set(shape, distanceCajon, deep / 2 + breakDeep);
      wingBreakSystem.add(breakBox);

      // Front inlets
      const frontCajonDeep = deep / 30;
      const frontCajon = this.createCajon(cajonWidth, cajonHeight, frontCajonDeep, frontMaterial);
      frontCajon.position.set(shape, distanceCajon, -deep / 2 - frontCajonDeep);
      frontCajones.add(frontCajon);

      // Create lines every 12th cajon
      if (n % 12 === 0) {
        // Break lines
        breakLineLocations.push(new THREE.Vector3(shape, distanceCajon, deep * 0.5));
        breakLineLocations.push(breaksJoinLocation);

        // Main lines
        lineLocations.push(new THREE.Vector3(shape, distanceCajon, deep * 0.5));
        lineLocations.push(carabinerLocation);

        lineLocations.push(new THREE.Vector3(shape, distanceCajon, -deep * 0.5));
        lineLocations.push(carabinerLocation);
      }
    }

    // Create band (harness connection)
    const band = this.createBand(options);
    band.position.copy(carabinerLocation);
    group.add(band);

    // Add sub-components
    group.add(wingBreakSystem);
    group.add(frontCajones);

    // Apply transformations
    group.rotateZ(Math.PI / 2);
    group.rotateX(Math.PI / 2);

    // Create line geometry
    if (lineLocations.length > 0) {
      const geometryLines = new THREE.BufferGeometry().setFromPoints(lineLocations);
      const lineSegments = new THREE.LineSegments(geometryLines, lineMaterial);
      group.add(lineSegments);
    }

    // Create break lines if enabled
    if (options.showBreakLines && breakLineLocations.length > 0) {
      const geometryBreakLines = new THREE.BufferGeometry().setFromPoints(breakLineLocations);
      const breakLineSegments = new THREE.LineSegments(geometryBreakLines, breakLineMaterial);
      group.add(breakLineSegments);

      // Break join to hands line
      const breakJoinToHandLocations = [breaksJoinLocation, handsLocation];
      const geometryBreakJoinToHand = new THREE.BufferGeometry().setFromPoints(breakJoinToHandLocations);
      const breakJoinToHandSegments = new THREE.LineSegments(geometryBreakJoinToHand, breakLineMaterial);
      group.add(breakJoinToHandSegments);
    }

    return { wing: group, wingBreakSystem };
  }

  private createCajon(width: number, height: number, depth: number, material: THREE.Material): THREE.Mesh {
    const geometryKey = `glider_cajon_${width}_${height}_${depth}`;
    const geometry = resourceManager.getOrCreateGeometry(geometryKey, () =>
      new THREE.BoxGeometry(width, height, depth)
    );

    const cajon = new THREE.Mesh(geometry, material);
    cajon.castShadow = this.options.castShadow ?? true;
    cajon.receiveShadow = this.options.receiveShadow ?? true;
    cajon.rotation.set(0, 0, Math.PI / 2);

    return cajon;
  }

  private createBand(options: GliderOptions): THREE.Object3D {
    const bandLength = options.bandLength || GliderComponent.DEFAULT_BAND_LENGTH;
    const bandMaterial = resourceManager.getOrCreateMaterial(
      'glider_band_red',
      () => new THREE.MeshPhongMaterial({ color: 'red' })
    );

    const group = new THREE.Object3D();
    group.name = 'Band';

    const geometry = resourceManager.getOrCreateGeometry(
      `glider_band_${GliderComponent.BAND_WIDTH}_${bandLength}`,
      () => new THREE.BoxGeometry(GliderComponent.BAND_WIDTH, bandLength, 7)
    );

    const band = new THREE.Mesh(geometry, bandMaterial);
    band.castShadow = this.options.castShadow ?? true;
    band.rotation.set(0, 0, Math.PI / 2);
    band.translateY(bandLength / 2);

    group.add(band);
    return group;
  }

  // Control methods
  public breakLeft(intensity: number = 0.5): void {
    this.gliderState.leftBrakePosition = Math.max(0, Math.min(1, intensity));
    if (this.leftWing) {
      this.leftWing.wingBreakSystem.position.x = -3 * this.gliderState.leftBrakePosition;
    }
  }

  public breakRight(intensity: number = 0.5): void {
    this.gliderState.rightBrakePosition = Math.max(0, Math.min(1, intensity));
    if (this.rightWing) {
      this.rightWing.wingBreakSystem.position.x = -3 * this.gliderState.rightBrakePosition;
    }
  }

  public handsUp(): void {
    this.gliderState.leftBrakePosition = 0;
    this.gliderState.rightBrakePosition = 0;
    this.gliderState.handsPosition = 1;

    if (this.leftWing) {
      this.leftWing.wingBreakSystem.position.x = 0;
    }
    if (this.rightWing) {
      this.rightWing.wingBreakSystem.position.x = 0;
    }
  }

  public releaseBrakes(): void {
    this.gliderState.leftBrakePosition = 0;
    this.gliderState.rightBrakePosition = 0;
    this.handsUp();
  }

  // Getters
  public getGliderState(): GliderState {
    return { ...this.gliderState };
  }

  public getLeftWing(): HalfWing | null {
    return this.leftWing;
  }

  public getRightWing(): HalfWing | null {
    return this.rightWing;
  }

  public getFullWing(): THREE.Object3D | null {
    return this.fullWing;
  }

  public getCajonCount(): number {
    return (this.options as GliderOptions).numeroCajones || 40;
  }

  public override dispose(): void {
    this.leftWing = null;
    this.rightWing = null;
    this.fullWing = null;
    super.dispose();
  }

  public override validate(): string[] {
    const issues = super.validate();
    const options = this.options as GliderOptions;

    if (options.numeroCajones && (options.numeroCajones < 1 || options.numeroCajones > 100)) {
      issues.push('numeroCajones must be between 1 and 100');
    }

    if (options.bandLength && options.bandLength < 50) {
      issues.push('bandLength must be at least 50mm');
    }

    if (!this.leftWing || !this.rightWing) {
      issues.push('Wing components not properly created');
    }

    return issues;
  }

  public override getInfo(): Record<string, any> {
    const baseInfo = super.getInfo();
    const options = this.options as GliderOptions;

    return {
      ...baseInfo,
      numeroCajones: options.numeroCajones,
      bandLength: options.bandLength,
      wingColors: {
        wingColor1: options.wingColor1,
        wingColor2: options.wingColor2,
        breakColor: options.breakColor
      },
      gliderState: this.gliderState,
      hasLeftWing: !!this.leftWing,
      hasRightWing: !!this.rightWing,
      totalCells: (options.numeroCajones || 40) * 2 // Both wings
    };
  }
}