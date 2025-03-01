import * as THREE from "three";
import { BaseHead } from "./BaseHead";

export class SkeletonHead extends BaseHead {


  load(): THREE.Group {
    const group = new THREE.Group();
    const boneMaterial = this.getColoredMaterial('#e8e8e8'); // Off-white color for bones
    const eyeSocketMaterial = this.getColoredMaterial('#1a1a1a'); // Darker black for depth
    const teethMaterial = this.getColoredMaterial('#ffffff'); // Pure white for teeth
    const innerSkullMaterial = this.getColoredMaterial('#d4d4d4'); // Slightly darker for inner parts
    const pupilMaterial = this.getColoredMaterial('#00ff00'); // Eerie green for pupils
    
    // Skull base
    const skullGeo = new THREE.BoxGeometry(1.5, 1.8, 1.4);
    const skull = new THREE.Mesh(skullGeo, boneMaterial);
    skull.position.set(0, 2, 0);
    
    // Jaw with slightly different color
    const jawGeo = new THREE.BoxGeometry(1.5, 0.4, 1.4);
    const jaw = new THREE.Mesh(jawGeo, innerSkullMaterial);
    jaw.position.set(0, 1.2, 0);
    
    // Eye sockets with depth effect
    const eyeSocketGeo = new THREE.BoxGeometry(0.5, 0.5, 0.4);
    const eyeSocketBackGeo = new THREE.BoxGeometry(0.4, 0.4, 0.2);
    
    // Left eye socket layers
    const leftEyeSocket = new THREE.Mesh(eyeSocketGeo, eyeSocketMaterial);
    const leftEyeSocketBack = new THREE.Mesh(eyeSocketBackGeo, this.getColoredMaterial('#000000'));
    leftEyeSocket.position.set(-0.35, 2.2, 0.7);
    leftEyeSocketBack.position.set(-0.35, 2.2, 0.6);
    
    // Left floating pupil
    const leftPupilGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const leftPupil = new THREE.Mesh(leftPupilGeo, pupilMaterial);
    leftPupil.position.set(-0.35, 2.2, 0.65);
    
    // Right eye socket layers
    const rightEyeSocket = new THREE.Mesh(eyeSocketGeo, eyeSocketMaterial);
    const rightEyeSocketBack = new THREE.Mesh(eyeSocketBackGeo, this.getColoredMaterial('#000000'));
    rightEyeSocket.position.set(0.35, 2.2, 0.7);
    rightEyeSocketBack.position.set(0.35, 2.2, 0.6);
    
    // Nose hole with depth
    const noseHoleGeo = new THREE.BoxGeometry(0.4, 0.4, 0.3);
    const noseHoleBack = new THREE.BoxGeometry(0.3, 0.3, 0.2);
    const noseHole = new THREE.Mesh(noseHoleGeo, eyeSocketMaterial);
    const noseHoleInner = new THREE.Mesh(noseHoleBack, this.getColoredMaterial('#000000'));
    noseHole.position.set(0, 1.9, 0.7);
    noseHoleInner.position.set(0, 1.9, 0.6);
    
    // Teeth
    const teethGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const toothGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
      const tooth = new THREE.Mesh(toothGeo, teethMaterial);
      tooth.position.set(-0.45 + (i * 0.3), 1.4, 0.7);
      teethGroup.add(tooth);
    }

    // Add all parts to the group
    group.add(skull);
    group.add(jaw);
    group.add(leftEyeSocket);
    group.add(rightEyeSocket);
    group.add(leftEyeSocketBack);
    group.add(rightEyeSocketBack);
    group.add(noseHole);
    group.add(noseHoleInner);
    group.add(teethGroup);

    group.add(this.getHelmet());

    return this.applyDefaultScale(group);
  }
} 