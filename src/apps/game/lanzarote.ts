import * as THREE from "three";


const locations: any[] = [  
  {
    id: "famara",
    title: "Famara",
    description: "The main ridge soaring site in Lanzarote",
    position: new THREE.Vector3(0, 0, 0),
    cameraView: {
      position: new THREE.Vector3(-0.5, 0.3, 0.5),
      distance: 15000
    },
  },
  {
    id: "tenesar",
    title: "Tenesar",
    description: "Tenesar is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(-4827, 380, -855),
    cameraView: {
      position: new THREE.Vector3(0.5, 0.3, 0.5),
      distance: 10000
    },

  },
  {
    id: "la-santa",
    title: "La Santa",
    description: "La Santa is a small fishing village on the northwest coast of Lanzarote. It's known for its excellent surf breaks and beautiful coastal scenery.",
    position: new THREE.Vector3(-2827, 280, -3855),
    cameraView: {
      position: new THREE.Vector3(0.3, 0.4, 0.5),
      distance: 12000
    },
  },
  {
    id: "tinajo",
    title: "Tinajo",
    description: "Tinajo is a small town in the central-western part of Lanzarote. It's surrounded by volcanic landscapes and offers unique flying experiences.",
    position: new THREE.Vector3(-1827, 380, -6855),
    cameraView: {
      position: new THREE.Vector3(0.2, 0.3, 0.6),
      distance: 10000
    },
  }
];

export default locations;
