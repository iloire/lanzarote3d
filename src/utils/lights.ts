import * as THREE from "three";

const Lights = {
  addLightsToScene: (scene: THREE.Scene, showHelper: boolean) => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-1, 0.2, 0);
    dirLight.position.multiplyScalar(1200);
    scene.add(dirLight);

    if (showHelper) {
      const helper = new THREE.DirectionalLightHelper(dirLight, 5);
      scene.add(helper);
    }

    // const pointLight = new THREE.PointLight(0xffffff, 1.2, 20);
    // pointLight.color.setHSL(0.995, 0.5, 0.9);
    // pointLight.position.set(0, 45, -200);
    // scene.add(pointLight);
    //
    // const sphereSize = 188;
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
    // scene.add(pointLightHelper);
  },
};
export default Lights;
