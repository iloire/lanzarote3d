import * as THREE from "three";
import { BaseHelmet } from "./BaseHelmet";

export class DefaultHelmet extends BaseHelmet {
  load(): THREE.Group {
    const group = new THREE.Group();
    
    //Helmet
    const helmetTopMat = this.getColoredMaterial(this.options.color);
    const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
    const helmet = new THREE.Mesh(helmetGeo, helmetTopMat);
    helmet.position.x = 0;
    helmet.position.z = 0;
    helmet.position.y = 180;
    group.add(helmet);

    const helmetSeparatorMat = this.getColoredMaterial(this.options.color2);
    const helmetSeparatorGeo = new THREE.BoxGeometry(420, 40, 400);
    const helmetSeparator = new THREE.Mesh(helmetSeparatorGeo, helmetSeparatorMat);
    helmetSeparator.position.x = 0;
    helmetSeparator.position.z = 0;
    helmetSeparator.position.y = 100;
    group.add(helmetSeparator);

    const helmetBottomMat = this.getColoredMaterial(this.options.color3);
    const helmetBottomGeo = new THREE.BoxGeometry(400, 220, 290);
    const helmetBottom = new THREE.Mesh(helmetBottomGeo, helmetBottomMat);
    helmetBottom.position.x = 0;
    helmetBottom.position.z = -20;
    helmetBottom.position.y = 0;
    group.add(helmetBottom);
    
    return group;
  }
} 