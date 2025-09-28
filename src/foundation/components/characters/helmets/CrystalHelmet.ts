import * as THREE from 'three';
import { BaseHelmet } from './BaseHelmet';

export class CrystalHelmet extends BaseHelmet {
  load(): THREE.Group {
    const group = new THREE.Group();

    // Main helmet shell - crystalline base
    const helmetMat = this.getColoredMaterial(this.options.color);
    const helmetGeo = new THREE.OctahedronGeometry(180, 1);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 180;
    helmet.scale.set(1.2, 1, 1.2);
    group.add(helmet);

    // Large crystal formations growing from the helmet
    const crystalMat = this.getColoredMaterial(this.options.color2);

    // Main central crystal
    const centerCrystalGeo = new THREE.OctahedronGeometry(40, 1);
    const centerCrystal = new THREE.Mesh(centerCrystalGeo, crystalMat);
    centerCrystal.position.y = 300;
    centerCrystal.scale.set(1, 2.5, 1);
    group.add(centerCrystal);

    // Surrounding crystal cluster
    const positions = [
      { x: 120, y: 280, z: 0, scale: 1.5 },
      { x: -120, y: 280, z: 0, scale: 1.5 },
      { x: 0, y: 290, z: 120, scale: 1.8 },
      { x: 0, y: 290, z: -120, scale: 1.8 },
      { x: 80, y: 260, z: 80, scale: 1.2 },
      { x: -80, y: 260, z: 80, scale: 1.2 },
      { x: 80, y: 260, z: -80, scale: 1.2 },
      { x: -80, y: 260, z: -80, scale: 1.2 },
    ];

    positions.forEach(pos => {
      const crystal = new THREE.Mesh(centerCrystalGeo, crystalMat);
      crystal.position.set(pos.x, pos.y, pos.z);
      crystal.scale.set(0.7, pos.scale, 0.7);
      crystal.rotation.x = Math.random() * 0.5;
      crystal.rotation.z = Math.random() * 0.5;
      group.add(crystal);
    });

    // Prismatic visor
    const visorMat = this.getColoredMaterial(this.options.color3);
    const visorGeo = new THREE.BoxGeometry(300, 100, 30);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.y = 150;
    visor.position.z = 160;

    // Make visor semi-transparent and refractive-looking
    if (visor.material instanceof THREE.MeshBasicMaterial) {
      visor.material.transparent = true;
      visor.material.opacity = 0.7;
    }
    group.add(visor);

    // Crystal growths on the sides
    const sideGrowthGeo = new THREE.ConeGeometry(25, 80, 6);

    // Left side crystals
    for (let i = 0; i < 4; i++) {
      const crystal = new THREE.Mesh(sideGrowthGeo, crystalMat);
      crystal.position.set(-160 - i * 10, 140 + i * 20, 50 + i * 30);
      crystal.rotation.z = Math.PI / 4;
      crystal.scale.set(0.8, 1 + i * 0.2, 0.8);
      group.add(crystal);
    }

    // Right side crystals
    for (let i = 0; i < 4; i++) {
      const crystal = new THREE.Mesh(sideGrowthGeo, crystalMat);
      crystal.position.set(160 + i * 10, 140 + i * 20, 50 + i * 30);
      crystal.rotation.z = -Math.PI / 4;
      crystal.scale.set(0.8, 1 + i * 0.2, 0.8);
      group.add(crystal);
    }

    // Crystalline bottom section
    const bottomMat = this.getColoredMaterial(this.options.color3);
    const bottomGeo = new THREE.CylinderGeometry(200, 220, 200, 8);
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.y = 0;
    bottom.position.z = -20;
    group.add(bottom);

    // Small detail crystals around the base
    const detailGeo = new THREE.OctahedronGeometry(12, 1);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const detail = new THREE.Mesh(detailGeo, crystalMat);
      detail.position.set(Math.cos(angle) * 210, 100, Math.sin(angle) * 210);
      detail.scale.set(1, 1.5, 1);
      group.add(detail);
    }

    return group;
  }
}
