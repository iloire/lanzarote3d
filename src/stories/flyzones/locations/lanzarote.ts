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
        position: new THREE.Vector3(6927, 880, -655),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 880,
        },
        conditions: [
          {
            direction: {
              ideal: 280,     // NW wind
              tolerance: 30
            },
            speed: {
              min: 15,
              max: 30,
              ideal: 20
            },
            rating: 5
          },
          {
            direction: {
              ideal: 350,    // N wind
              tolerance: 20
            },
            speed: {
              min: 10,
              max: 25,
              ideal: 15
            },
            rating: 4
          },
     
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
      },
      {
        id: "pechos-bajos",
        title: "Pechos Bajos Takeoff",
        description: "Pechos Bajos.",
        position: new THREE.Vector3(5598, 406, 464),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 880,
        },
        conditions: [
          {
            direction: {
              ideal: 280,     // NW wind
              tolerance: 30
            },
            speed: {
              min: 15,
              max: 30,
              ideal: 20
            },
            rating: 5
          },
          {
            direction: {
              ideal: 350,    // N wind
              tolerance: 20
            },
            speed: {
              min: 10,
              max: 25,
              ideal: 15
            },
            rating: 4
          },
     
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
      },
      {
        id: "chimidas",
        title: "Chimidas Takeoff",
        description: "Chimidas.",
        position: new THREE.Vector3(6327, 980, -655),
        coordinates: {
          latitude: 28.9167,
          longitude: -13.6333,
          altitude: 880,
        },
        conditions: [
          {
            direction: {
              ideal: 280,     // NW wind
              tolerance: 30
            },
            speed: {
              min: 15,
              max: 30,
              ideal: 20
            },
            rating: 5
          },
          {
            direction: {
              ideal: 350,    // N wind
              tolerance: 20
            },
            speed: {
              min: 10,
              max: 25,
              ideal: 15
            },
            rating: 4
          },
     
        ],
        mediaItems: [
          {
            id: "chimidas-media-1",
            title: "Chimidas Media 1",
            description: "Chimidas Media 1 description",
            type: "image",
            url: "https://via.placeholder.com/150",
          },
        ],
      }
    ],
    flyzone: {
      phases: {
        'takeoff-main': {
          type: 'takeoff',
          position: new THREE.Vector3(6927, 280, -655),
          dimensions: {
            width: 400,    // Area to take off
            height: 200,   // Vertical space needed
            length: 400    // Front to back space
          },
          nextPhases: ['climb-1']
        },
        'climb-1': {
          type: 'climb',
          position: new THREE.Vector3(7127, 480, -655),
          dimensions: {
            width: 800,    // Wider area for turning
            height: 400,   // Climbing space
            length: 800    // Space to move forward
          },
          nextPhases: ['climb-2', 'ridge-1']
        },
        'ridge-1': {
          type: 'ridge',
          position: new THREE.Vector3(7327, 830, -655),
          dimensions: {
            width: 1200,   // Wide area for ridge soaring
            height: 600,   // Vertical range
            length: 600    // Ridge length
          },
          nextPhases: ['ridge-2', 'approach-1']
        },
        'climb-2': {
          type: 'climb',
          position: new THREE.Vector3(7527, 680, -655),
          dimensions: {
            width: 1000,    // Wider area for turning
            height: 400,   // Climbing space
            length: 1000    // Space to move forward
          },
          nextPhases: ['climb-3', 'ridge-2']
        },
        'ridge-2': {
          type: 'ridge',
          position: new THREE.Vector3(7727, 1030, -655),
          dimensions: {
            width: 1500,   // Wide area for ridge soaring
            height: 800,   // Vertical range
            length: 800    // Ridge length
          },
          nextPhases: ['approach-1']
        },
        'approach-1': {
          type: 'approach',
          position: new THREE.Vector3(6866, 800, -2467),
          dimensions: {
            width: 1000,    // Wide area for approach
            height: 600,    // Vertical range for descent
            length: 1000    // Length of approach path
          },
          nextPhases: ['landing-main']
        },
        'landing-main': {
          type: 'landing',
          position: new THREE.Vector3(6866, 200, -3467),
          dimensions: {
            width: 800,     // Landing area width
            height: 400,    // Height range for final
            length: 800     // Landing area length
          }
        }
      }
    },
    landingSpots: [
      {
        id: "famara-beach-main",
        title: "Famara Beach ",
        description: "Main landing area on Famara beach",
        position: new THREE.Vector3(6866, 8, -3467),
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
    ],
    cameraView: {
      position: new THREE.Vector3(-2, 0.7, 1).normalize(), // View from NorthWest
      distance: 5000 // Distance in world units
    }
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
          {
            direction: {
              ideal: 45,     // NE wind
              tolerance: 30
            },
            speed: {
              min: 15,
              max: 30,
              ideal: 20
            },
            rating: 5
          },
          {
            direction: {
              ideal: 35,     // NNE wind
              tolerance: 25
            },
            speed: {
              min: 10,
              max: 25,
              ideal: 15
            },
            rating: 4
          },
          {
            direction: {
              ideal: 55,     // ENE wind
              tolerance: 20
            },
            speed: {
              min: 20,
              max: 35,
              ideal: 25
            },
            rating: 3
          }
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
          {
            direction: {
              ideal: 45,
              tolerance: 30
            },
            speed: {
              min: 15,
              max: 30,
              ideal: 20
            },
            rating: 5
          },
          {
            direction: {
              ideal: 35,
              tolerance: 25
            },
            speed: {
              min: 10,
              max: 25,
              ideal: 15
            },
            rating: 4
          }
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
      phases: {
        'takeoff-main': {
          type: 'takeoff',
          position: new THREE.Vector3(-4827, 380, -855),
          dimensions: {
            width: 800,
            height: 200,
            length: 800
          },
          nextPhases: ['climb-1']
        },
        'climb-1': {
          type: 'climb',
          position: new THREE.Vector3(-4827, 1000, -855),
          dimensions: {
            width: 1500,
            height: 900,
            length: 1500
          },
          nextPhases: ['ridge-1']
        },
        'ridge-1': {
          type: 'ridge',
          position: new THREE.Vector3(-4827, 2000, -955),
          dimensions: {
            width: 2000,
            height: 1000,
            length: 2000
          },
          nextPhases: ['ridge-2', 'approach-1']
        }
      }
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
    ],
    cameraView: {
      position: new THREE.Vector3(-0.5, 0.7, -1).normalize(), // View from Southeast
      distance: 4000
    }
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
          {
            direction: {
              ideal: 40,
              tolerance: 30
            },
            speed: {
              min: 15,
              max: 30,
              ideal: 20
            },
            rating: 5
          },
          {
            direction: {
              ideal: 50,
              tolerance: 25
            },
            speed: {
              min: 20,
              max: 35,
              ideal: 25
            },
            rating: 4
          }
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
      phases: {
        'takeoff-main': {
          type: 'takeoff',
          position: new THREE.Vector3(-6227, 580, 14055),
          dimensions: {
            width: 1000,
            height: 220,
            length: 1000
          },
          nextPhases: ['climb-1']
        },
        'climb-1': {
          type: 'climb',
          position: new THREE.Vector3(-6227, 1200, 14055),
          dimensions: {
            width: 1800,
            height: 700,
            length: 1800
          },
          nextPhases: ['ridge-1']
        },
        'ridge-1': {
          type: 'ridge',
          position: new THREE.Vector3(-6227, 2000, 14155),
          dimensions: {
            width: 2500,
            height: 1000,
            length: 2500
          },
          nextPhases: ['ridge-2', 'approach-1']
        }
      }
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
    ],
    cameraView: {
      position: new THREE.Vector3(0, 0.7, -1).normalize(), // View from South
      distance: 4500
    }
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
          {
            direction: {
              ideal: 45,
              tolerance: 30
            },
            speed: {
              min: 15,
              max: 30,
              ideal: 20
            },
            rating: 5
          },
          {
            direction: {
              ideal: 60,
              tolerance: 25
            },
            speed: {
              min: 20,
              max: 35,
              ideal: 25
            },
            rating: 4
          }
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
      phases: {
        'takeoff-main': {
          type: 'takeoff',
          position: new THREE.Vector3(15027, 580, -12555),
          dimensions: {
            width: 1200,
            height: 420,
            length: 1200
          },
          nextPhases: ['climb-1']
        },
        'climb-1': {
          type: 'climb',
          position: new THREE.Vector3(15027, 1500, -12555),
          dimensions: {
            width: 2000,
            height: 1000,
            length: 2000
          },
          nextPhases: ['ridge-1']
        },
        'ridge-1': {
          type: 'ridge',
          position: new THREE.Vector3(15127, 2500, -12655),
          dimensions: {
            width: 3000,
            height: 1000,
            length: 3000
          },
          nextPhases: ['landing-main']
        }
      }
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
    ],
    cameraView: {
      position: new THREE.Vector3(0.5, 0.7, -1).normalize(), // View from Southwest
      distance: 4000
    }
  }
];

export default locations;
