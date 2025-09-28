import * as THREE from 'three';
import { BaseHelmet } from './BaseHelmet';

export class SharkHelmet extends BaseHelmet {
  load(): THREE.Group {
    const group = new THREE.Group();

    // Main helmet shell - streamlined shark-like shape
    const helmetMat = this.getColoredMaterial(this.options.color);
    const helmetGeo = new THREE.SphereGeometry(200, 16, 12);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 180;
    helmet.scale.set(1, 0.9, 1.3); // Elongated for aerodynamic look
    group.add(helmet);

    // Shark fin on top
    const finMat = this.getColoredMaterial(this.options.color2);
    const finGeo = new THREE.ConeGeometry(60, 180, 3);
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.y = 320;
    fin.rotation.z = Math.PI; // Point upward
    fin.scale.set(1, 1, 0.3); // Flatten for fin shape
    group.add(fin);

    // Side fins for aerodynamics
    const sideFin1 = new THREE.Mesh(finGeo, finMat);
    sideFin1.position.set(-150, 180, 0);
    sideFin1.rotation.z = Math.PI / 2;
    sideFin1.scale.set(0.6, 0.6, 0.2);
    group.add(sideFin1);

    const sideFin2 = new THREE.Mesh(finGeo, finMat);
    sideFin2.position.set(150, 180, 0);
    sideFin2.rotation.z = -Math.PI / 2;
    sideFin2.scale.set(0.6, 0.6, 0.2);
    group.add(sideFin2);

    // Aggressive front snout
    const snoutMat = this.getColoredMaterial(this.options.color);
    const snoutGeo = new THREE.ConeGeometry(80, 150, 8);
    const snout = new THREE.Mesh(snoutGeo, snoutMat);
    snout.position.y = 180;
    snout.position.z = 220;
    snout.rotation.x = Math.PI / 2;
    group.add(snout);

    // Gills on the sides for ventilation
    const gillMat = this.getColoredMaterial(this.options.color3);
    const gillGeo = new THREE.BoxGeometry(150, 20, 10);

    // Left gills
    for (let i = 0; i < 3; i++) {
      const gill = new THREE.Mesh(gillGeo, gillMat);
      gill.position.set(-180, 160 + i * 30, 100 + i * 20);
      gill.rotation.y = -0.3;
      group.add(gill);
    }

    // Right gills
    for (let i = 0; i < 3; i++) {
      const gill = new THREE.Mesh(gillGeo, gillMat);
      gill.position.set(180, 160 + i * 30, 100 + i * 20);
      gill.rotation.y = 0.3;
      group.add(gill);
    }

    // Teeth-like bottom edge
    const toothMat = this.getColoredMaterial('#ffffff');
    const toothGeo = new THREE.ConeGeometry(8, 30, 3);

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.position.set(Math.cos(angle) * 190, 50, Math.sin(angle) * 190);
      tooth.rotation.z = Math.PI;
      group.add(tooth);
    }

    // Bottom protection
    const bottomMat = this.getColoredMaterial(this.options.color3);
    const bottomGeo = new THREE.BoxGeometry(380, 180, 280);
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.y = 0;
    bottom.position.z = -10;
    group.add(bottom);

    return group;
  }
}
