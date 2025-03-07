import * as THREE from 'three';
import { Takeoff } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for each takeoff
const takeoffGPS = [
  {
    id: 'takeoff-famara-cliff',
    title: 'Famara Cliff Takeoff',
    description: 'Main takeoff point on the Famara cliff with excellent ridge soaring conditions.',
    gps: {
      latitude: 29.1195,
      longitude: -13.5645,
      altitude: 613
    }
  },
  {
    id: 'takeoff-famara-south',
    title: 'Famara South Takeoff',
    description: 'Southern takeoff point with good thermal conditions in the afternoon.',
    gps: {
      latitude: 29.1175,
      longitude: -13.5650,
      altitude: 375
    }
  },
  {
    id: 'takeoff-famara-north',
    title: 'Famara North Takeoff',
    description: 'Northern takeoff point with strong ridge lift in NW winds.',
    gps: {
      latitude: 29.1210,
      longitude: -13.5640,
      altitude: 847
    }
  }
];

const takeoffs: Takeoff[] = takeoffGPS.map(t => ({
  id: t.id,
  title: t.title,
  description: t.description,
  gps: t.gps,
  position: gpsToWorld(t.gps.latitude, t.gps.longitude, t.gps.altitude),
  elevation: t.gps.altitude,
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
}));

export default takeoffs;