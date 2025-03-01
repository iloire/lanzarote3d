import * as THREE from "three";
import { DevilHead } from "./DevilHead";

export class DevilWithHelmet extends DevilHead {
  private getHelmet(): THREE.Group {
    const helmetGroup = new THREE.Group();
    const helmetMaterial = this.getColoredMaterial('#FFD700'); // Gold color for helmet
    
    // Main helmet piece (slightly larger than head to fit horns)
    const helmetGeo = new THREE.BoxGeometry(2, 2.2, 1.8);
    const helmet = new THREE.Mesh(helmetGeo, helmetMaterial);
    helmet.position.set(0, 2, -0.1); // Slightly back to show face
    
    // Helmet side pieces
    const sidePieceGeo = new THREE.BoxGeometry(0.4, 1.5, 1.8);
    const leftSide = new THREE.Mesh(sidePieceGeo, helmetMaterial);
    const rightSide = new THREE.Mesh(sidePieceGeo, helmetMaterial);
    
    leftSide.position.set(-1.1, 1.8, -0.1);
    rightSide.position.set(1.1, 1.8, -0.1);
    
    // Top crest
    const crestGeo = new THREE.BoxGeometry(0.3, 1.2, 1.4);
    const crest = new THREE.Mesh(crestGeo, helmetMaterial);
    crest.position.set(0, 3.2, -0.2);
    
    // Add holes for horns (negative spaces)
    const hornHoleGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.2, 8);
    const leftHornHole = new THREE.Mesh(hornHoleGeo, new THREE.MeshBasicMaterial({ 
      colorWrite: false, 
      depthWrite: true 
    }));
    const rightHornHole = new THREE.Mesh(hornHoleGeo, new THREE.MeshBasicMaterial({ 
      colorWrite: false, 
      depthWrite: true 
    }));
    
    leftHornHole.position.set(-0.5, 2.5, 0);
    rightHornHole.position.set(0.5, 2.5, 0);
    leftHornHole.rotation.z = -0.3;
    rightHornHole.rotation.z = 0.3;
    
    helmetGroup.add(helmet);
    helmetGroup.add(leftSide);
    helmetGroup.add(rightSide);
    helmetGroup.add(crest);
    helmetGroup.add(leftHornHole);
    helmetGroup.add(rightHornHole);
    
    return helmetGroup;
  }

  load(): THREE.Group {
    const finalGroup = new THREE.Group();
    
    // Get the base devil head
    const devilHead = super.load();
    
    // Add the helmet
    const helmet = this.getHelmet();
    helmet.scale.set(200, 200, 200);
    helmet.translateY(-230);
    
    finalGroup.add(devilHead);
    finalGroup.add(helmet);
    
    return finalGroup;
  }
} 