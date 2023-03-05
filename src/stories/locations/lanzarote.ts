import * as THREE from "three";
import { Location } from "./index";

const locations: Location[] = [
  {
    title: "Famara",
    pos: new THREE.Vector3(-2207, 880, -2055),
    lookAt: new THREE.Vector3(6827, 880, -6555),
  },
  {
    title: "Tenesar",
    pos: new THREE.Vector3(-6527, 580, -4555),
    lookAt: new THREE.Vector3(-5127, 580, -255),
  },
  {
    title: "Mirador",
    pos: new THREE.Vector3(20527, 580, -14555),
    lookAt: new THREE.Vector3(-5127, 580, -255),
  },
  {
    title: "Playa Quemada",
    pos: new THREE.Vector3(-3527, 580, 17055),
    lookAt: new THREE.Vector3(-7127, 580, 12055),
  },
];

export default locations;
