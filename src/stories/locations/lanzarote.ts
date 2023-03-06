import * as THREE from "three";
import { Location } from "./index";

const locations: Location[] = [
  {
    title: "Famara",
    position: new THREE.Vector3(6827, 880, -555), // pechos altos
    lookFrom: new THREE.Vector3(-2207, 880, -2055),
    lookAt: new THREE.Vector3(6827, 880, -6555),
    idealWindDirectionDegreesFromNorth: 300,
  },
  {
    title: "Tenesar",
    position: new THREE.Vector3(-4827, 380, -855),
    lookFrom: new THREE.Vector3(-6527, 580, -4555),
    lookAt: new THREE.Vector3(-5127, 580, -255),
    idealWindDirectionDegreesFromNorth: 350,
  },
  {
    title: "Mirador",
    position: new THREE.Vector3(15027, 580, -12555),
    lookFrom: new THREE.Vector3(20527, 580, -14555),
    lookAt: new THREE.Vector3(-5127, 580, -255),
    idealWindDirectionDegreesFromNorth: 30,
  },
  {
    title: "Playa Quemada",
    position: new THREE.Vector3(-6227, 580, 14055),
    lookFrom: new THREE.Vector3(-6227, 580, 14055),
    lookAt: new THREE.Vector3(-7127, 580, 12055),
    idealWindDirectionDegreesFromNorth: 130,
  },
];

export default locations;
