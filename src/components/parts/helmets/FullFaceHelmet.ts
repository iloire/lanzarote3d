import * as THREE from "three";
import { BaseHelmet } from "./BaseHelmet";

export class FullFaceHelmet extends BaseHelmet {
  load(): THREE.Group {
    const group = new THREE.Group();
    
    // Main helmet shell
    const helmetMat = this.getColoredMaterial(this.options.color);
    const helmetGeo = new THREE.BoxGeometry(400, 400, 390);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 50;
    group.add(helmet);

    // Visor
    const visorMat = this.getColoredMaterial('#222222');
    const visorGeo = new THREE.BoxGeometry(350, 150, 50);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.y = 50;
    visor.position.z = 170;
    group.add(visor);

    // Bottom trim
    const trimMat = this.getColoredMaterial(this.options.color2);
    const trimGeo = new THREE.BoxGeometry(420, 40, 400);
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = -120;
    group.add(trim);

    // Ventilation
    const ventMat = this.getColoredMaterial(this.options.color3);
    const ventGeo = new THREE.BoxGeometry(100, 20, 50);
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.y = 150;
    vent.position.z = 170;
    group.add(vent);

    return group;
  }
} 