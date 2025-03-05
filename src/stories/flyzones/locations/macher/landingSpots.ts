import * as THREE from 'three';
import { LandingSpot } from '../index';

const landingSpots: LandingSpot[] = [
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
];

export default landingSpots; 