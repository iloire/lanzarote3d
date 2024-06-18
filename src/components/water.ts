import * as THREE from "three";
import { Water as WaterEffect } from "three/examples/jsm/objects/Water";
import waterTexture from "../textures/waternormals.jpg";
import Models from "../utils/models";

const USE_PLAIN_WATER = true;

export type WaterOptions = {
  size: number;
}

export default class Water {
  options: WaterOptions;

  constructor(options: WaterOptions) {
    this.options = options;
  }

  load(sunPosition: THREE.Vector3) {
    const waterGeometry = new THREE.PlaneGeometry(this.options.size, this.options.size);
    if (USE_PLAIN_WATER) {
      const mat = new THREE.MeshLambertMaterial({ color: 0x6CB4EE });
      mat.transparent = true;
      mat.opacity = 0.7;
      const meshWater = new THREE.Mesh(waterGeometry, mat);
      meshWater.rotation.x = -Math.PI / 2;
      return meshWater;
    } else {
      function animate() {
        water.material.uniforms["time"].value += 1.0 / 60.0;
        requestAnimationFrame(animate);
      }
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
      animate();
      return water;
    }
  }
}
