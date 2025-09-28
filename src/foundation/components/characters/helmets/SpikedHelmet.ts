import * as THREE from 'three';
import { BaseHelmet } from './BaseHelmet';

export class SpikedHelmet extends BaseHelmet {
  load(): THREE.Group {
    const group = new THREE.Group();

    // Main helmet shell
    const helmetMat = this.getColoredMaterial(this.options.color);
    const helmetGeo = new THREE.BoxGeometry(400, 190, 390);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 180;
    group.add(helmet);

    // Create spikes around the helmet
    const spikeMat = this.getColoredMaterial(this.options.color2);
    const spikeGeo = new THREE.ConeGeometry(15, 60, 4);

    // Top spikes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 220;
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(Math.cos(angle) * radius, 250, Math.sin(angle) * radius);
      spike.rotation.z = angle + Math.PI / 2;
      group.add(spike);
    }

    // Side spikes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 210;
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(Math.cos(angle) * radius, 180, Math.sin(angle) * radius);
      spike.rotation.x = Math.PI / 2;
      spike.rotation.z = angle;
      group.add(spike);
    }

    // Bottom part with protective rim
    const bottomMat = this.getColoredMaterial(this.options.color3);
    const bottomGeo = new THREE.BoxGeometry(420, 220, 310);
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.y = 0;
    bottom.position.z = -20;
    group.add(bottom);

    // Face guard with aggressive design
    const guardMat = this.getColoredMaterial(this.options.color2);
    const guardGeo = new THREE.BoxGeometry(380, 80, 50);
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 50;
    guard.position.z = 170;
    group.add(guard);

    return group;
  }
}
