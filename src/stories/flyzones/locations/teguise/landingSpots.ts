import * as THREE from 'three';
import { LandingSpot } from '../index';

const landingSpots: LandingSpot[] = [
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
];

export default landingSpots; 