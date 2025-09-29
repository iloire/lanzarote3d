import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export enum HangGliderDesignType {
  CLASSIC_BOXES = 'classic_boxes', // Original simple box design
  REALISTIC_AIRFOIL = 'realistic_airfoil', // New realistic aerodynamic design
  COMPETITION = 'competition', // Future: High-performance racing design
  VINTAGE = 'vintage', // Future: 1970s style hang glider
}

export interface HangGliderWingOptions extends SimpleComponentOptions {
  designType?: HangGliderDesignType;
  wingColor?: string;
  leadingEdgeColor?: string;
  trailingEdgeColor?: string;
  controlBarColor?: string;
  cableColor?: string;
  wingspan?: number;
  chordLength?: number;
  sweep?: number; // Wing sweep angle in radians
  dihedral?: number; // Wing dihedral angle in radians
  showControlFrame?: boolean;
  showCables?: boolean;
  battens?: number; // Number of wing battens
}

/**
 * Multi-design hang glider wing component with various styles
 * Supports classic box design, realistic aerodynamic shape, and future designs
 */
export class HangGliderWing extends SimpleThreeComponent {
  constructor(options: HangGliderWingOptions = {}) {
    super(
      {
        name: 'HangGliderWing',
        version: '2.0.0',
        description: 'Multi-design hang glider wing with selectable styles',
      },
      {
        designType: HangGliderDesignType.REALISTIC_AIRFOIL, // Default to new realistic design
        wingColor: '#FF6B35', // Orange fabric
        leadingEdgeColor: '#2C3E50', // Dark aluminum
        trailingEdgeColor: '#34495E', // Lighter aluminum
        controlBarColor: '#E74C3C', // Red control bar
        cableColor: '#BDC3C7', // Steel cables
        wingspan: 100,
        chordLength: 30,
        sweep: Math.PI / 12, // 15 degrees sweep
        dihedral: Math.PI / 24, // 7.5 degrees dihedral
        showControlFrame: true,
        showCables: true,
        battens: 12,
        castShadow: true,
        receiveShadow: true,
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // This won't be used since we override createObject for complex assembly
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const options = this.options as HangGliderWingOptions;
    const designType = options.designType || HangGliderDesignType.REALISTIC_AIRFOIL;

    // Route to the appropriate design implementation
    switch (designType) {
      case HangGliderDesignType.CLASSIC_BOXES:
        return this.createClassicBoxDesign(options);
      case HangGliderDesignType.REALISTIC_AIRFOIL:
        return this.createRealisticAirfoilDesign(options);
      case HangGliderDesignType.COMPETITION:
        return this.createCompetitionDesign(options);
      case HangGliderDesignType.VINTAGE:
        return this.createVintageDesign(options);
      default:
        return this.createRealisticAirfoilDesign(options);
    }
  }

  /**
   * Create the classic box-based hang glider design (original implementation)
   */
  private createClassicBoxDesign(options: HangGliderWingOptions): THREE.Object3D {
    const wingGroup = new THREE.Group();
    wingGroup.name = 'HangGliderWing_Classic';

    const wingspan = options.wingspan || 100;
    const numeroCajones = options.battens || 16;
    const wingMaterial = resourceManager.getOrCreateMaterial(
      `classic_wing_${options.wingColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wingColor || '#00ffff' })
    );

    // Create classic "cajones" (boxes) design
    const createCajon = (w: number, h: number, deep: number): THREE.Mesh => {
      const geo = resourceManager.getOrCreateGeometry(
        `classic_cajon_${w}_${h}_${deep}`,
        () => new THREE.BoxGeometry(w, h, deep)
      );
      const cajon = new THREE.Mesh(geo, wingMaterial);
      cajon.castShadow = true;
      cajon.rotation.set(0, 0, Math.PI / 2);
      return cajon;
    };

    const createHalfWing = (scale?: THREE.Vector3): THREE.Object3D => {
      const group = new THREE.Group();
      let distanceCajon = 0;

      for (let i = 0; i < numeroCajones; i++) {
        const w = 2 + i * 0.5;
        const h = 0.5 + i * 0.2;
        const deep = 8 + i * 5;
        distanceCajon += w * 0.8;

        const cajon = createCajon(w, h, deep);
        cajon.position.set(h, distanceCajon, 0 - deep / 2);
        group.add(cajon);
      }

      group.rotateZ(Math.PI / 2);
      group.rotateX(Math.PI / 2);
      if (scale) {
        group.scale.set(scale.x, scale.y, scale.z);
      }
      return group;
    };

    // Create left and right wing halves
    const leftWing = createHalfWing(new THREE.Vector3(1, 1, -1));
    const rightWing = createHalfWing(new THREE.Vector3(1, -1, -1));
    rightWing.translateY(wingspan * 1.55);

    wingGroup.add(leftWing);
    wingGroup.add(rightWing);
    wingGroup.translateZ(-wingspan * 0.78);

    // Apply shadow settings
    wingGroup.castShadow = options.castShadow ?? true;
    wingGroup.receiveShadow = options.receiveShadow ?? true;

    return wingGroup;
  }

  /**
   * Create the realistic airfoil-based hang glider design (new implementation)
   */
  private createRealisticAirfoilDesign(options: HangGliderWingOptions): THREE.Object3D {
    const wingGroup = new THREE.Group();
    wingGroup.name = 'HangGliderWing_Realistic';

    // Create wing fabric (main surface)
    const wingMesh = this.createWingFabric(options);
    wingGroup.add(wingMesh);

    // Create leading edge tubes
    const leadingEdge = this.createLeadingEdge(options);
    wingGroup.add(leadingEdge);

    // Create trailing edge
    const trailingEdge = this.createTrailingEdge(options);
    wingGroup.add(trailingEdge);

    // Create wing battens for structural support
    const battens = this.createBattens(options);
    wingGroup.add(battens);

    // Create control frame if enabled
    if (options.showControlFrame) {
      const controlFrame = this.createControlFrame(options);
      wingGroup.add(controlFrame);
    }

    // Create rigging cables if enabled
    if (options.showCables) {
      const cables = this.createRiggingCables(options);
      wingGroup.add(cables);
    }

    // Apply overall positioning and shadow settings
    wingGroup.castShadow = options.castShadow ?? true;
    wingGroup.receiveShadow = options.receiveShadow ?? true;

    return wingGroup;
  }

  /**
   * Create competition-style hang glider design (future implementation)
   */
  private createCompetitionDesign(options: HangGliderWingOptions): THREE.Object3D {
    // For now, use realistic design as base
    // TODO: Implement high-performance competition wing with:
    // - Higher aspect ratio
    // - More aggressive sweep
    // - Racing colors
    // - Advanced materials
    const wing = this.createRealisticAirfoilDesign(options);
    wing.name = 'HangGliderWing_Competition';

    // Apply competition-specific modifications
    wing.scale.set(1.2, 1, 1.4); // Longer, more aggressive proportions

    return wing;
  }

  /**
   * Create vintage 1970s-style hang glider design (future implementation)
   */
  private createVintageDesign(options: HangGliderWingOptions): THREE.Object3D {
    // For now, use classic design as base
    // TODO: Implement vintage 1970s design with:
    // - Simpler geometry
    // - Earth tone colors
    // - Wider, shorter proportions
    // - Minimal rigging
    const wing = this.createClassicBoxDesign(options);
    wing.name = 'HangGliderWing_Vintage';

    // Apply vintage-specific modifications
    wing.scale.set(0.8, 1, 1.2); // Wider, shorter vintage proportions

    return wing;
  }

  private createWingFabric(options: HangGliderWingOptions): THREE.Mesh {
    const wingspan = options.wingspan || 100;
    const chordLength = options.chordLength || 30;
    const sweep = options.sweep || 0;
    const dihedral = options.dihedral || 0;

    // Create wing shape with proper aerodynamic profile
    const wingShape = new THREE.Shape();

    // Create airfoil-like cross-section (simplified NACA profile)
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = t * chordLength;

      // Simple airfoil shape - thicker at front, thin at back
      const thickness = chordLength * 0.12 * (0.3 * Math.sqrt(t) - 0.13 * t - 0.13 * t * t + 0.05 * t * t * t);
      const y = i === 0 || i === segments ? 0 : thickness;

      if (i === 0) {
        wingShape.moveTo(x, y);
      } else {
        wingShape.lineTo(x, y);
      }
    }

    // Close the shape
    wingShape.lineTo(0, 0);

    // Extrude the wing profile along wingspan
    const extrudeSettings = {
      depth: wingspan,
      bevelEnabled: false,
      steps: 20,
    };

    const wingGeometry = resourceManager.getOrCreateGeometry(
      `hangglider_wing_${wingspan}_${chordLength}_${sweep}_${dihedral}`,
      () => {
        const geometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);

        // Apply sweep and dihedral transformations
        const vertices = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < vertices.length; i += 3) {
          const z = vertices[i + 2]; // Wing span position
          const spanPosition = z / wingspan - 0.5; // -0.5 to 0.5

          // Apply sweep (backward angle)
          vertices[i] += Math.tan(sweep) * Math.abs(spanPosition) * wingspan * 0.3;

          // Apply dihedral (upward angle)
          vertices[i + 1] += Math.tan(dihedral) * Math.abs(spanPosition) * wingspan * 0.1;
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        // Center the wing
        geometry.translate(-chordLength * 0.3, 0, -wingspan * 0.5);

        return geometry;
      }
    );

    const wingMaterial = resourceManager.getOrCreateMaterial(
      `hangglider_wing_fabric_${options.wingColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.wingColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        roughness: 0.7,
        metalness: 0.1,
      })
    );

    return new THREE.Mesh(wingGeometry, wingMaterial);
  }

  private createLeadingEdge(options: HangGliderWingOptions): THREE.Group {
    const leadingEdgeGroup = new THREE.Group();
    const wingspan = options.wingspan || 100;
    const tubeRadius = 1.2;
    const segments = 16;

    // Create curved leading edge tubes (left and right)
    const tubeGeometry = resourceManager.getOrCreateGeometry(
      `hangglider_leading_edge_tube_${wingspan}`,
      () => new THREE.CylinderGeometry(tubeRadius, tubeRadius, wingspan * 0.5, segments)
    );

    const tubeMaterial = resourceManager.getOrCreateMaterial(
      `hangglider_leading_edge_${options.leadingEdgeColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.leadingEdgeColor,
        metalness: 0.7,
        roughness: 0.3,
      })
    );

    // Left leading edge
    const leftTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    leftTube.position.set(-5, 0, -wingspan * 0.25);
    leftTube.rotation.z = Math.PI / 2;
    leftTube.castShadow = true;
    leadingEdgeGroup.add(leftTube);

    // Right leading edge
    const rightTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    rightTube.position.set(-5, 0, wingspan * 0.25);
    rightTube.rotation.z = Math.PI / 2;
    rightTube.castShadow = true;
    leadingEdgeGroup.add(rightTube);

    return leadingEdgeGroup;
  }

  private createTrailingEdge(options: HangGliderWingOptions): THREE.Group {
    const trailingEdgeGroup = new THREE.Group();
    const wingspan = options.wingspan || 100;
    const chordLength = options.chordLength || 30;

    // Create thin trailing edge reinforcement
    const edgeGeometry = resourceManager.getOrCreateGeometry(
      `hangglider_trailing_edge_${wingspan}`,
      () => new THREE.BoxGeometry(0.5, 1, wingspan * 0.9)
    );

    const edgeMaterial = resourceManager.getOrCreateMaterial(
      `hangglider_trailing_edge_${options.trailingEdgeColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.trailingEdgeColor,
        metalness: 0.6,
        roughness: 0.4,
      })
    );

    const trailingEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    trailingEdge.position.set(chordLength * 0.7, 0, 0);
    trailingEdge.castShadow = true;
    trailingEdgeGroup.add(trailingEdge);

    return trailingEdgeGroup;
  }

  private createBattens(options: HangGliderWingOptions): THREE.Group {
    const battensGroup = new THREE.Group();
    const wingspan = options.wingspan || 100;
    const chordLength = options.chordLength || 30;
    const numBattens = options.battens || 12;

    const battenGeometry = resourceManager.getOrCreateGeometry(
      'hangglider_batten',
      () => new THREE.CylinderGeometry(0.3, 0.3, chordLength * 0.8, 8)
    );

    const battenMaterial = resourceManager.getOrCreateMaterial(
      'hangglider_batten_material',
      () => new THREE.MeshStandardMaterial({
        color: '#95A5A6',
        metalness: 0.5,
        roughness: 0.5,
      })
    );

    // Create battens across the wingspan
    for (let i = 1; i < numBattens; i++) {
      const spanPosition = (i / (numBattens - 1) - 0.5) * wingspan * 0.8;

      const batten = new THREE.Mesh(battenGeometry, battenMaterial);
      batten.position.set(chordLength * 0.2, -0.5, spanPosition);
      batten.rotation.z = Math.PI / 2;
      batten.castShadow = true;
      battensGroup.add(batten);
    }

    return battensGroup;
  }

  private createControlFrame(options: HangGliderWingOptions): THREE.Group {
    const controlGroup = new THREE.Group();

    // A-frame structure
    const frameGeometry = resourceManager.getOrCreateGeometry(
      'hangglider_control_bar',
      () => new THREE.CylinderGeometry(0.8, 0.8, 60, 12)
    );

    const frameMaterial = resourceManager.getOrCreateMaterial(
      `hangglider_control_bar_${options.controlBarColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.controlBarColor,
        metalness: 0.8,
        roughness: 0.2,
      })
    );

    // Horizontal control bar
    const controlBar = new THREE.Mesh(frameGeometry, frameMaterial);
    controlBar.position.set(15, -8, 0);
    controlBar.rotation.z = Math.PI / 2;
    controlBar.castShadow = true;
    controlGroup.add(controlBar);

    // Vertical support struts
    const strutGeometry = resourceManager.getOrCreateGeometry(
      'hangglider_strut',
      () => new THREE.CylinderGeometry(0.6, 0.6, 20, 10)
    );

    const leftStrut = new THREE.Mesh(strutGeometry, frameMaterial);
    leftStrut.position.set(5, -18, -15);
    leftStrut.rotation.x = Math.PI / 6;
    leftStrut.castShadow = true;
    controlGroup.add(leftStrut);

    const rightStrut = new THREE.Mesh(strutGeometry, frameMaterial);
    rightStrut.position.set(5, -18, 15);
    rightStrut.rotation.x = -Math.PI / 6;
    rightStrut.castShadow = true;
    controlGroup.add(rightStrut);

    return controlGroup;
  }

  private createRiggingCables(options: HangGliderWingOptions): THREE.Group {
    const cablesGroup = new THREE.Group();
    const wingspan = options.wingspan || 100;

    const cableMaterial = resourceManager.getOrCreateMaterial(
      `hangglider_cables_${options.cableColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.cableColor,
        metalness: 0.9,
        roughness: 0.1,
      })
    );

    // Create flying wires (main support cables)
    const wirePositions = [
      { from: [0, 0, -wingspan * 0.3], to: [15, -8, 0] },
      { from: [0, 0, wingspan * 0.3], to: [15, -8, 0] },
      { from: [-10, 0, -wingspan * 0.2], to: [5, -18, -15] },
      { from: [-10, 0, wingspan * 0.2], to: [5, -18, 15] },
    ];

    wirePositions.forEach((wire, index) => {
      const start = new THREE.Vector3(...wire.from);
      const end = new THREE.Vector3(...wire.to);
      const direction = end.clone().sub(start);
      const length = direction.length();

      const cableGeometry = resourceManager.getOrCreateGeometry(
        `hangglider_cable_${index}`,
        () => new THREE.CylinderGeometry(0.1, 0.1, length, 6)
      );

      const cable = new THREE.Mesh(cableGeometry, cableMaterial);
      cable.position.copy(start.clone().add(end).multiplyScalar(0.5));
      cable.lookAt(end);
      cable.rotateX(Math.PI / 2);
      cable.castShadow = false; // Cables are thin, don't need shadows
      cablesGroup.add(cable);
    });

    return cablesGroup;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as HangGliderWingOptions;

    if (options.wingspan && options.wingspan <= 0) {
      issues.push('Wingspan must be greater than 0');
    }

    if (options.chordLength && options.chordLength <= 0) {
      issues.push('Chord length must be greater than 0');
    }

    if (options.battens && options.battens < 0) {
      issues.push('Number of battens cannot be negative');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as HangGliderWingOptions;

    return {
      name: 'HangGliderWing',
      version: '2.0.0',
      type: 'vehicle_component',
      designType: options.designType || HangGliderDesignType.REALISTIC_AIRFOIL,
      wingspan: options.wingspan,
      chordLength: options.chordLength,
      sweep: options.sweep ? (options.sweep * 180 / Math.PI).toFixed(1) + '°' : '0°',
      dihedral: options.dihedral ? (options.dihedral * 180 / Math.PI).toFixed(1) + '°' : '0°',
      battens: options.battens,
      hasControlFrame: options.showControlFrame,
      hasCables: options.showCables,
      colors: {
        wing: options.wingColor,
        leadingEdge: options.leadingEdgeColor,
        controlBar: options.controlBarColor,
      },
      availableDesigns: Object.values(HangGliderDesignType),
    };
  }
}

// Legacy export for backward compatibility with old API
class HangGliderWingLegacy {
  private component: HangGliderWing;

  constructor(options: HangGliderWingOptions = {}) {
    this.component = new HangGliderWing(options);
  }

  async load(_gui?: any): Promise<THREE.Mesh> {
    const wingObject = await this.component.load();
    return wingObject as THREE.Mesh; // Cast for compatibility
  }
}

export default HangGliderWingLegacy;