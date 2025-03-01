import * as THREE from "three";
import { BaseHead } from "./BaseHead";
import { DefaultHelmet } from "../helmets/DefaultHelmet";
import { HelmetOptions } from "../helmets/types";

export class WarriorHead extends BaseHead {
  private addBeard(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      color: this.options.beardColor,
      flatShading: true
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
      bevelEnabled: false
    };

    const secondarySettings = {
      steps: 2,
      depth: 1,
      bevelEnabled: false
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

  private addMustache(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      color: 0xcc613d,
      flatShading: true
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

  private getHelmet(): THREE.Group {
    const helmetOptions: HelmetOptions = {
      color: '#ffffff',
      color2: '#cccccc',
      color3: '#999999'
    };
    const helmet = new DefaultHelmet(helmetOptions);
    return helmet.load();
  }

  load(): THREE.Group {
    const group = new THREE.Group();
    const skinMat = this.getColoredMaterial(this.options.skinColor);
    const headGeo = new THREE.BoxGeometry(1.5, 1.5, 1.2);
    const head = new THREE.Mesh(headGeo, skinMat);

    const browGeo = new THREE.BoxGeometry(1.5, 0.5, 0.5);
    const brow = new THREE.Mesh(browGeo, skinMat);

    const noseGeo = new THREE.BoxGeometry(0.35, 0.5, 0.5);
    const nose = new THREE.Mesh(noseGeo, skinMat);

    group.add(head);
    group.add(brow);
    group.add(nose);
    group.add(this.addBeard());
    group.add(this.addMustache());

    head.castShadow = true;
    head.receiveShadow = true;
    brow.castShadow = true;
    nose.castShadow = true;

    head.position.set(0, 2, 0);
    brow.position.set(0, 2.43, 0.46);
    nose.position.set(0, 2.05, 0.54);

    brow.rotation.x = 130;

    const helmet = this.getHelmet();
    helmet.scale.set(0.006, 0.006, 0.006);
    helmet.translateY(2.2);
    helmet.translateZ(-0.3);
    group.add(helmet);

    return this.applyDefaultScale(group);
  }
} 