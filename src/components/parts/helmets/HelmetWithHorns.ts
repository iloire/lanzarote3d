import * as THREE from "three";
import { BaseHelmet } from "./BaseHelmet";

export class HelmetWithHorns extends BaseHelmet {
  load(): THREE.Group {
    const group = new THREE.Group();
    
    // Main helmet shell
    const helmetMat = this.getColoredMaterial(this.options.color);
    const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 180;
    group.add(helmet);

    // Horns
    const hornMat = this.getColoredMaterial(this.options.color2);
    const hornGeo = new THREE.ConeGeometry(40, 150, 4);
    
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-120, 300, 0);
    leftHorn.rotation.z = -0.3;
    group.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(120, 300, 0);
    rightHorn.rotation.z = 0.3;
    group.add(rightHorn);

    // Bottom part
    const bottomMat = this.getColoredMaterial(this.options.color3);
    const bottomGeo = new THREE.BoxGeometry(400, 220, 290);
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.y = 0;
    bottom.position.z = -20;
    group.add(bottom);

    return group;
  }
} 