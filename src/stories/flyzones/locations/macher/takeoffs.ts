import * as THREE from 'three';
import { Takeoff } from '../index';

const takeoffs: Takeoff[] = [
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
];

export default takeoffs; 