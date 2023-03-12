import * as THREE from "three";

const textureURL =
  "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg";
const displacementURL =
  "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg";
const worldURL =
  "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/hipp8_s.jpg";

export default class Moon {
  mesh: THREE.Mesh;

  load(radius: number): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(radius, 60, 60);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(textureURL);
    const displacementMap = textureLoader.load(displacementURL);
    const worldTexture = textureLoader.load(worldURL);

    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: texture,
      displacementMap: displacementMap,
      displacementScale: 0.06,
      bumpMap: displacementMap,
      bumpScale: 0.04,
      reflectivity: 0,
      shininess: 0,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    return this.mesh;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }
}
