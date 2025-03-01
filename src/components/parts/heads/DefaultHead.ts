import * as THREE from "three";
import { BaseHead } from "./BaseHead";
import { GlassesType } from "../pilot-head";
import getDefaultGlasses from "../glasses/default";
import getSunGlasses1 from "../glasses/sunglasses1";

export class DefaultHead extends BaseHead {
  private getDefaultHelmet(): THREE.Group {
    const group = new THREE.Group();
    //Helmet
    const helmetTopMat = this.getColoredMaterial(this.options.helmetColor);
    const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
    const helmet = new THREE.Mesh(helmetGeo, helmetTopMat);
    helmet.position.x = 0;
    helmet.position.z = 0;
    helmet.position.y = 180;
    group.add(helmet);

    const helmetSeparatorMat = this.getColoredMaterial(this.options.helmetColor2);
    const helmetSeparatorGeo = new THREE.BoxGeometry(420, 40, 400);
    const helmetSeparator = new THREE.Mesh(helmetSeparatorGeo, helmetSeparatorMat);
    helmetSeparator.position.x = 0;
    helmetSeparator.position.z = 0;
    helmetSeparator.position.y = 100;
    group.add(helmetSeparator);

    const helmetBottomMat = this.getColoredMaterial(this.options.helmetColor3);
    const helmetBottomGeo = new THREE.BoxGeometry(400, 220, 290);
    const helmetBottom = new THREE.Mesh(helmetBottomGeo, helmetBottomMat);
    helmetBottom.position.x = 0;
    helmetBottom.position.z = -20;
    helmetBottom.position.y = 0;
    group.add(helmetBottom);
    return group;
  }

  load(): THREE.Group {
    const group = new THREE.Group();

    const skinMat = this.getColoredMaterial(this.options.skinColor);
    const headGeo = new THREE.BoxGeometry(300, 350, 280);
    const head = new THREE.Mesh(headGeo, skinMat);
    group.add(head);

    group.add(this.getDefaultHelmet());

    if (this.options.glassesType === GlassesType.SunGlasses1) {
      head.add(getSunGlasses1(this.options));
    } else {
      head.add(getDefaultGlasses(this.options));
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