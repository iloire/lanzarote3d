import * as THREE from "three";
import { Sky as SkyExample } from "three/examples/jsm/objects/Sky";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js";
import lensflareTexture0 from "../textures/lensflare0.png";
import lensflareTexture1 from "../textures/lensflare1.png";
import Time from "../utils/time";

const calculateSunPosition = (
  timeOfDayInHours: number,
  monthOfTheYear: number
): THREE.Vector3 => {
  const sunPosition = new THREE.Vector3();
  // phi is how far the point is from the North Pole
  const phi = THREE.MathUtils.degToRad(
    Time.getSunAltitudeDegreesAccordingToTimeOfDay(timeOfDayInHours)
  );
  //theta is the azimuth angle
  const theta = THREE.MathUtils.degToRad(
    Time.getSunAzimuthDegreesAccordingToTimeOfDay(timeOfDayInHours)
  );
  sunPosition.setFromSphericalCoords(1, phi, theta);
  return sunPosition;
};

export default class Sky extends THREE.Object3D {
  sunPosition: THREE.Vector3;
  monthOfTheYear: number;
  sky: SkyExample;
  pointLight: THREE.PointLight;
  directionalLight: THREE.DirectionalLight;
  directionalLightHelper: THREE.DirectionalLightHelper;

  constructor(timeOfDayInHours: number, monthOfTheYear: number) {
    super();
    this.sunPosition = calculateSunPosition(timeOfDayInHours, monthOfTheYear);
    this.monthOfTheYear = monthOfTheYear;

    this.sky = new SkyExample();
    this.sky.material.uniforms["sunPosition"].value.copy(this.sunPosition);
    this.sky.scale.setScalar(1000000000);

    const skyUniforms = this.sky.material.uniforms;
    skyUniforms["turbidity"].value = 20;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const distance = 0; // max range of the light
    const intensity = 0.1;
    this.pointLight = new THREE.PointLight(0xffffff, intensity, distance);
    this.pointLight.color.setHSL(0.995, 0.5, 0.9);
    this.pointLight.position.copy(
      this.sunPosition.clone().multiplyScalar(10000)
    );

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.copy(
      this.sunPosition.clone().multiplyScalar(10000)
    );

    this.directionalLightHelper = new THREE.DirectionalLightHelper(
      this.directionalLight,
      1000
    );
  }

  updateSunPosition(timeOfDayInHours: number) {
    this.sunPosition = calculateSunPosition(
      timeOfDayInHours,
      this.monthOfTheYear
    );
    this.sky.material.uniforms["sunPosition"].value.copy(this.sunPosition);
    this.pointLight.position.copy(
      this.sunPosition.clone().multiplyScalar(10000)
    );
    this.directionalLight.position.copy(
      this.sunPosition.clone().multiplyScalar(10000)
    );
    this.directionalLightHelper.update();
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.sky);
    scene.add(this.directionalLight);
    scene.add(this.directionalLightHelper);
    scene.add(this.pointLight);
    this.addAmbientLight(scene, 0.1);
    // this.addFlare(scene, pointLight);
  }

  addAmbientLight(scene: THREE.Scene, intensity) {
    const ambientLight = new THREE.AmbientLight(0xffffff, intensity);
    scene.add(ambientLight);
  }

  // addFlare(scene: THREE.Scene, pointLight: THREE.PointLight) {
  //   const textureLoader = new THREE.TextureLoader();
  //   const textureFlare0 = textureLoader.load(lensflareTexture0);
  //   const textureFlare1 = textureLoader.load(lensflareTexture1);
  //   const lensflare = new Lensflare();
  //   lensflare.addElement(
  //     new LensflareElement(textureFlare0, 600, 0, pointLight.color)
  //   );
  //   lensflare.addElement(new LensflareElement(textureFlare1, 60, 0.6));
  //   lensflare.addElement(new LensflareElement(textureFlare1, 70, 0.7));
  //   lensflare.addElement(new LensflareElement(textureFlare1, 120, 0.9));
  //   lensflare.addElement(new LensflareElement(textureFlare1, 70, 1));
  //   pointLight.add(lensflare);
  //   scene.add(pointLight);
  // }

  getSunPosition(): THREE.Vector3 {
    return this.sunPosition;
  }
}
