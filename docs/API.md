# API Documentation

## Flyzone Management API

The Flyzone Management System provides a comprehensive API for managing paragliding locations, weather analysis, and takeoff recommendations.

### FlyzoneAPI Class

Main API class for all flyzone operations.

#### Initialization

```typescript
import { flyzoneAPI } from '../api/flyzone-api';

await flyzoneAPI.initialize();
```

#### Location Management

##### Get All Locations (Summary)
```typescript
GET /locations/summaries (conceptual)

const summaries = await flyzoneAPI.getLocationSummaries();
```

**Response:**
```typescript
FlyzoneLocationSummary[] = {
  id: string;
  title: string;
  region: string;
  takeoffCount: number;
  landingZoneCount: number;
  popularity: number;
  lastUpdated: string;
  verified: boolean;
}[]
```

##### Get Specific Location
```typescript
GET /locations/:id (conceptual)

const location = await flyzoneAPI.getLocation('flyzone_123');
```

**Response:** `FlyzoneLocation | null`

##### Save New Location
```typescript
POST /locations (conceptual)

const request: SaveLocationRequest = {
  location: {
    title: "Famara North",
    description: "Popular takeoff with consistent coastal winds",
    region: "Famara",
    position: new THREE.Vector3(6279, 100, -3155),
    gps: { latitude: 29.1234, longitude: -13.5678, altitude: 100 },
    bounds: { north: 29.13, south: 29.11, east: -13.56, west: -13.58 },
    cameraView: {
      position: new THREE.Vector3(5779, 400, -2655),
      lookAt: new THREE.Vector3(6279, 100, -3155),
      distance: 800
    },
    takeoffs: [],
    landingZones: [],
    flyzone: {
      id: "flyzone_xyz",
      name: "Famara Coastal",
      description: "Coastal soaring area",
      color: 0x00ff00,
      phases: {},
      lastUpdated: "2025-01-27T12:00:00Z",
      createdBy: "user"
    },
    popularity: 3,
    lastUpdated: "2025-01-27T12:00:00Z",
    createdBy: "user",
    verified: false,
    bestMonths: ["April", "May", "September", "October"],
    averageWindDirection: 45,
    averageWindSpeed: 20
  }
};

const newLocation = await flyzoneAPI.saveLocation(request);
```

##### Update Location
```typescript
PUT /locations/:id (conceptual)

const updateRequest: UpdateLocationRequest = {
  id: 'flyzone_123',
  location: {
    title: "Updated Title",
    verified: true
  }
};

const updated = await flyzoneAPI.updateLocation(updateRequest);
```

##### Delete Location
```typescript
DELETE /locations/:id (conceptual)

const success = await flyzoneAPI.deleteLocation('flyzone_123');
```

### Weather Analysis

##### Get Wind-Based Recommendations
```typescript
POST /weather/recommendations (conceptual)

const weatherRequest: WeatherRequest = {
  windDirection: 45,        // degrees (0-360)
  windSpeed: 25,           // km/h
  userLevel: 'intermediate', // 'beginner' | 'intermediate' | 'advanced' | 'expert'
  locationIds?: ['loc1', 'loc2'] // optional filter
};

const analysis = await flyzoneAPI.getWeatherRecommendations(weatherRequest);
```

**Response:**
```typescript
WeatherAnalysis = {
  currentWeather: {
    windDirection: number;
    windSpeed: number;
    gustSpeed?: number;
    timestamp: string;
    source: string;
  };
  recommendations: TakeoffRecommendation[];
  generalAdvice: string[];
  safetyWarnings: string[];
  timestamp: string;
}

TakeoffRecommendation = {
  takeoff: TakeoffLocation;
  score: number; // 0-100
  reasoning: string[];
  warnings: string[];
  windMatch: {
    directionScore: number; // 0-100
    speedScore: number;     // 0-100
    overallScore: number;   // 0-100
  };
}
```

### Coordinate Conversion

##### GPS to World Position
```typescript
const gps = { latitude: 29.1234, longitude: -13.5678, altitude: 100 };
const worldPos = flyzoneAPI.gpsToWorldPosition(gps);
// Returns: THREE.Vector3
```

##### World Position to GPS
```typescript
const position = new THREE.Vector3(1000, 100, -2000);
const gps = flyzoneAPI.worldPositionToGPS(position);
// Returns: { latitude: number; longitude: number; altitude: number }
```

## Data Types

### Core Types

#### FlyzoneLocation
Complete flyzone location with all components:
```typescript
interface FlyzoneLocation {
  id: string;
  title: string;
  description: string;
  region: string;
  position: THREE.Vector3;
  gps: GPS;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  cameraView: {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
    distance: number;
  };
  takeoffs: TakeoffLocation[];
  landingZones: LandingZone[];
  flyzone: FlyZone;
  popularity: number;
  lastUpdated: string;
  createdBy: string;
  verified: boolean;
  bestMonths: string[];
  averageWindDirection: number;
  averageWindSpeed: number;
}
```

#### TakeoffLocation
Specific takeoff point with conditions:
```typescript
interface TakeoffLocation {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  gps: GPS;
  elevation: number;
  windConditions: WindCondition[];
  safety: SafetyInfo;
  access: {
    difficulty: 'easy' | 'moderate' | 'difficult';
    description: string;
    parkingGPS?: GPS;
    walkingTime: number; // minutes
  };
  mediaItems: MediaItem[];
  lastUpdated: string;
  createdBy: string;
  verified: boolean;
}
```

#### WindCondition
Wind analysis parameters:
```typescript
interface WindCondition {
  id: string;
  direction: {
    ideal: number; // degrees (0-360)
    range: [number, number]; // [min, max] degrees
  };
  speed: {
    min: number; // km/h
    max: number; // km/h
    ideal: number; // km/h
  };
  rating: number; // 1-5 stars
  description: string;
  seasonality?: 'summer' | 'winter' | 'spring' | 'autumn' | 'year-round';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'all-day';
}
```

#### SafetyInfo
Safety and emergency information:
```typescript
interface SafetyInfo {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  hazards: string[];
  emergency: {
    contacts: string[];
    procedures: string[];
    nearestHospital?: string;
  };
  restrictions?: string[];
  localRegulations?: string[];
}
```

### Example Usage

#### Creating a Complete Location
```typescript
// Convert GPS to world coordinates
const gpsCoords = { latitude: 29.1234, longitude: -13.5678, altitude: 150 };
const worldPos = flyzoneAPI.gpsToWorldPosition(gpsCoords);

// Create takeoff with wind conditions
const takeoff: TakeoffLocation = {
  id: "takeoff_famara_north",
  title: "Famara North Launch",
  description: "Primary takeoff for northerly winds",
  position: worldPos,
  gps: gpsCoords,
  elevation: 150,
  windConditions: [{
    id: "wind_north",
    direction: { ideal: 45, range: [30, 60] },
    speed: { min: 15, max: 35, ideal: 25 },
    rating: 4,
    description: "Excellent coastal soaring conditions",
    seasonality: 'year-round',
    timeOfDay: 'all-day'
  }],
  safety: {
    difficulty: 'intermediate',
    hazards: ['power lines 200m south', 'rocky outcrop on approach'],
    emergency: {
      contacts: ['+34 123 456 789', 'Emergency: 112'],
      procedures: ['Land in designated field below', 'Avoid power lines'],
      nearestHospital: 'Hospital Arrecife - 25km'
    },
    restrictions: ['No flying during military exercises'],
    localRegulations: ['Must have third-party insurance']
  },
  access: {
    difficulty: 'moderate',
    description: 'Dirt road access, 4WD recommended in wet conditions',
    parkingGPS: { latitude: 29.1200, longitude: -13.5700, altitude: 50 },
    walkingTime: 15
  },
  mediaItems: [{
    id: "media_1",
    type: 'image',
    url: '/images/famara-north-takeoff.jpg',
    title: 'Famara North Takeoff View',
    description: 'Launch area looking north along the coast',
    uploadDate: '2025-01-27T12:00:00Z',
    tags: ['takeoff', 'coastal', 'view']
  }],
  lastUpdated: '2025-01-27T12:00:00Z',
  createdBy: 'pilot_123',
  verified: true
};

// Save the complete location
const savedLocation = await flyzoneAPI.saveLocation({
  location: {
    title: "Famara Coastal Complex",
    description: "Premier coastal soaring location",
    region: "Famara",
    position: worldPos,
    gps: gpsCoords,
    bounds: {
      north: 29.13,
      south: 29.11,
      east: -13.56,
      west: -13.58
    },
    cameraView: {
      position: new THREE.Vector3(worldPos.x - 500, worldPos.y + 300, worldPos.z + 500),
      lookAt: worldPos,
      distance: 800
    },
    takeoffs: [takeoff],
    landingZones: [], // Add landing zones similarly
    flyzone: {
      id: "flyzone_famara",
      name: "Famara Coastal Zone",
      description: "Coastal soaring and cross-country area",
      color: 0x00aa44,
      phases: {}, // Add flight phases
      lastUpdated: '2025-01-27T12:00:00Z',
      createdBy: 'pilot_123'
    },
    popularity: 4,
    lastUpdated: '2025-01-27T12:00:00Z',
    createdBy: 'pilot_123',
    verified: true,
    bestMonths: ["March", "April", "May", "September", "October", "November"],
    averageWindDirection: 45,
    averageWindSpeed: 22
  }
});
```

#### Getting Weather Recommendations
```typescript
// Analyze current conditions
const analysis = await flyzoneAPI.getWeatherRecommendations({
  windDirection: 50,  // NE wind
  windSpeed: 22,      // 22 km/h
  userLevel: 'intermediate'
});

console.log(`Found ${analysis.recommendations.length} suitable takeoffs`);

// Get best recommendation
const best = analysis.recommendations[0];
if (best && best.score >= 70) {
  console.log(`Best takeoff: ${best.takeoff.title}`);
  console.log(`Score: ${best.score}/100`);
  console.log(`Reasoning: ${best.reasoning.join(', ')}`);

  if (best.warnings.length > 0) {
    console.log(`Warnings: ${best.warnings.join(', ')}`);
  }
}

// Check safety warnings
if (analysis.safetyWarnings.length > 0) {
  console.log('SAFETY WARNINGS:');
  analysis.safetyWarnings.forEach(warning => console.log(`⚠️ ${warning}`));
}
```

## Error Handling

All API methods return promises and should be wrapped in try-catch blocks:

```typescript
try {
  const location = await flyzoneAPI.getLocation('invalid-id');
  if (!location) {
    console.log('Location not found');
  }
} catch (error) {
  console.error('API error:', error);
}
```

## Data Persistence

Current implementation uses localStorage for persistence. In production, this would be replaced with proper database storage.

### Storage Keys
- `flyzoneLocations` - Array of FlyzoneLocation objects
- `weatherCache` - Cached weather analyses (future feature)