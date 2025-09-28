import * as THREE from 'three';
import { BaseHead, HeadOptions } from './BaseHead';
import { ComponentMetadata } from '../../base/IThreeComponent';

export class DevilHead extends BaseHead {
  constructor(options: HeadOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'DevilHead',
      version: '2.0.0',
      description: 'Devil pilot head with horns, fangs, and menacing features',
      author: 'Lanzarote3D',
      tags: ['character', 'head', 'devil', 'horns', 'evil'],
    };

    super(metadata, {
      headType: 'devil',
      ...options,
    });
  }

  protected createHeadGroup(): THREE.Group {
    const group = new THREE.Group();

    // Create main devil head
    group.add(this.createMainHead());

    // Add devil features
    const horns = this.createHorns();
    horns.forEach(horn => group.add(horn));

    const eyes = this.createMenacingEyes();
    eyes.forEach(eye => group.add(eye));

    const pupils = this.createPupils();
    pupils.forEach(pupil => group.add(pupil));

    // Add facial features
    group.add(this.createPointedChin());
    group.add(this.createEvilGrin());

    const fangs = this.createFangs();
    fangs.forEach(fang => group.add(fang));

    // Add helmet
    group.add(this.getHelmet());

    return group;
  }

  /**
   * Create the main devil head (larger and more menacing)
   */
  private createMainHead(): THREE.Mesh {
    const skinMaterial = this.getColoredMaterial('#ff4444');
    const headGeo = new THREE.BoxGeometry(1.8, 2, 1.6);
    const head = new THREE.Mesh(headGeo, skinMaterial);
    head.position.set(0, 2, 0);
    return head;
  }

  /**
   * Create prominent devil horns
   */
  private createHorns(): THREE.Mesh[] {
    const hornMaterial = this.getColoredMaterial('#333333');
    const hornGeo = new THREE.ConeGeometry(0.25, 1.2, 8);

    const leftHorn = new THREE.Mesh(hornGeo, hornMaterial);
    const rightHorn = new THREE.Mesh(hornGeo, hornMaterial);

    leftHorn.position.set(-0.5, 3, 0);
    rightHorn.position.set(0.5, 3, 0);
    leftHorn.rotation.z = -0.3;
    rightHorn.rotation.z = 0.3;

    return [leftHorn, rightHorn];
  }

  /**
   * Create menacing yellow eyes
   */
  private createMenacingEyes(): THREE.Mesh[] {
    const eyeMaterial = this.getColoredMaterial('#ffff00');
    const eyeGeo = new THREE.BoxGeometry(0.4, 0.25, 0.2);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);

    leftEye.position.set(-0.4, 2.2, 0.8);
    rightEye.position.set(0.4, 2.2, 0.8);

    return [leftEye, rightEye];
  }

  /**
   * Create black pupils for the eyes
   */
  private createPupils(): THREE.Mesh[] {
    const pupilMaterial = this.getColoredMaterial('#000000');
    const pupilGeo = new THREE.BoxGeometry(0.15, 0.15, 0.21);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);

    leftPupil.position.set(-0.4, 2.2, 0.81);
    rightPupil.position.set(0.4, 2.2, 0.81);

    return [leftPupil, rightPupil];
  }

  /**
   * Create sharp pointed chin
   */
  private createPointedChin(): THREE.Mesh {
    const skinMaterial = this.getColoredMaterial('#ff4444');
    const chinGeo = new THREE.ConeGeometry(0.5, 0.8, 4);
    const chin = new THREE.Mesh(chinGeo, skinMaterial);
    chin.rotation.x = Math.PI;
    chin.position.set(0, 1.2, 0);
    return chin;
  }

  /**
   * Create wide evil grin
   */
  private createEvilGrin(): THREE.Mesh {
    const mouthGeo = new THREE.BoxGeometry(1, 0.15, 0.2);
    const mouth = new THREE.Mesh(mouthGeo, this.getColoredMaterial('#000000'));
    mouth.position.set(0, 1.7, 0.8);
    return mouth;
  }

  /**
   * Create small white fangs
   */
  private createFangs(): THREE.Mesh[] {
    const fangMaterial = this.getColoredMaterial('#ffffff');
    const fangGeo = new THREE.ConeGeometry(0.08, 0.2, 4);

    const leftFang = new THREE.Mesh(fangGeo, fangMaterial);
    const rightFang = new THREE.Mesh(fangGeo, fangMaterial);

    leftFang.position.set(-0.25, 1.6, 0.8);
    rightFang.position.set(0.25, 1.6, 0.8);

    return [leftFang, rightFang];
  }
}
