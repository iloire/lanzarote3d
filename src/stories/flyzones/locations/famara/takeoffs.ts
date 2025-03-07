import * as THREE from 'three';
import { Takeoff } from '../index';
import { gpsToWorld } from '../../helpers/gps';

const takeoffs: Takeoff[] = [
  {
    id: 'takeoff-famara-cliff',
    title: 'Famara Cliff Takeoff',
    description: 'Main takeoff point on the Famara cliff with excellent ridge soaring conditions.',
    // Define GPS coordinates
    gps: {
      latitude: 29.0475,
      longitude: -13.6339,
      altitude: 613
    },
    // Position is calculated from GPS
    position: gpsToWorld(29.0475, -13.6339, 613),
    elevation: 613,
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