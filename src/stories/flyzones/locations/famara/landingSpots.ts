import * as THREE from 'three';
import { LandingSpot } from '../index';

const landingSpots: LandingSpot[] = [
  {
    id: 'landing-1741205174736',
    title: 'Landing 1',
    description: 'Description of the landing spot',
    position: new THREE.Vector3(5217.095273593018, 309.7033643153524, 449.1419222130955),
    elevation: 309.7033643153524,
    type: 'primary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/landing.jpg',
        title: 'Landing Area'
      }
    ]
  },
  {
    id: 'landing-1741205174736',
    title: 'Landing 2',
    description: 'Description of the landing spot',
    position: new THREE.Vector3(6628.844849248716, 5.94624632533681, -3786.9475078520027),
    elevation: 5.94624632533681,
    type: 'primary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/landing.jpg',
        title: 'Landing Area'
      }
    ]
  }
];

export default landingSpots;
