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
        safety: 'primary',
        mediaItems: [
          {
            id: "famara-landing-1",
            title: "Main Landing Area",
            description: "View of the main landing area at Famara beach",
            type: "image",
            url: "https://placehold.co/600x400"
          },
          {
            id: "famara-landing-2",
            title: "Landing Approach",
            description: "Approach path to main landing",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ]
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
        safety: 'emergency',
        mediaItems: [
          {
            id: "famara-emergency-1",
            title: "Emergency Landing Area",
            description: "Emergency landing area",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ]
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
    flyzone: {
      points: [
        { 
          position: new THREE.Vector3(-4827, 380, -855),
          radius: 800
        },
        { 
          position: new THREE.Vector3(-4827, 1000, -855),
          radius: 1500
        },
        { 
          position: new THREE.Vector3(-4827, 2000, -955),
          radius: 2000
        }
      ],
      color: FLYZONE_COLORS.caution
    },
    landingSpots: [
      {
        id: "tenesar-main",
        title: "Tenesar Main Landing",
        description: "Main landing zone near the beach",
        position: new THREE.Vector3(-4827, 10, -1200),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 0
        },
        safety: 'primary',
        mediaItems: [
          {
            id: "tenesar-landing-1",
            title: "Tenesar Landing Area",
            description: "Main landing zone at Tenesar",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ]
      },
      {
        id: "tenesar-backup",
        title: "Tenesar Backup Landing",
        description: "Secondary landing option",
        position: new THREE.Vector3(-4927, 50, -1000),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 50
        },
        safety: 'secondary',
        mediaItems: [
          {
            id: "tenesar-landing-2",
            title: "Backup Landing Area",
            description: "Backup landing zone at Tenesar",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ]
      }
    ]
  },
  {
    id: "orzola",
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
    flyzone: {
      points: [
        { 
          position: new THREE.Vector3(-6227, 580, 14055),
          radius: 1000
        },
        { 
          position: new THREE.Vector3(-6227, 1200, 14055),
          radius: 1800
        },
        { 
          position: new THREE.Vector3(-6227, 2000, 14155),
          radius: 2500
        }
      ],
      color: FLYZONE_COLORS.safe
    },
    landingSpots: [
      {
        id: "orzola-beach",
        title: "Orzola Beach Landing",
        description: "Main landing area on the beach",
        position: new THREE.Vector3(-6227, 5, 14355),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 5
        },
        safety: 'primary',
        mediaItems: [
          {
            id: "orzola-landing-1",
            title: "Orzola Landing Area",
            description: "Main landing area on the beach",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ] 
      },
      {
        id: "orzola-emergency-1",
        title: "Orzola Emergency 1",
        description: "Emergency landing spot",
        position: new THREE.Vector3(-6327, 10, 14255),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 10
        },
        safety: 'emergency',
        mediaItems: [
          {
            id: "orzola-emergency-1",
            title: "Orzola Emergency 1",
            description: "Emergency landing spot",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ]
      },
      {
        id: "orzola-emergency-2",
        title: "Orzola Emergency 2",
        description: "Second emergency landing option",
        position: new THREE.Vector3(-6127, 15, 14455),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 15
        },
        safety: 'emergency',
        mediaItems: [
          {
            id: "orzola-emergency-2",
            title: "Orzola Emergency 2",
            description: "Second emergency landing option",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ]
      }
    ]
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
    flyzone: {
      points: [
        { 
          position: new THREE.Vector3(15027, 580, -12555),
          radius: 1200
        },
        { 
          position: new THREE.Vector3(15027, 1500, -12555),
          radius: 2000
        },
        { 
          position: new THREE.Vector3(15127, 2500, -12655),
          radius: 3000
        }
      ],
      color: FLYZONE_COLORS.caution
    },
    landingSpots: [
      {
        id: "playa-quemada-main",
        title: "Playa Quemada Main",
        description: "Primary landing zone",
        position: new THREE.Vector3(15027, 5, -12855),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 5
        },
        safety: 'primary',
        mediaItems: [
          {
            id: "playa-quemada-main",
            title: "Playa Quemada Main",
            description: "Primary landing zone",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ] 
      },
      {
        id: "playa-quemada-secondary",
        title: "Playa Quemada Secondary",
        description: "Secondary landing option",
        position: new THREE.Vector3(15127, 10, -12755),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 10
        },
        safety: 'secondary',
        mediaItems: [
          {
            id: "playa-quemada-secondary",
            title: "Playa Quemada Secondary",
            description: "Secondary landing option",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ]
      },
      {
        id: "playa-quemada-emergency",
        title: "Playa Quemada Emergency",
        description: "Emergency landing area",
        position: new THREE.Vector3(14927, 20, -12655),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 20
        },
        safety: 'emergency',
        mediaItems: [
          {
            id: "playa-quemada-emergency",
            title: "Playa Quemada Emergency",
            description: "Emergency landing area",
            type: "image",
            url: "https://placehold.co/600x400"
          }
        ]
      }
    ]
  }
];

export default locations;
