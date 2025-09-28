import * as THREE from 'three';
import { AsyncThreeComponent } from '../base/AsyncThreeComponent';
import { PilotVoxelComponent } from '../characters/PilotVoxelComponent';
import { CharacterType } from '../characters/CharacterRegistry';
import { resourceManager } from '../../systems/ResourceManager';
import type { ComponentOptions } from '../base/BaseThreeComponent';

export interface ParagliderOptions extends ComponentOptions {
  characterType?: CharacterType;
  wingColor1?: string;
  wingColor2?: string;
  breakColor?: string;
  lineFrontColor?: string;
  lineBackColor?: string;
  inletsColor?: string;
  numeroCajones?: number;
  bandLength?: number;
  carabinersSeparationMM?: number;
  showAxesHelper?: boolean;
}

export interface FlyingState {
  leftBrakePosition: number;  // 0-1
  rightBrakePosition: number; // 0-1
  speedBarPosition: number;   // 0-1
  isFlying: boolean;
}

export class Paraglider extends AsyncThreeComponent {
  private pilot: PilotVoxelComponent | null = null;
  private wing: THREE.Object3D | null = null;
  private axesHelper: THREE.AxesHelper | null = null;
  private flyingState: FlyingState = {
    leftBrakePosition: 0,
    rightBrakePosition: 0,
    speedBarPosition: 0,
    isFlying: false
  };

  private wingGeometry: THREE.BufferGeometry | null = null;
  private wingMaterial: THREE.Material | null = null;

  constructor(options: ParagliderOptions = {}) {
    super({
      name: 'Paraglider',
      version: '1.0.0',
      ...options
    });
  }

  protected async createAsyncContent(): Promise<THREE.Object3D> {
    const container = new THREE.Object3D();
    container.name = 'ParagliderContainer';

    const options = this.options as ParagliderOptions;

    try {
      // Create wing
      this.wing = await this.createWing(options);
      if (this.wing) {
        container.add(this.wing);
      }

      // Create pilot
      this.pilot = new PilotVoxelComponent({
        characterType: options.characterType || CharacterType.ADRI,
        scale: 0.01,
        castShadow: options.castShadow,
        receiveShadow: options.receiveShadow
      });

      const pilotMesh = await this.pilot.load();

      // Position pilot relative to paraglider
      pilotMesh.position.set(17, -300, -0.4);
      pilotMesh.rotateY(Math.PI / 2);

      container.add(pilotMesh);

      // Add axes helper if requested
      if (options.showAxesHelper) {
        this.axesHelper = new THREE.AxesHelper(100);
        this.axesHelper.visible = true;
        container.add(this.axesHelper);
      }

      return container;

    } catch (error) {
      console.error('❌ Failed to create paraglider:', error);
      throw error;
    }
  }

  private async createWing(options: ParagliderOptions): Promise<THREE.Object3D> {
    const wing = new THREE.Object3D();
    wing.name = 'ParagliderWing';

    // Wing parameters
    const numeroCajones = options.numeroCajones || 40;
    const bandLength = options.bandLength || 500;
    const wingSpan = numeroCajones * 25; // Approximate wing span
    const chordLength = bandLength * 0.3; // Approximate chord

    // Create wing geometry using shared resources
    const wingKey = `paraglider_wing_${numeroCajones}_${bandLength}`;
    this.wingGeometry = resourceManager.getOrCreateGeometry(wingKey, () => {
      return this.createWingGeometry(numeroCajones, wingSpan, chordLength);
    });

    // Create wing materials
    const materialKey = `paraglider_material_${options.wingColor1}_${options.wingColor2}`;
    this.wingMaterial = resourceManager.getOrCreateMaterial(materialKey, () => {
      return new THREE.MeshPhongMaterial({
        color: options.wingColor1 || '#ff4444',
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
    });

    // Create wing mesh
    const wingMesh = new THREE.Mesh(this.wingGeometry, this.wingMaterial);
    wingMesh.name = 'WingMesh';
    wingMesh.castShadow = this.options.castShadow ?? true;
    wingMesh.receiveShadow = this.options.receiveShadow ?? true;

    // Position wing
    wingMesh.position.set(300, -300, 0);
    wing.add(wingMesh);

    // Create wing lines/strings
    const lines = this.createWingLines(numeroCajones, options);
    wing.add(lines);

    return wing;
  }

  private createWingGeometry(numeroCajones: number, wingSpan: number, chordLength: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    // Simple wing shape - can be enhanced with more realistic airfoil shape
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    const segments = numeroCajones;
    const chordSegments = 10;

    // Generate wing surface vertices
    for (let i = 0; i <= segments; i++) {
      const spanPos = (i / segments - 0.5) * wingSpan;

      for (let j = 0; j <= chordSegments; j++) {
        const chordPos = (j / chordSegments) * chordLength;

        // Create airfoil-like shape
        const y = Math.sin(j / chordSegments * Math.PI) * 20;

        vertices.push(spanPos, y, chordPos);
        uvs.push(i / segments, j / chordSegments);
      }
    }

    // Generate indices for triangles
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < chordSegments; j++) {
        const a = i * (chordSegments + 1) + j;
        const b = a + chordSegments + 1;
        const c = a + 1;
        const d = b + 1;

        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    return geometry;
  }

  private createWingLines(numeroCajones: number, options: ParagliderOptions): THREE.Object3D {
    const linesGroup = new THREE.Object3D();
    linesGroup.name = 'WingLines';

    const lineMaterial = new THREE.LineBasicMaterial({
      color: options.lineFrontColor || '#000000',
      linewidth: 2
    });

    // Create suspension lines
    for (let i = 0; i < numeroCajones; i++) {
      const x = (i - numeroCajones / 2) * 25;

      const lineGeometry = new THREE.BufferGeometry();
      const lineVertices = [
        x, -300, 0,     // Wing attachment point
        x * 0.3, -600, 0  // Pilot attachment point
      ];

      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));

      const line = new THREE.Line(lineGeometry, lineMaterial);
      linesGroup.add(line);
    }

    return linesGroup;
  }

  // Flying controls
  public leftBrake(intensity: number = 0.5): void {
    this.flyingState.leftBrakePosition = Math.max(0, Math.min(1, intensity));
    this.updateWingShape();
  }

  public rightBrake(intensity: number = 0.5): void {
    this.flyingState.rightBrakePosition = Math.max(0, Math.min(1, intensity));
    this.updateWingShape();
  }

  public speedBar(intensity: number = 0.5): void {
    this.flyingState.speedBarPosition = Math.max(0, Math.min(1, intensity));
    this.updateWingShape();
  }

  public releaseBrakes(): void {
    this.flyingState.leftBrakePosition = 0;
    this.flyingState.rightBrakePosition = 0;
    this.updateWingShape();
  }

  public releaseSpeedBar(): void {
    this.flyingState.speedBarPosition = 0;
    this.updateWingShape();
  }

  private updateWingShape(): void {
    // TODO: Implement wing deformation based on brake/speedbar input
    // This would modify the wing geometry to show realistic brake effects
  }

  // Character switching
  public async switchCharacter(characterType: CharacterType): Promise<void> {
    if (!this.pilot || !this.object3D) return;

    try {
      // Remove current pilot
      const oldPilotMesh = this.pilot.getObject3D();
      if (oldPilotMesh && this.object3D.children.includes(oldPilotMesh)) {
        this.object3D.remove(oldPilotMesh);
      }
      this.pilot.dispose();

      // Create new pilot
      this.pilot = new PilotVoxelComponent({
        characterType,
        scale: 0.01,
        castShadow: this.options.castShadow,
        receiveShadow: this.options.receiveShadow
      });

      const newPilotMesh = await this.pilot.load();
      newPilotMesh.position.set(17, -300, -0.4);
      newPilotMesh.rotateY(Math.PI / 2);

      this.object3D.add(newPilotMesh);

    } catch (error) {
      console.error('❌ Failed to switch character:', error);
      throw error;
    }
  }

  // Getters
  public getFlyingState(): FlyingState {
    return { ...this.flyingState };
  }

  public getPilot(): PilotVoxelComponent | null {
    return this.pilot;
  }

  public getWing(): THREE.Object3D | null {
    return this.wing;
  }

  public toggleAxesHelper(): void {
    if (this.axesHelper) {
      this.axesHelper.visible = !this.axesHelper.visible;
    }
  }

  public override dispose(): void {
    // Dispose pilot
    if (this.pilot) {
      this.pilot.dispose();
      this.pilot = null;
    }

    // Clean up geometries and materials (handled by ResourceManager)
    this.wingGeometry = null;
    this.wingMaterial = null;
    this.wing = null;
    this.axesHelper = null;

    super.dispose();
  }

  public override validate(): string[] {
    const issues = super.validate();

    if (!this.pilot) {
      issues.push('Pilot component not initialized');
    }

    if (!this.wing) {
      issues.push('Wing component not created');
    }

    return issues;
  }

  public override getInfo(): Record<string, any> {
    const baseInfo = super.getInfo();

    return {
      ...baseInfo,
      pilot: this.pilot?.getInfo() || null,
      flyingState: this.flyingState,
      wingVertices: this.wingGeometry?.attributes.position?.count || 0
    };
  }
}