import * as THREE from "three";
import { BaseHead } from "./BaseHead";
import { DefaultHelmet } from "../helmets/DefaultHelmet";
import { HelmetOptions } from "../helmets/types";

export class SkeletonHead extends BaseHead {
  private getSkeletonHelmet(): THREE.Group {
    const group = new THREE.Group();
    const mainMat = this.getColoredMaterial(this.options.helmetOptions?.color || '#ffffff');
    const accentMat = this.getColoredMaterial(this.options.helmetOptions?.color2 || '#cccccc');
    const metalMat = this.getColoredMaterial(this.options.helmetOptions?.color3 || '#999999');

    // Main helmet shell - made more angular
    const helmetGeo = new THREE.BoxGeometry(400, 200, 390);
    const helmet = new THREE.Mesh(helmetGeo, mainMat);
    helmet.position.set(0, 180, 0);
    
    // Angular face guard
    const faceGuardGeo = new THREE.BoxGeometry(420, 160, 100);
    const faceGuard = new THREE.Mesh(faceGuardGeo, accentMat);
    faceGuard.position.set(0, 120, 150);
    faceGuard.rotation.x = Math.PI * 0.15;

    // Horns
    const hornGeo = new THREE.ConeGeometry(30, 150, 4);
    const leftHorn = new THREE.Mesh(hornGeo, metalMat);
    const rightHorn = new THREE.Mesh(hornGeo, metalMat);
    
    leftHorn.position.set(-150, 250, 50);
    rightHorn.position.set(150, 250, 50);
    leftHorn.rotation.z = -0.4;
    rightHorn.rotation.z = 0.4;

    // Create spike helper function
    const createSpike = (x: number, y: number, z: number) => {
      const spikeGeo = new THREE.ConeGeometry(15, 80, 4);
      const spike = new THREE.Mesh(spikeGeo, accentMat);
      spike.position.set(x, y, z);
      return spike;
    };

    // Add row of spikes along the top
    for (let i = -3; i <= 3; i++) {
      const spike = createSpike(i * 50, 300, -50);
      spike.rotation.x = -Math.PI * 0.15;
      group.add(spike);
    }

    // Decorative side plates
    const sidePlateGeo = new THREE.BoxGeometry(50, 180, 200);
    const leftPlate = new THREE.Mesh(sidePlateGeo, metalMat);
    const rightPlate = new THREE.Mesh(sidePlateGeo, metalMat);
    
    leftPlate.position.set(-225, 150, 0);
    rightPlate.position.set(225, 150, 0);
    
    // Back guard with spikes
    const backGuardGeo = new THREE.BoxGeometry(400, 150, 50);
    const backGuard = new THREE.Mesh(backGuardGeo, accentMat);
    backGuard.position.set(0, 150, -200);

    // Add small decorative spikes on back
    const backSpikes = [];
    for (let i = -2; i <= 2; i++) {
      const spike = createSpike(i * 70, 180, -220);
      spike.rotation.x = Math.PI * 0.5;
      spike.scale.set(0.7, 0.7, 0.7);
      backSpikes.push(spike);
    }

    group.add(helmet);
    group.add(faceGuard);
    group.add(leftHorn);
    group.add(rightHorn);
    group.add(leftPlate);
    group.add(rightPlate);
    group.add(backGuard);
    backSpikes.forEach(spike => group.add(spike));

    return group;
  }

  private getHelmet(): THREE.Group {
    const helmetOptions: HelmetOptions = {
      color: '#ffffff',
      color2: '#cccccc',
      color3: '#999999'
    };
    const helmet = new DefaultHelmet(helmetOptions);
    return helmet.load();
  }

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

    // Add helmet
    const helmet = this.getSkeletonHelmet();
    helmet.scale.set(0.006, 0.006, 0.006);
    helmet.translateY(2.2);
    helmet.translateZ(-0.3);
    group.add(helmet);

    return this.applyDefaultScale(group);
  }
} 