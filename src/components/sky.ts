import * as THREE from "three";
import { Sky as SkyExample } from "three/examples/jsm/objects/Sky";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js";
import lensflareTexture0 from "../textures/lensflare0.png";
import lensflareTexture1 from "../textures/lensflare1.png";
import Time from "../utils/time";

const calculateLightIntensity = (
  timeOfDayInHours: number,
  monthOfTheYear: number
) => {
  if (timeOfDayInHours < 6) {
    return 0.2;
  }
  if (timeOfDayInHours < 10) {
    return 0.3;
  }
  if (timeOfDayInHours < 12) {
    return 0.4;
  }
  if (timeOfDayInHours < 14) {
    return 0.7;
  }
  if (timeOfDayInHours < 16) {
    return 0.6;
  }
  if (timeOfDayInHours < 18) {
    return 0.5;
  }
  if (timeOfDayInHours <= 20) {
    return 0.4;
  }
  if (timeOfDayInHours < 21) {
    return 0.35;
  }
  return 0.2;
};

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

const USE_DIRECTIONAL_LIGHT = true;

export default class Sky extends THREE.Object3D {
  sunPosition: THREE.Vector3;
  monthOfTheYear: number;
  sky: SkyExample;
  ambientLight: THREE.AmbientLight;
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
    const intensity = 0.9;
    this.pointLight = new THREE.PointLight(0xffffff, intensity, distance);
    this.pointLight.castShadow = true;
    this.pointLight.color.setHSL(0.995, 0.5, 0.9);
    this.pointLight.position.copy(
      this.sunPosition.clone().multiplyScalar(1000000)
    );

    const lightIntensity = calculateLightIntensity(
      timeOfDayInHours,
      monthOfTheYear
    );

    if (USE_DIRECTIONAL_LIGHT) {
      this.directionalLight = new THREE.DirectionalLight(
        0xffffff,
        lightIntensity
      );
      this.directionalLight.castShadow = true;
      this.directionalLight.position.copy(
        this.sunPosition.clone().multiplyScalar(100000)
      );

      // this.directionalLightHelper = new THREE.DirectionalLightHelper(
      //   this.directionalLight,
      //   1000
      // );
    }

    this.ambientLight = new THREE.AmbientLight(0xffffff, lightIntensity);
  }

  addGui(gui) {
    const skyGui = gui.addFolder("Sky");
    skyGui
      .add(this.ambientLight, "intensity", 0, 1)
      .name("ambient.intensity")
      .listen();
    if (this.directionalLight) {
      skyGui
        .add(this.directionalLight, "intensity", 0, 1)
        .name("directional.intensity")
        .listen();
    }
    skyGui
      .add(this.pointLight, "intensity", 0, 1)
      .name("pointLight.intensity")
      .listen();
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
    this.pointLight.intensity = calculateLightIntensity(
      timeOfDayInHours,
      this.monthOfTheYear
    );

    if (this.directionalLight) {
      this.directionalLight.position.copy(
        this.sunPosition.clone().multiplyScalar(10000)
      );
      this.directionalLight.intensity =
        calculateLightIntensity(timeOfDayInHours, this.monthOfTheYear) * 0.3;
      // this.directionalLightHelper.update();
    }
    this.ambientLight.intensity = calculateLightIntensity(
      timeOfDayInHours,
      this.monthOfTheYear
    );
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.sky);
    if (this.directionalLight) {
      scene.add(this.directionalLight);
      scene.add(this.directionalLightHelper);
    }
    scene.add(this.pointLight);
    scene.add(this.ambientLight);
    this.addFlare(this.pointLight);
  }

  addFlare(light: THREE.Light) {
    const textureLoader = new THREE.TextureLoader();
    const textureFlare0 = textureLoader.load(lensflareTexture0);
    const textureFlare1 = textureLoader.load(lensflareTexture1);
    const lensflare = new Lensflare();
    const size = 600;
    const distance = 0; //(optional) (0-1) from light source (0 = at light source)
    lensflare.addElement(
      new LensflareElement(textureFlare0, size, 0, light.color)
    );
    lensflare.addElement(new LensflareElement(textureFlare1, size, 0.6));
    // lensflare.addElement(new LensflareElement(textureFlare1, size, 0.7));
    // lensflare.addElement(new LensflareElement(textureFlare1, size, 0.9));
    // lensflare.addElement(new LensflareElement(textureFlare1, size, 1));
    light.add(lensflare);
  }

  getSunPosition(): THREE.Vector3 {
    return this.sunPosition;
  }
}
