import * as THREE from 'three';
import { BaseHead, HeadOptions } from './BaseHead';
import { ComponentMetadata } from '../../base/IThreeComponent';

export class WarriorHead extends BaseHead {
  constructor(options: HeadOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'WarriorHead',
      version: '2.0.0',
      description: 'Warrior pilot head with beard and angular features',
      author: 'Lanzarote3D',
      tags: ['character', 'head', 'warrior', 'beard']
    };

    super(metadata, {
      headType: 'warrior',
      ...options
    });
  }
  /**
   * Create warrior beard with complex extruded geometry
   */
  private createBeard(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      color: this.headOptions.beardColor,
      flatShading: true,
    });

    const shape1 = new THREE.Shape();
    const shape2 = new THREE.Shape();

    shape1.moveTo(-0.75, 0);
    shape1.bezierCurveTo(-0.75, -0.75, -0.5, -1, -0.15, -1.5);
    shape1.lineTo(-2, -1.5);
    shape1.lineTo(-2, 0);

    shape2.moveTo(-0.75, 0);
    shape2.bezierCurveTo(-0.75, -0.75, -0.5, -1, -0.25, -1.25);
    shape2.lineTo(-2, -1.25);
    shape2.lineTo(-2, 0);

    const primarySettings = {
      steps: 2,
      depth: 1,
      bevelEnabled: false,
    };

    const secondarySettings = {
      steps: 2,
      depth: 1,
      bevelEnabled: false,
    };

    const primaryBeardGeo = new THREE.ExtrudeGeometry(shape1, primarySettings);
    const primaryBeard = new THREE.Mesh(primaryBeardGeo, material);

    const secondaryBeardGeo = new THREE.ExtrudeGeometry(shape2, secondarySettings);
    const secondaryBeardLeft = new THREE.Mesh(secondaryBeardGeo, material);
    const secondaryBeardRight = new THREE.Mesh(secondaryBeardGeo, material);

    group.add(secondaryBeardLeft);
    group.add(secondaryBeardRight);

    primaryBeard.castShadow = true;
    secondaryBeardLeft.castShadow = true;
    secondaryBeardRight.castShadow = true;

    primaryBeard.position.set(0.5, 1.5, 1.65);
    secondaryBeardLeft.position.set(1.1, 1.4, 1.3);
    secondaryBeardRight.position.set(-0.18, 1.4, 1.55);

    primaryBeard.rotation.y = -Math.PI / 2;
    secondaryBeardLeft.rotation.y = -Math.PI / 2 + 0.25;
    secondaryBeardRight.rotation.y = -Math.PI / 2 - 0.25;
    return group;
  }

  /**
   * Create warrior mustache
   */
  private createMustache(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      color: 0xcc613d,
      flatShading: true,
    });

    const mustacheGeo = new THREE.BoxGeometry(0.6, 0.2, 0.25);
    const mustacheLeft = new THREE.Mesh(mustacheGeo, material);
    const mustacheRight = new THREE.Mesh(mustacheGeo, material);

    group.add(mustacheLeft);
    group.add(mustacheRight);

    mustacheLeft.position.set(-0.25, 1.55, 0.7);
    mustacheRight.position.set(0.25, 1.55, 0.7);

    mustacheLeft.rotation.z = Math.PI / 8;
    mustacheRight.rotation.z = -Math.PI / 8;
    return group;
  }

  protected createHeadGroup(): THREE.Group {
    const group = new THREE.Group();

    // Create main head features
    const head = this.createMainHead();
    const brow = this.createBrow();
    const nose = this.createNose();

    // Add all components
    group.add(head);
    group.add(brow);
    group.add(nose);
    group.add(this.createBeard());
    group.add(this.createMustache());

    // Configure shadows
    this.configureShadows([head, brow, nose]);

    // Position features
    this.positionFeatures(head, brow, nose);

    // Add helmet
    group.add(this.createHelmet());

    // Scale the entire head
    group.scale.set(200, 200, 200);

    return group;
  }

  /**
   * Create the main warrior head mesh (more angular than default)
   */
  private createMainHead(): THREE.Mesh {
    const skinMat = this.getColoredMaterial(this.headOptions.skinColor!);
    const headGeo = new THREE.BoxGeometry(1.5, 1.5, 1.2);
    return new THREE.Mesh(headGeo, skinMat);
  }

  /**
   * Create prominent brow for warrior appearance
   */
  private createBrow(): THREE.Mesh {
    const skinMat = this.getColoredMaterial(this.headOptions.skinColor!);
    const browGeo = new THREE.BoxGeometry(1.5, 0.5, 0.5);
    return new THREE.Mesh(browGeo, skinMat);
  }

  /**
   * Create warrior nose
   */
  private createNose(): THREE.Mesh {
    const skinMat = this.getColoredMaterial(this.headOptions.skinColor!);
    const noseGeo = new THREE.BoxGeometry(0.35, 0.5, 0.5);
    return new THREE.Mesh(noseGeo, skinMat);
  }

  /**
   * Configure shadow properties for mesh array
   */
  private configureShadows(meshes: THREE.Mesh[]): void {
    meshes.forEach(mesh => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }

  /**
   * Position all facial features
   */
  private positionFeatures(head: THREE.Mesh, brow: THREE.Mesh, nose: THREE.Mesh): void {
    head.position.set(0, 2, 0);
    brow.position.set(0, 2.43, 0.46);
    nose.position.set(0, 2.05, 0.54);
    brow.rotation.x = 130;
  }

  /**
   * Create and position warrior helmet
   */
  private createHelmet(): THREE.Group {
    const helmet = this.getHelmet();
    helmet.scale.set(0.006, 0.006, 0.006);
    helmet.translateY(2.2);
    helmet.translateZ(-0.3);
    return helmet;
  }
}
