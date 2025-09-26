import * as THREE from 'three';
import { BaseHelmet } from './BaseHelmet';

export class CrownHelmet extends BaseHelmet {
  load(): THREE.Group {
    const group = new THREE.Group();

    // Main helmet shell - more regal design
    const helmetMat = this.getColoredMaterial(this.options.color);
    const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 180;
    group.add(helmet);

    // Crown elements on top
    const crownMat = this.getColoredMaterial(this.options.color2);

    // Main crown ring
    const crownRingGeo = new THREE.TorusGeometry(220, 20, 8, 16);
    const crownRing = new THREE.Mesh(crownRingGeo, crownMat);
    crownRing.position.y = 280;
    crownRing.rotation.x = Math.PI / 2;
    group.add(crownRing);

    // Crown points/spires
    const spireGeo = new THREE.ConeGeometry(25, 120, 6);
    const positions = [
      { x: 0, z: 0, height: 150 }, // Center spire (tallest)
      { x: 150, z: 0, height: 100 },
      { x: -150, z: 0, height: 100 },
      { x: 0, z: 150, height: 100 },
      { x: 0, z: -150, height: 100 },
      { x: 106, z: 106, height: 80 },
      { x: -106, z: 106, height: 80 },
      { x: 106, z: -106, height: 80 },
      { x: -106, z: -106, height: 80 },
    ];

    positions.forEach(pos => {
      const spire = new THREE.Mesh(spireGeo, crownMat);
      spire.position.set(pos.x, 280 + pos.height / 2, pos.z);
      spire.scale.y = pos.height / 120; // Scale height
      group.add(spire);
    });

    // Decorative gems/jewels
    const gemMat = this.getColoredMaterial(this.options.color3);
    const gemGeo = new THREE.OctahedronGeometry(15);

    // Gems on the main crown ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(
        Math.cos(angle) * 220,
        280,
        Math.sin(angle) * 220
      );
      group.add(gem);
    }

    // Face protection with royal design
    const faceMat = this.getColoredMaterial(this.options.color);
    const faceGeo = new THREE.BoxGeometry(360, 180, 40);
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.y = 100;
    face.position.z = 180;
    group.add(face);

    // Royal bottom section
    const bottomMat = this.getColoredMaterial(this.options.color3);
    const bottomGeo = new THREE.BoxGeometry(420, 200, 310);
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.y = 0;
    bottom.position.z = -20;
    group.add(bottom);

    // Decorative trim around the helmet
    const trimMat = this.getColoredMaterial(this.options.color2);
    const trimGeo = new THREE.TorusGeometry(210, 8, 6, 16);
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = 180;
    trim.rotation.x = Math.PI / 2;
    group.add(trim);

    return group;
  }
}