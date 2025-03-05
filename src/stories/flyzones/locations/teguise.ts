import * as THREE from 'three';
import { Location } from './index';

const teguise: Location = {
  id: 'teguise',
  title: 'Teguise',
  description: 'Teguise is a historic town in the center of Lanzarote with nearby flying sites.',
  position: new THREE.Vector3(5000, 0, 5000),
  cameraView: {
    position: new THREE.Vector3(-0.3, 0.4, 0.5),
    distance: 12000
  },
  takeoffs: [
    {
      id: 'teguise-hill',
      title: 'Teguise Hill',
      description: 'A smooth hill takeoff with good thermal development in the afternoons.',
      position: new THREE.Vector3(5200, 400, 5000),
      elevation: 400,
      conditions: [
        {
          direction: {
            ideal: 90,
            range: [60, 120]
          },
          speed: {
            min: 8,
            max: 20,
            ideal: 12
          },
          rating: 4,
          description: 'Good conditions with E wind'
        }
      ],
      mediaItems: [
        {
          type: 'image',
          url: '/assets/images/teguise-takeoff.jpg',
          title: 'Teguise Hill Takeoff'
        }
      ]
    }
  ],
  landingSpots: [
    {
      id: 'teguise-field',
      title: 'Teguise Field',
      description: 'A large open field with easy access.',
      position: new THREE.Vector3(5500, 20, 5300),
      elevation: 20,
      type: 'primary',
      mediaItems: [
        {
          type: 'image',
          url: '/assets/images/teguise-landing.jpg',
          title: 'Teguise Field Landing'
        }
      ]
    }
  ],
  flyzone: {
    phases: {
      takeoff: {
        type: 'takeoff',
        position: new THREE.Vector3(5200, 400, 5000),
        dimensions: {
          width: 400,
          height: 200,
          length: 400
        },
        nextPhases: ['approach']
      },
      approach: {
        type: 'approach',
        position: new THREE.Vector3(5350, 200, 5150),
        dimensions: {
          width: 400,
          height: 300,
          length: 400
        },
        nextPhases: ['landing']
      },
      landing: {
        type: 'landing',
        position: new THREE.Vector3(5500, 50, 5300),
        dimensions: {
          width: 400,
          height: 100,
          length: 400
        }
      }
    }
  }
};

export default teguise; 