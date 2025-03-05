import * as THREE from 'three';
import { Takeoff } from '../index';

const takeoffs: Takeoff[] = [
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
];

export default takeoffs; 