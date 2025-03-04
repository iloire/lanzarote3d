import * as THREE from "three";
import { Location } from "./index";
import { FLYZONE_COLORS } from "../helpers";

const locations: Location[] = [
  {
    id: "teguise-famara",
    title: "Teguise/Famara",
    description: "Famara is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(6827, 880, -555),
    coordinates: {
      latitude: 28.9167,
      longitude: -13.6333,
      altitude: 880,
    },
    takeoffs: [
      {
        id: "pechos-altos",
        title: "Pechos Altos Takeoff",
        description: "Pechos Altos is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
        position: new THREE.Vector3(6827, 880, -655),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 880,
        },
        conditions: [
          { from: 20, to: 30, minWindKmh: 10, maxWindKmh: 20, rating: 1 },
          { from: 30, to: 40, minWindKmh: 20, maxWindKmh: 30, rating: 2 },
          { from: 40, to: 50, minWindKmh: 30, maxWindKmh: 40, rating: 3 },
          { from: 50, to: 60, minWindKmh: 40, maxWindKmh: 50, rating: 4 },
          { from: 60, to: 70, minWindKmh: 50, maxWindKmh: 60, rating: 5 },
        ],
        mediaItems: [
          {
            id: "pechos-altos-media-1",
            title: "Pechos Altos Media 1",
            description: "Pechos Altos Media 1 description",
            type: "image",
            url: "https://via.placeholder.com/150",
          },
        ],
      }
    ],
    flyzone: {
      points: [
        { 
          position: new THREE.Vector3(6817, 880, -555),
          radius: 1000
        },
        { 
          position: new THREE.Vector3(6887, 1500, -555),
          radius: 2000
        },
        { 
          position: new THREE.Vector3(6897, 2500, -755),
          radius: 3000
        }
      ],
      color: FLYZONE_COLORS.safe
    },
    landingSpots: [
      {
        id: "famara-beach-main",
        title: "Famara Beach Main Landing",
        description: "Main landing area on Famara beach",
        position: new THREE.Vector3(6827, 500, 0),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 0
        },
        safety: 'primary'
      },
      {
        id: "famara-beach-emergency",
        title: "Emergency Landing",
        description: "Emergency landing area",
        position: new THREE.Vector3(6927, 100, -1000),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 100
        },
        safety: 'emergency'
      }
    ]
  },
  {
    id: "tenesar",
    title: "Tenesar",
    description: "Tenesar is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(-4827, 380, -855),
    coordinates: {
      latitude: 28.9167,
      longitude: -13.6333,
      altitude: 380,
    },
    takeoffs: [
      {
        id: "tenesar-1",
        title: "Tenesar main takeoff",
        description: "Tenesar main takeoff.",
        position: new THREE.Vector3(-4827, 380, -855),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 380,
        },
        conditions: [
          { from: 20, to: 30, minWindKmh: 10, maxWindKmh: 20, rating: 1 },
          { from: 30, to: 40, minWindKmh: 20, maxWindKmh: 30, rating: 2 },
          { from: 40, to: 50, minWindKmh: 30, maxWindKmh: 40, rating: 3 },
          { from: 50, to: 60, minWindKmh: 40, maxWindKmh: 50, rating: 4 },
          { from: 60, to: 70, minWindKmh: 50, maxWindKmh: 60, rating: 5 },
        ],
        mediaItems: [
          {
            id: "tenesar-media-1",
            title: "Tenesar Media 1",
            description: "Tenesar Media 1 description",
            type: "image",
            url: "https://placehold.co/600x400",
          },
          {
            id: "tenesar-media-2",
            title: "Tenesar Media 2",
            description: "Tenesar Media 2 description",
            type: "image",
            url: "https://placehold.co/600x400",
          },
          {
            id: "tenesar-media-3",
            title: "Tenesar Media 3",
            description: "Tenesar Media 3 description",
            type: "image",
            url: "https://placehold.co/600x400",
          },
        ],
      },
      {
        id: "tenesar-2",
        title: "Tenesar first takeoff",
        description: "Tenesar first takeoff.",
        position: new THREE.Vector3(-4927, 390, -855),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 380,
        },
        conditions: [
          { from: 20, to: 30, minWindKmh: 10, maxWindKmh: 20, rating: 1 },
          { from: 30, to: 40, minWindKmh: 20, maxWindKmh: 30, rating: 2 },
          { from: 40, to: 50, minWindKmh: 30, maxWindKmh: 40, rating: 3 },
          { from: 50, to: 60, minWindKmh: 40, maxWindKmh: 50, rating: 4 },
          { from: 60, to: 70, minWindKmh: 50, maxWindKmh: 60, rating: 5 },
        ],
        mediaItems: [
          {
            id: "tenesar-media-1",
            title: "Tenesar Media 1",
            description: "Tenesar Media 1 description",
            type: "image",
            url: "https://placehold.co/600x400",
          },
          {
            id: "tenesar-media-2",
            title: "Tenesar Media 2",
            description: "Tenesar Media 2 description",
            type: "image",
            url: "https://placehold.co/600x400",
          },
          {
            id: "tenesar-media-3",
            title: "Tenesar Media 3",
            description: "Tenesar Media 3 description",
            type: "image",
            url: "https://placehold.co/600x400",
          },
        ],
      },
    ],
  },
  { id: "orzola",
    title: "Orzola",
    description: "Orzola is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(-6227, 580, 14055),
    coordinates: {
      latitude: 28.9167,
      longitude: -13.6333,
      altitude: 580,
    },
    takeoffs: [
      {
        id: "orzola-1",
        title: "Orzola main takeoff",
        description: "Orzola main takeoff.",
        position: new THREE.Vector3(-6227, 580, 14055),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 580,
        },
        conditions: [
          { from: 20, to: 30, minWindKmh: 10, maxWindKmh: 20, rating: 1 },
          { from: 30, to: 40, minWindKmh: 20, maxWindKmh: 30, rating: 2 },
          { from: 40, to: 50, minWindKmh: 30, maxWindKmh: 40, rating: 3 },
          { from: 50, to: 60, minWindKmh: 40, maxWindKmh: 50, rating: 4 },
          { from: 60, to: 70, minWindKmh: 50, maxWindKmh: 60, rating: 5 },
        ],
        mediaItems: [
          {
            id: "orzola-media-3",
            title: "Orzola Media 1",
            description: "Orzola Media 1 description",
            type: "image",
            url: "https://via.placeholder.com/150",
          },
        ],
      },
    ],
  },
  {
    id: "playa-quemada",
    title: "Playa Quemada",
    description: "Playa Quemada is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
    position: new THREE.Vector3(15027, 580, -12555),
    coordinates: {
      latitude: 28.9167,
      longitude: -13.6333,
      altitude: 580,
    },
    takeoffs: [
      {
        id: "playa-quemada-1",
        title: "Playa Quemada main takeoff",
        description: "Playa Quemada is a beautiful beach with a long sandy stretch and clear waters. It's a popular spot for windsurfing and kiteboarding enthusiasts.",
        position: new THREE.Vector3(15027, 580, -12555),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 580,
        },
        conditions: [
          { from: 20, to: 30, minWindKmh: 10, maxWindKmh: 20, rating: 1 },
          { from: 30, to: 40, minWindKmh: 20, maxWindKmh: 30, rating: 2 },
          { from: 40, to: 50, minWindKmh: 30, maxWindKmh: 40, rating: 3 },
          { from: 50, to: 60, minWindKmh: 40, maxWindKmh: 50, rating: 4 },
          { from: 60, to: 70, minWindKmh: 50, maxWindKmh: 60, rating: 5 },
        ],
        mediaItems: [
          {
            id: "playa-quemada-media-1",
            title: "Playa Quemada Media 1",
            description: "Playa Quemada Media 1 description",
            type: "image",
            url: "https://via.placeholder.com/150",
          },
        ],
      },
     
    ],
  },
];

export default locations;
