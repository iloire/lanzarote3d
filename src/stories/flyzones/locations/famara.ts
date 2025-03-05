import * as THREE from 'three';
import { Location } from './index';

const famara: Location = {
  id: 'famara',
  title: 'Famara',
  description: 'Famara is a beautiful beach on the northwest coast of Lanzarote, known for its stunning cliffs and excellent paragliding conditions.',
  position: new THREE.Vector3(0, 0, 0),
  cameraView: {
    position: new THREE.Vector3(-0.5, 0.3, 0.5),
    distance: 15000
  },
  takeoffs: [
    {
      id: 'famara-main',
      title: 'Famara Main Takeoff',
      description: 'The main takeoff point at Famara, offering consistent thermals and ridge lift.',
      position: new THREE.Vector3(500, 600, 0),
      elevation: 600,
      conditions: [
        {
          direction: {
            ideal: 320,
            range: [290, 350]
          },
          speed: {
            min: 10,
            max: 25,
            ideal: 15
          },
          rating: 5,
          description: 'Perfect conditions with NW wind'
        },
        {
          direction: {
            ideal: 270,
            range: [250, 290]
          },
          speed: {
            min: 10,
            max: 20,
            ideal: 15
          },
          rating: 4,
          description: 'Good conditions with W wind'
        }
      ],
      mediaItems: [
        {
          type: 'image',
          url: '/assets/images/famara-takeoff.jpg',
          title: 'Famara Takeoff'
        },
        {
          type: 'video',
          url: '/assets/videos/famara-takeoff.mp4'
        }
      ]
    }
  ],
  landingSpots: [
    {
      id: 'famara-beach',
      title: 'Famara Beach Landing',
      description: 'A wide sandy beach offering safe landing options.',
      position: new THREE.Vector3(1000, 10, 500),
      elevation: 10,
      type: 'primary',
      mediaItems: [
        {
          type: 'image',
          url: '/assets/images/famara-landing.jpg',
          title: 'Famara Beach Landing'
        }
      ]
    }
  ],
  flyzone: {
    phases: {
      takeoff: {
        type: 'takeoff',
        position: new THREE.Vector3(500, 600, 0),
        dimensions: {
          width: 500,
          height: 200,
          length: 500
        },
        nextPhases: ['ridge']
      },
      ridge: {
        type: 'ridge',
        position: new THREE.Vector3(700, 500, 300),
        dimensions: {
          width: 2000,
          height: 400,
          length: 500
        },
        nextPhases: ['approach']
      },
      approach: {
        type: 'approach',
        position: new THREE.Vector3(900, 250, 400),
        dimensions: {
          width: 500,
          height: 300,
          length: 500
        },
        nextPhases: ['landing']
      },
      landing: {
        type: 'landing',
        position: new THREE.Vector3(1000, 50, 500),
        dimensions: {
          width: 500,
          height: 100,
          length: 500
        }
      }
    }
  }
};

export default famara; 