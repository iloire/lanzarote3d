import * as THREE from "three";
import { Water as WaterEffect } from "three/examples/jsm/objects/Water";
import waterTexture from "../textures/waternormals.jpg";
import Models from "../utils/models";

export default class Water {
  load() {
    const waterGeometry = new THREE.PlaneGeometry(1000000, 1000000);
    const water = new WaterEffect(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader(Models.manager).load(
        waterTexture,
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x0072ff,
      distortionScale: 4,
    });
    water.rotation.x = -Math.PI / 2;
    return water;
  }
}
