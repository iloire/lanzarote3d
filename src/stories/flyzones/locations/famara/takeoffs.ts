import * as THREE from 'three';
import { Takeoff } from '../index';

const takeoffs: Takeoff[] = [
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
];

export default takeoffs; 