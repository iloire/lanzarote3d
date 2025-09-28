import * as THREE from 'three';
import { BaseHead, HeadOptions } from './BaseHead';
import { ComponentMetadata } from '../../base/IThreeComponent';

export class SkeletonHead extends BaseHead {
  constructor(options: HeadOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'SkeletonHead',
      version: '2.0.0',
      description: 'Skeleton pilot head with bone-like appearance and eerie features',
      author: 'Lanzarote3D',
      tags: ['character', 'head', 'skeleton', 'spooky']
    };

    super(metadata, {
      headType: 'skeleton',
      ...options
    });
  }

  protected createHeadGroup(): THREE.Group {
    const group = new THREE.Group();

    // Create main skull components
    group.add(this.createSkull());
    group.add(this.createJaw());

    // Create eye features
    const eyeSockets = this.createEyeSockets();
    eyeSockets.forEach(socket => group.add(socket));

    const pupils = this.createPupils();
    pupils.forEach(pupil => group.add(pupil));

    // Create nose hole
    const noseHoles = this.createNoseHole();
    noseHoles.forEach(hole => group.add(hole));

    // Create teeth
    group.add(this.createTeeth());

    // Add helmet
    group.add(this.getHelmet());

    // Scale the entire skull
    group.scale.set(200, 200, 200);

    return group;
  }

  /**
   * Create the main skull bone structure
   */
  private createSkull(): THREE.Mesh {
    const boneMaterial = this.getColoredMaterial('#e8e8e8'); // Off-white color for bones
    const skullGeo = new THREE.BoxGeometry(1.5, 1.8, 1.4);
    const skull = new THREE.Mesh(skullGeo, boneMaterial);
    skull.position.set(0, 2, 0);
    return skull;
  }

  /**
   * Create the jaw bone with different coloring
   */
  private createJaw(): THREE.Mesh {
    const innerSkullMaterial = this.getColoredMaterial('#d4d4d4'); // Slightly darker for inner parts
    const jawGeo = new THREE.BoxGeometry(1.5, 0.4, 1.4);
    const jaw = new THREE.Mesh(jawGeo, innerSkullMaterial);
    jaw.position.set(0, 1.2, 0);
    return jaw;
  }

  /**
   * Create eye sockets with depth effect
   */
  private createEyeSockets(): THREE.Mesh[] {
    const eyeSocketMaterial = this.getColoredMaterial('#1a1a1a'); // Darker black for depth
    const blackMaterial = this.getColoredMaterial('#000000');
    const eyeSocketGeo = new THREE.BoxGeometry(0.5, 0.5, 0.4);
    const eyeSocketBackGeo = new THREE.BoxGeometry(0.4, 0.4, 0.2);

    // Left eye socket layers
    const leftEyeSocket = new THREE.Mesh(eyeSocketGeo, eyeSocketMaterial);
    const leftEyeSocketBack = new THREE.Mesh(eyeSocketBackGeo, blackMaterial);
    leftEyeSocket.position.set(-0.35, 2.2, 0.7);
    leftEyeSocketBack.position.set(-0.35, 2.2, 0.6);

    // Right eye socket layers
    const rightEyeSocket = new THREE.Mesh(eyeSocketGeo, eyeSocketMaterial);
    const rightEyeSocketBack = new THREE.Mesh(eyeSocketBackGeo, blackMaterial);
    rightEyeSocket.position.set(0.35, 2.2, 0.7);
    rightEyeSocketBack.position.set(0.35, 2.2, 0.6);

    return [leftEyeSocket, leftEyeSocketBack, rightEyeSocket, rightEyeSocketBack];
  }

  /**
   * Create eerie floating pupils
   */
  private createPupils(): THREE.Mesh[] {
    const pupilMaterial = this.getColoredMaterial('#00ff00'); // Eerie green for pupils
    const pupilGeo = new THREE.SphereGeometry(0.1, 8, 8);

    // Left floating pupil
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    leftPupil.position.set(-0.35, 2.2, 0.65);

    // Right floating pupil
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    rightPupil.position.set(0.35, 2.2, 0.65);

    return [leftPupil, rightPupil];
  }

  /**
   * Create nose cavity with depth
   */
  private createNoseHole(): THREE.Mesh[] {
    const eyeSocketMaterial = this.getColoredMaterial('#1a1a1a');
    const blackMaterial = this.getColoredMaterial('#000000');

    const noseHoleGeo = new THREE.BoxGeometry(0.4, 0.4, 0.3);
    const noseHoleBack = new THREE.BoxGeometry(0.3, 0.3, 0.2);

    const noseHole = new THREE.Mesh(noseHoleGeo, eyeSocketMaterial);
    const noseHoleInner = new THREE.Mesh(noseHoleBack, blackMaterial);

    noseHole.position.set(0, 1.9, 0.7);
    noseHoleInner.position.set(0, 1.9, 0.6);

    return [noseHole, noseHoleInner];
  }

  /**
   * Create skeleton teeth
   */
  private createTeeth(): THREE.Group {
    const teethMaterial = this.getColoredMaterial('#ffffff'); // Pure white for teeth
    const teethGroup = new THREE.Group();

    for (let i = 0; i < 4; i++) {
      const toothGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
      const tooth = new THREE.Mesh(toothGeo, teethMaterial);
      tooth.position.set(-0.45 + i * 0.3, 1.4, 0.7);
      teethGroup.add(tooth);
    }

    return teethGroup;
  }
}
