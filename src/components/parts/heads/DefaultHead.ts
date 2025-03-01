import * as THREE from "three";
import { BaseHead } from "./BaseHead";
import { GlassesType } from "../pilot-head";
import getDefaultGlasses from "../glasses/default";
import getSunGlasses1 from "../glasses/sunglasses1";

export class DefaultHead extends BaseHead {
 

  load(): THREE.Group {
    const group = new THREE.Group();

    const skinMat = this.getColoredMaterial(this.options.skinColor);
    const headGeo = new THREE.BoxGeometry(300, 350, 280);
    const head = new THREE.Mesh(headGeo, skinMat);
    group.add(head);

    group.add(this.getHelmet());

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