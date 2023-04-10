import * as THREE from "three";
import { Water as WaterEffect } from "three/examples/jsm/objects/Water";
import waterTexture from "../textures/waternormals.jpg";
import Models from "../utils/models";

const USE_PLAIN_WATER = false;

export default class Water {
  load(sunPosition: THREE.Vector3) {
    const waterGeometry = new THREE.PlaneGeometry(100000, 100000);
    if (USE_PLAIN_WATER) {
      const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const meshWater = new THREE.Mesh(waterGeometry, mat);
      meshWater.rotation.x = -Math.PI / 2;
      return meshWater;
    } else {
      const water = new WaterEffect(waterGeometry, {
        // textureWidth: 512,
        // textureHeight: 512,
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
      water.material.uniforms["sunDirection"].value
        .copy(sunPosition)
        .normalize();
      water.receiveShadow = true;
      return water;
    }
  }
}
