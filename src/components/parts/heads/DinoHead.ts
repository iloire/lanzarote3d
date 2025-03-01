import * as THREE from "three";
import { BaseHead } from "./BaseHead";

export class DinoHead extends BaseHead {
  load(): THREE.Group {
    const group = new THREE.Group();
    const skinMaterial = this.getColoredMaterial('#4CAF50'); // Green skin
    const darkMaterial = this.getColoredMaterial('#2E7D32'); // Darker green for details
    const eyeMaterial = this.getColoredMaterial('#FDD835'); // Yellow eyes
    const pupilMaterial = this.getColoredMaterial('#000000'); // Black pupils
    
    // Main head shape (elongated for snout)
    const headGeo = new THREE.BoxGeometry(1.4, 1.2, 2.5);
    const head = new THREE.Mesh(headGeo, skinMaterial);
    head.position.set(0, 2, 0.4);
    
    // Upper jaw/snout
    const snoutGeo = new THREE.BoxGeometry(1.2, 0.8, 1.8);
    const snout = new THREE.Mesh(snoutGeo, skinMaterial);
    snout.position.set(0, 1.8, 1.5);
    
    // Lower jaw
    const jawGeo = new THREE.BoxGeometry(1.1, 0.5, 1.6);
    const jaw = new THREE.Mesh(jawGeo, skinMaterial);
    jaw.position.set(0, 1.4, 1.4);
    
    // Eyes with pupils
    const eyeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.2);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    
    leftEye.position.set(-0.5, 2.3, 1.2);
    rightEye.position.set(0.5, 2.3, 1.2);
    
    const pupilGeo = new THREE.BoxGeometry(0.2, 0.2, 0.21);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    
    leftPupil.position.set(-0.5, 2.3, 1.3);
    rightPupil.position.set(0.5, 2.3, 1.3);
    
    // Head spikes
    const spikeGeo = new THREE.ConeGeometry(0.15, 0.5, 4);
    const spikes: THREE.Mesh[] = [];
    
    // Create 5 spikes along the head
    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(spikeGeo, darkMaterial);
      spike.rotation.x = -Math.PI / 6; // Tilt back slightly
      spike.position.set(0, 2.4, 0.8 - (i * 0.4));
      spikes.push(spike);
    }
    
    // Teeth
    const toothGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
    const teeth: THREE.Mesh[] = [];
    
    // Upper teeth
    for (let i = 0; i < 6; i++) {
      const tooth = new THREE.Mesh(toothGeo, this.getColoredMaterial('#FFFFFF'));
      tooth.rotation.x = Math.PI;
      tooth.position.set(-0.3 + (i * 0.12), 1.6, 2);
      teeth.push(tooth);
    }
    
    // Nostrils
    const nostrilGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const leftNostril = new THREE.Mesh(nostrilGeo, darkMaterial);
    const rightNostril = new THREE.Mesh(nostrilGeo, darkMaterial);
    
    leftNostril.position.set(-0.3, 1.9, 2.2);
    rightNostril.position.set(0.3, 1.9, 2.2);
    
    // Add all elements to group
    group.add(head);
    group.add(snout);
    group.add(jaw);
    group.add(leftEye);
    group.add(rightEye);
    group.add(leftPupil);
    group.add(rightPupil);
    group.add(leftNostril);
    group.add(rightNostril);
    
    spikes.forEach(spike => group.add(spike));
    teeth.forEach(tooth => group.add(tooth));
    
    return this.applyDefaultScale(group);
  }
} 