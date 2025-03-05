
import * as THREE from 'three';
import { Takeoff } from '../index';

const takeoffs: Takeoff[] = [
  {
    id: 'takeoff-1741205174736',
    title: 'Takeoff 1',
    description: 'Description of the takeoff',
    position: new THREE.Vector3(5900.595536418577, 613.1881195090017, 602.7302721180077),
    elevation: 613.1881195090017,
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
        description: 'Perfect conditions'
      }
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/takeoff.jpg',
        title: 'Takeoff'
      }
    ]
  },
  {
    id: 'takeoff-1741205174736',
    title: 'Takeoff 2',
    description: 'Description of the takeoff',
    position: new THREE.Vector3(5397.558727223078, 374.715783780214, 589.6206715351682),
    elevation: 374.715783780214,
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
        description: 'Perfect conditions'
      }
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/takeoff.jpg',
        title: 'Takeoff'
      }
    ]
  },
  {
    id: 'takeoff-1741205174736',
    title: 'Takeoff 3',
    description: 'Description of the takeoff',
    position: new THREE.Vector3(6899.5869640645515, 847.2496293426202, -518.9152565187766),
    elevation: 847.2496293426202,
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
        description: 'Perfect conditions'
      }
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/takeoff.jpg',
        title: 'Takeoff'
      }
    ]
  }
];

export default takeoffs;