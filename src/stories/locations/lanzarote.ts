import * as THREE from "three";
import { Location } from "./index";

const locations: Location[] = [
  {
    id: "famara",
    title: "Famara",
    description: "Famara is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(6827, 880, -555), // pechos altos
    lookFrom: new THREE.Vector3(6827, 880, -555),
    lookAt: new THREE.Vector3(7827, 880, -1555),
    idealWindDirectionDegreesFromNorth: 300,
    idealSunPositionDegrees: 30,
    availableForPlaying: true,
  },
  {
    id: "tenesar",
    title: "Tenesar",
    description: "Tenesar is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(-4827, 380, -855),
    lookFrom: new THREE.Vector3(-6527, 580, -4555),
    lookAt: new THREE.Vector3(-5127, 580, -255),
    idealWindDirectionDegreesFromNorth: 350,
    idealSunPositionDegrees: 30,
    availableForPlaying: true,
  },
  {
    id: "mirador",
    title: "Mirador",
    description: "Mirador is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(15027, 580, -12555),
    lookFrom: new THREE.Vector3(18527, 580, -13555),
    lookAt: new THREE.Vector3(-5127, 580, -255),
    idealWindDirectionDegreesFromNorth: 30,
    idealSunPositionDegrees: 30,
    availableForPlaying: false,
  },
  {
    id: "mala",
    title: "Mala",
    description: "Mala is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(14727, 380, -3555),
    lookFrom: new THREE.Vector3(14527, 480, -3855),
    lookAt: new THREE.Vector3(13427, 380, -3555),
    idealWindDirectionDegreesFromNorth: 30,
    idealSunPositionDegrees: 30,
    availableForPlaying: false,
  },
  {
    id: "playa-quemada",
    title: "Playa Quemada",
    description: "Playa Quemada is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(-6227, 580, 14055),
    lookFrom: new THREE.Vector3(-4727, 580, 17055),
    lookAt: new THREE.Vector3(-7127, 580, 12055),
    idealWindDirectionDegreesFromNorth: 130,
    idealSunPositionDegrees: 30,
    availableForPlaying: false,
  }
];

export default locations;
