import * as THREE from 'three';
import { SimpleThreeComponent } from '../base/SimpleThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';
import type { ComponentOptions } from '../base/BaseThreeComponent';

export interface WingOptions extends ComponentOptions {
  wingColor?: string;
  numeroCajones?: number;
  wingSpan?: number;
  wingScale?: THREE.Vector3;
  wingType?: 'hangglider' | 'paraglider';
}

export class Wing extends SimpleThreeComponent {
  private leftWing: THREE.Object3D | null = null;
  private rightWing: THREE.Object3D | null = null;

  constructor(options: WingOptions = {}) {
    super({
      name: 'Wing',
      version: '1.0.0',
      ...options
    });
  }

  protected createSyncContent(): THREE.Object3D {
    const container = new THREE.Object3D();
    container.name = 'WingContainer';

    const options = this.options as WingOptions;

    try {
      // Create wing based on type
      if (options.wingType === 'hangglider') {
        this.createHanggliderWing(container, options);
      } else {
        this.createParagliderWing(container, options);
      }

      return container;

    } catch (error) {
      console.error('❌ Failed to create wing:', error);
      throw error;
    }
  }

  private createHanggliderWing(container: THREE.Object3D, options: WingOptions): void {
    const numeroCajones = options.numeroCajones || 16;
    const wingScale = options.wingScale || new THREE.Vector3(1, 1, 1);

    // Create left and right wing halves
    this.leftWing = this.createHalfWing(numeroCajones, options, new THREE.Vector3(1, 1, -1));
    this.rightWing = this.createHalfWing(numeroCajones, options, new THREE.Vector3(1, -1, -1));

    // Position wings
    this.rightWing.translateY(155);

    container.add(this.leftWing);
    container.add(this.rightWing);

    // Apply overall positioning
    container.translateZ(-78);
    container.scale.copy(wingScale);
  }

  private createParagliderWing(container: THREE.Object3D, options: WingOptions): void {
    const numeroCajones = options.numeroCajones || 40;
    const wingSpan = options.wingSpan || numeroCajones * 25;
    const chordLength = 150;

    // Create wing geometry
    const wingGeometry = this.createParagliderGeometry(numeroCajones, wingSpan, chordLength);

    // Create wing material
    const wingMaterial = resourceManager.getOrCreateMaterial(
      `wing_material_${options.wingColor || '#00ffff'}`,
      () => new THREE.MeshPhongMaterial({
        color: options.wingColor || '#00ffff',
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    );

    // Create wing mesh
    const wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
    wingMesh.name = 'ParagliderWing';
    wingMesh.castShadow = this.options.castShadow ?? true;
    wingMesh.receiveShadow = this.options.receiveShadow ?? true;

    container.add(wingMesh);
  }

  private createHalfWing(
    numeroCajones: number,
    options: WingOptions,
    scale: THREE.Vector3
  ): THREE.Object3D {
    const group = new THREE.Object3D();
    group.name = 'HalfWing';

    const wingMaterial = resourceManager.getOrCreateMaterial(
      `wing_material_${options.wingColor || '#00ffff'}`,
      () => new THREE.MeshPhongMaterial({ color: options.wingColor || '#00ffff' })
    );

    let distanceCajon = 0;

    for (let i = 0; i < numeroCajones; i++) {
      const w = 2 + i * 0.5;
      const h = 0.5 + i * 0.2;
      const deep = 8 + i * 5;
      distanceCajon += w * 0.8;

      const cajon = this.createCajon(w, h, deep, wingMaterial);
      cajon.position.set(h, distanceCajon, 0 - deep / 2);

      group.add(cajon);
    }

    // Apply rotations and scale
    group.rotateZ(Math.PI / 2);
    group.rotateX(Math.PI / 2);
    group.scale.copy(scale);

    return group;
  }

  private createCajon(
    w: number,
    h: number,
    deep: number,
    material: THREE.Material
  ): THREE.Mesh {
    const geometry = resourceManager.getOrCreateGeometry(
      `wing_cajon_${w}_${h}_${deep}`,
      () => new THREE.BoxGeometry(w, h, deep)
    );

    const cajon = new THREE.Mesh(geometry, material);
    cajon.castShadow = this.options.castShadow ?? true;
    cajon.receiveShadow = this.options.receiveShadow ?? true;
    cajon.rotation.set(0, 0, Math.PI / 2);

    return cajon;
  }

  private createParagliderGeometry(
    numeroCajones: number,
    wingSpan: number,
    chordLength: number
  ): THREE.BufferGeometry {
    const geometryKey = `paraglider_wing_${numeroCajones}_${wingSpan}_${chordLength}`;

    return resourceManager.getOrCreateGeometry(geometryKey, () => {
      const geometry = new THREE.BufferGeometry();

      const vertices: number[] = [];
      const indices: number[] = [];
      const uvs: number[] = [];

      const segments = numeroCajones;
      const chordSegments = 10;

      // Generate wing surface vertices with airfoil shape
      for (let i = 0; i <= segments; i++) {
        const spanPos = (i / segments - 0.5) * wingSpan;

        for (let j = 0; j <= chordSegments; j++) {
          const chordPos = (j / chordSegments) * chordLength;

          // Create airfoil-like shape (NACA-like profile)
          const thickness = 0.12; // 12% thickness
          const camber = 0.02; // 2% camber

          const x = chordPos / chordLength;
          const yt = 5 * thickness * chordLength * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
          const yc = camber * chordLength * (x < 0.4 ? 1.4845 * (x - x * x) : 0.2969 * (1.0 - x));

          const y = yc + yt * (j > chordSegments / 2 ? -1 : 1);

          vertices.push(spanPos, y, chordPos - chordLength / 2);
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
    });
  }

  // Wing control methods
  public breakLeft(intensity: number = 0.5): void {
    if (this.leftWing) {
      // TODO: Implement wing deformation for braking
      const scale = 1 - intensity * 0.2;
      this.leftWing.scale.y = scale;
    }
  }

  public breakRight(intensity: number = 0.5): void {
    if (this.rightWing) {
      // TODO: Implement wing deformation for braking
      const scale = 1 - intensity * 0.2;
      this.rightWing.scale.y = scale;
    }
  }

  public releaseBrakes(): void {
    if (this.leftWing) {
      this.leftWing.scale.y = 1;
    }
    if (this.rightWing) {
      this.rightWing.scale.y = 1;
    }
  }

  // Getters
  public getLeftWing(): THREE.Object3D | null {
    return this.leftWing;
  }

  public getRightWing(): THREE.Object3D | null {
    return this.rightWing;
  }

  public getWingType(): string {
    return (this.options as WingOptions).wingType || 'hangglider';
  }

  public getCajonCount(): number {
    return (this.options as WingOptions).numeroCajones || 16;
  }

  public override dispose(): void {
    this.leftWing = null;
    this.rightWing = null;
    super.dispose();
  }

  public override validate(): string[] {
    const issues = super.validate();

    const options = this.options as WingOptions;

    if (options.wingType === 'hangglider') {
      if (!this.leftWing || !this.rightWing) {
        issues.push('Hangglider wings not properly created');
      }
    }

    if (options.numeroCajones && (options.numeroCajones < 1 || options.numeroCajones > 100)) {
      issues.push('Invalid numeroCajones value (must be 1-100)');
    }

    return issues;
  }

  public override getInfo(): Record<string, any> {
    const baseInfo = super.getInfo();
    const options = this.options as WingOptions;

    return {
      ...baseInfo,
      wingType: options.wingType || 'hangglider',
      numeroCajones: options.numeroCajones || 16,
      wingSpan: options.wingSpan,
      hasLeftWing: !!this.leftWing,
      hasRightWing: !!this.rightWing
    };
  }
}

export default Wing;