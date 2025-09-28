import * as THREE from 'three';
import { BaseHead, HeadOptions } from './BaseHead';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { GlassesType } from '../PilotHead';
import getDefaultGlasses from '../glasses/default';
import getSunGlasses1 from '../glasses/sunglasses1';

export class DefaultHead extends BaseHead {
  constructor(options: HeadOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'DefaultHead',
      version: '2.0.0',
      description: 'Default pilot head with basic facial features',
      author: 'Lanzarote3D',
      tags: ['character', 'head', 'default']
    };

    super(metadata, {
      headType: 'default',
      ...options
    });
  }

  protected createHeadGroup(): THREE.Group {
    const group = new THREE.Group();

    const skinMat = this.getColoredMaterial(this.headOptions.skinColor!);
    const headGeo = new THREE.BoxGeometry(300, 350, 280);
    const head = new THREE.Mesh(headGeo, skinMat);
    group.add(head);

    group.add(this.getHelmet());

    if (this.headOptions.glassesType === GlassesType.SunGlasses1) {
      head.add(getSunGlasses1());
    } else {
      // Convert HeadOptions to PilotHeadOptions for glasses compatibility
      const glassesOptions = {
        skinColor: this.headOptions.skinColor,
        glassesColor: this.headOptions.glassesColor,
        glassesType: this.headOptions.glassesType
      };
      head.add(getDefaultGlasses(glassesOptions as any));
    }

    //mouth
    const mouthGeo = new THREE.BoxGeometry(90, 60, 50);
    const mouth = new THREE.Mesh(mouthGeo, skinMat);
    mouth.position.x = 0;
    mouth.position.z = 155;
    mouth.position.y = -130;
    head.add(mouth);

    //lip
    const lipMat = this.getColoredMaterial('#333');
    const lipGeo = new THREE.BoxGeometry(40, 20, 50);
    const lip = new THREE.Mesh(lipGeo, lipMat);
    lip.position.x = 0;
    lip.position.z = 162;
    lip.position.y = -120;
    head.add(lip);

    return group;
  }
}
