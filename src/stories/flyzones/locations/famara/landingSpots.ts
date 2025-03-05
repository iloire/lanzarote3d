import * as THREE from 'three';
import { LandingSpot } from '../index';

const landingSpots: LandingSpot[] = [
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
];

export default landingSpots; 