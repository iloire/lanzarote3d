import * as THREE from 'three';

// Core data types for the flyzone management system
export interface GPS {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  uploadDate: string;
  tags?: string[];
}

export interface WindCondition {
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

export interface SafetyInfo {
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

export interface TakeoffLocation {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  gps: GPS;
  elevation: number;

  // Wind and conditions
  windConditions: WindCondition[];
  safety: SafetyInfo;

  // Access and logistics
  access: {
    difficulty: 'easy' | 'moderate' | 'difficult';
    description: string;
    parkingGPS?: GPS;
    walkingTime: number; // minutes
  };

  // Media and documentation
  mediaItems: MediaItem[];
  lastUpdated: string;
  createdBy: string;
  verified: boolean;
}

export interface LandingZone {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  gps: GPS;
  elevation: number;
  type: 'primary' | 'secondary' | 'emergency';

  // Landing characteristics
  size: {
    width: number; // meters
    length: number; // meters
  };
  surface: 'grass' | 'sand' | 'gravel' | 'paved' | 'mixed';
  obstacles: string[];
  approach: {
    preferredDirection: number; // degrees
    gradient: number; // degrees
    warnings: string[];
  };

  // Conditions and safety
  windLimitations: {
    maxSpeed: number; // km/h
    unsafeDirections: number[]; // degrees
  };

  // Media and documentation
  mediaItems: MediaItem[];
  lastUpdated: string;
  createdBy: string;
  verified: boolean;
}

export interface FlightPhase {
  id: string;
  type: 'takeoff' | 'climb' | 'ridge' | 'thermal' | 'approach' | 'landing';
  position: THREE.Vector3;
  gps: GPS;
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
  description: string;
  altitudeRange: {
    min: number;
    max: number;
  };
  nextPhases: string[];
  warnings?: string[];
}

export interface FlyZone {
  id: string;
  name: string;
  description: string;
  color: number; // hex color for 3D visualization
  phases: { [key: string]: FlightPhase };
  restrictions?: {
    maxAltitude?: number;
    timeRestrictions?: string;
    seasonalRestrictions?: string;
  };
  lastUpdated: string;
  createdBy: string;
}

export interface FlyzoneLocation {
  id: string;
  title: string;
  description: string;
  region: string; // e.g., "Famara", "Mancha Blanca"

  // Geographic data
  position: THREE.Vector3; // Center point
  gps: GPS;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };

  // Camera view for visualization
  cameraView: {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
    distance: number;
  };

  // Flight components
  takeoffs: TakeoffLocation[];
  landingZones: LandingZone[];
  flyzone: FlyZone;

  // Metadata
  popularity: number; // 1-5 stars based on usage
  lastUpdated: string;
  createdBy: string;
  verified: boolean;

  // Weather and seasonal info
  bestMonths: string[];
  averageWindDirection: number;
  averageWindSpeed: number;
}

// Wind analysis and recommendation types
export interface CurrentWeather {
  windDirection: number; // degrees
  windSpeed: number; // km/h
  gustSpeed?: number; // km/h
  timestamp: string;
  source: string;
}

export interface TakeoffRecommendation {
  takeoff: TakeoffLocation;
  score: number; // 0-100
  reasoning: string[];
  warnings: string[];
  windMatch: {
    directionScore: number; // 0-100
    speedScore: number; // 0-100
    overallScore: number; // 0-100
  };
}

export interface WeatherAnalysis {
  currentWeather: CurrentWeather;
  recommendations: TakeoffRecommendation[];
  generalAdvice: string[];
  safetyWarnings: string[];
  timestamp: string;
}

// API response types
export interface FlyzoneLocationSummary {
  id: string;
  title: string;
  region: string;
  takeoffCount: number;
  landingZoneCount: number;
  popularity: number;
  lastUpdated: string;
  verified: boolean;
}

export interface SaveLocationRequest {
  location: Omit<FlyzoneLocation, 'id' | 'lastUpdated'>;
}

export interface UpdateLocationRequest {
  id: string;
  location: Partial<FlyzoneLocation>;
}

export interface WeatherRequest {
  locationIds?: string[];
  windDirection: number;
  windSpeed: number;
  userLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}
