import * as THREE from 'three';
import { Location } from './index';

const macher: Location = {
  id: 'macher',
  title: 'Macher',
  description: 'Macher is a small town in the south of Lanzarote with nearby volcanic flying sites.',
  position: new THREE.Vector3(-3000, 0, 8000),
  cameraView: {
    position: new THREE.Vector3(0.2, 0.3, -0.5),
    distance: 10000
  },
  takeoffs: [
    {
      id: 'macher-volcano',
      title: 'Macher Volcano',
      description: 'A volcanic cone offering unique flying experiences with strong thermals.',
      position: new THREE.Vector3(-3200, 300, 8100),
      elevation: 300,
      conditions: [
        {
          direction: {
            ideal: 180,
            range: [150, 210]
          },
          speed: {
            min: 10,
            max: 22,
            ideal: 15
          },
          rating: 3,
          description: 'Moderate conditions with S wind'
        }
      ],
      mediaItems: [
        {
          type: 'image',
          url: '/assets/images/macher-takeoff.jpg',
          title: 'Macher Volcano Takeoff'
        }
      ]
    }
  ],
  landingSpots: [
    {
      id: 'macher-field',
      title: 'Macher Field',
      description: 'A flat field near the town with good access.',
      position: new THREE.Vector3(-2800, 15, 8300),
      elevation: 15,
      type: 'primary',
      mediaItems: [
        {
          type: 'image',
          url: '/assets/images/macher-landing.jpg',
          title: 'Macher Field Landing'
        }
      ]
    },
    {
      id: 'macher-beach',
      title: 'Macher Beach',
      description: 'A small beach landing for emergency use only.',
      position: new THREE.Vector3(-2600, 5, 8500),
      elevation: 5,
      type: 'emergency',
      mediaItems: [
        {
          type: 'image',
          url: '/assets/images/macher-beach.jpg',
          title: 'Macher Beach Emergency Landing'
        }
      ]
    }
  ],
  flyzone: {
    phases: {
      takeoff: {
        type: 'takeoff',
        position: new THREE.Vector3(-3200, 300, 8100),
        dimensions: {
          width: 300,
          height: 150,
          length: 300
        },
        nextPhases: ['thermal']
      },
      thermal: {
        type: 'ridge',
        position: new THREE.Vector3(-3100, 500, 8200),
        dimensions: {
          width: 600,
          height: 400,
          length: 600
        },
        nextPhases: ['approach']
      },
      approach: {
        type: 'approach',
        position: new THREE.Vector3(-2900, 200, 8250),
        dimensions: {
          width: 400,
          height: 250,
          length: 400
        },
        nextPhases: ['landing']
      },
      landing: {
        type: 'landing',
        position: new THREE.Vector3(-2800, 40, 8300),
        dimensions: {
          width: 300,
          height: 80,
          length: 300
        }
      }
    }
  }
};

export default macher; 