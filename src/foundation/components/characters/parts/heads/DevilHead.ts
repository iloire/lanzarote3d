import * as THREE from "three";
import { BaseHead } from "./BaseHead";

export class DevilHead extends BaseHead {
  load(): THREE.Group {
    const group = new THREE.Group();
    const skinMaterial = this.getColoredMaterial('#ff4444');
    const hornMaterial = this.getColoredMaterial('#333333');
    const eyeMaterial = this.getColoredMaterial('#ffff00');
    const pupilMaterial = this.getColoredMaterial('#000000');
    
    // Head base - made slightly larger
    const headGeo = new THREE.BoxGeometry(1.8, 2, 1.6);
    const head = new THREE.Mesh(headGeo, skinMaterial);
    head.position.set(0, 2, 0);
    
    // Larger, more prominent horns
    const hornGeo = new THREE.ConeGeometry(0.25, 1.2, 8);
    const leftHorn = new THREE.Mesh(hornGeo, hornMaterial);
    const rightHorn = new THREE.Mesh(hornGeo, hornMaterial);
    
    leftHorn.position.set(-0.5, 3, 0);
    rightHorn.position.set(0.5, 3, 0);
    leftHorn.rotation.z = -0.3;
    rightHorn.rotation.z = 0.3;
    
    // Larger, more menacing eyes
    const eyeGeo = new THREE.BoxGeometry(0.4, 0.25, 0.2);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    
    leftEye.position.set(-0.4, 2.2, 0.8);
    rightEye.position.set(0.4, 2.2, 0.8);
    
    // Add black pupils
    const pupilGeo = new THREE.BoxGeometry(0.15, 0.15, 0.21);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    
    leftPupil.position.set(-0.4, 2.2, 0.81);
    rightPupil.position.set(0.4, 2.2, 0.81);
    
    // Sharper pointed chin
    const chinGeo = new THREE.ConeGeometry(0.5, 0.8, 4);
    const chin = new THREE.Mesh(chinGeo, skinMaterial);
    chin.rotation.x = Math.PI;
    chin.position.set(0, 1.2, 0);
    
    // Evil grin - made wider and more pronounced
    const mouthGeo = new THREE.BoxGeometry(1, 0.15, 0.2);
    const mouth = new THREE.Mesh(mouthGeo, this.getColoredMaterial('#000000'));
    mouth.position.set(0, 1.7, 0.8);
    
    // Add small fangs
    const fangGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
    const leftFang = new THREE.Mesh(fangGeo, this.getColoredMaterial('#ffffff'));
    const rightFang = new THREE.Mesh(fangGeo, this.getColoredMaterial('#ffffff'));
    
    leftFang.position.set(-0.25, 1.6, 0.8);
    rightFang.position.set(0.25, 1.6, 0.8);
    
    group.add(head);
    group.add(leftHorn);
    group.add(rightHorn);
    group.add(leftEye);
    group.add(rightEye);
    group.add(leftPupil);
    group.add(rightPupil);
    group.add(chin);
    group.add(mouth);
    group.add(leftFang);
    group.add(rightFang);

    group.add(this.getHelmet());

    return group;
  }
} 