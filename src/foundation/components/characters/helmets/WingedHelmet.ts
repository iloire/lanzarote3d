import * as THREE from 'three';
import { BaseHelmet } from './BaseHelmet';

export class WingedHelmet extends BaseHelmet {
  load(): THREE.Group {
    const group = new THREE.Group();

    // Main helmet shell - more rounded design
    const helmetMat = this.getColoredMaterial(this.options.color);
    const helmetGeo = new THREE.SphereGeometry(200, 16, 12);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 180;
    helmet.scale.set(1, 0.8, 1);
    group.add(helmet);

    // Wings - feathered design
    const wingMat = this.getColoredMaterial(this.options.color2);

    // Left wing
    const leftWingGeo = new THREE.ConeGeometry(80, 300, 8);
    const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
    leftWing.position.set(-250, 220, 0);
    leftWing.rotation.z = Math.PI / 2;
    leftWing.rotation.y = -0.3;
    leftWing.scale.set(1, 0.3, 2);
    group.add(leftWing);

    // Right wing
    const rightWing = new THREE.Mesh(leftWingGeo, wingMat);
    rightWing.position.set(250, 220, 0);
    rightWing.rotation.z = -Math.PI / 2;
    rightWing.rotation.y = 0.3;
    rightWing.scale.set(1, 0.3, 2);
    group.add(rightWing);

    // Wing details - feather segments
    const featherMat = this.getColoredMaterial(this.options.color3);
    const featherGeo = new THREE.BoxGeometry(40, 8, 120);

    // Left wing feathers
    for (let i = 0; i < 4; i++) {
      const feather = new THREE.Mesh(featherGeo, featherMat);
      feather.position.set(-200 - i * 30, 200 + i * 10, i * 20);
      feather.rotation.z = 0.3;
      group.add(feather);
    }

    // Right wing feathers
    for (let i = 0; i < 4; i++) {
      const feather = new THREE.Mesh(featherGeo, featherMat);
      feather.position.set(200 + i * 30, 200 + i * 10, i * 20);
      feather.rotation.z = -0.3;
      group.add(feather);
    }

    // Bottom part
    const bottomMat = this.getColoredMaterial(this.options.color3);
    const bottomGeo = new THREE.BoxGeometry(400, 200, 290);
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.y = 0;
    bottom.position.z = -20;
    group.add(bottom);

    // Nose guard with elegant curve
    const noseMat = this.getColoredMaterial(this.options.color);
    const noseGeo = new THREE.BoxGeometry(40, 120, 60);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.y = 80;
    nose.position.z = 180;
    group.add(nose);

    return group;
  }
}
