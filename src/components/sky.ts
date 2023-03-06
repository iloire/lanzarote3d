import * as THREE from "three";
import { Sky as SkyExample } from "three/examples/jsm/objects/Sky";

class Sky extends THREE.Object3D {
  load(sunDegreesHorizon: number): THREE.Mesh {
    const sunPosition = new THREE.Vector3();
    sunPosition.setFromSphericalCoords(
      1,
      THREE.MathUtils.degToRad(sunDegreesHorizon),
      THREE.MathUtils.degToRad(280)
    );
    const sky: any = new SkyExample();
    sky.material.uniforms["sunPosition"].value.copy(sunPosition);
    sky.scale.setScalar(1000000);
    return sky;
  }
}

export default Sky;
