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

    // Create main head mesh
    const head = this.createMainHead();
    group.add(head);

    // Add helmet
    group.add(this.getHelmet());

    // Add glasses
    head.add(this.createGlasses());

    // Add facial features
    head.add(this.createMouth());
    head.add(this.createLip());

    return group;
  }

  /**
   * Create the main head mesh
   */
  private createMainHead(): THREE.Mesh {
    const skinMat = this.getColoredMaterial(this.headOptions.skinColor!);
    const headGeo = new THREE.BoxGeometry(300, 350, 280);
    return new THREE.Mesh(headGeo, skinMat);
  }

  /**
   * Create glasses based on type
   */
  private createGlasses(): THREE.Group {
    if (this.headOptions.glassesType === GlassesType.SunGlasses1) {
      return getSunGlasses1();
    } else {
      // Convert HeadOptions to PilotHeadOptions for glasses compatibility
      const glassesOptions = {
        skinColor: this.headOptions.skinColor,
        glassesColor: this.headOptions.glassesColor,
        glassesType: this.headOptions.glassesType
      };
      return getDefaultGlasses(glassesOptions as any);
    }
  }

  /**
   * Create mouth feature
   */
  private createMouth(): THREE.Mesh {
    const skinMat = this.getColoredMaterial(this.headOptions.skinColor!);
    const mouthGeo = new THREE.BoxGeometry(90, 60, 50);
    const mouth = new THREE.Mesh(mouthGeo, skinMat);
    mouth.position.set(0, -130, 155);
    return mouth;
  }

  /**
   * Create lip feature
   */
  private createLip(): THREE.Mesh {
    const lipMat = this.getColoredMaterial('#333');
    const lipGeo = new THREE.BoxGeometry(40, 20, 50);
    const lip = new THREE.Mesh(lipGeo, lipMat);
    lip.position.set(0, -120, 162);
    return lip;
  }
}
