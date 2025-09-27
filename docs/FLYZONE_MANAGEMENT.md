# Flyzone Management System

## Overview

The Flyzone Management System is a comprehensive tool for paragliding pilots to discover, edit, and analyze takeoff locations on Lanzarote. It provides wind-based recommendations to help pilots find the best flying conditions for their skill level.

## System Architecture

### Core Components

1. **FlyzoneAPI** - Backend API for data management and weather analysis
2. **FlyzoneEditor** - Interactive terrain-based editor for creating/editing locations
3. **FlyzoneVisualizer** - Map-based visualizer with wind analysis
4. **Data Types** - Comprehensive TypeScript interfaces for type safety

### Data Structure

The system uses the following main data types:

- **FlyzoneLocation** - Complete location with takeoffs, landings, and flight zones
- **TakeoffLocation** - Specific takeoff point with wind conditions and safety info
- **LandingZone** - Landing area with approach characteristics and safety data
- **WindCondition** - Wind analysis data for optimal flying conditions
- **MediaItem** - Images and videos for location documentation

## FlyzoneAPI Documentation

### Initialization

```typescript
import { flyzoneAPI } from '../api/flyzone-api';

await flyzoneAPI.initialize();
```

### Location Management

#### Get All Locations (Summary)
```typescript
const summaries = await flyzoneAPI.getLocationSummaries();
// Returns: FlyzoneLocationSummary[]
```

#### Get Specific Location
```typescript
const location = await flyzoneAPI.getLocation('flyzone_123');
// Returns: FlyzoneLocation | null
```

#### Save New Location
```typescript
const request: SaveLocationRequest = {
  location: {
    title: "Famara North",
    description: "Popular takeoff with consistent coastal winds",
    region: "Famara",
    position: new THREE.Vector3(6279, 100, -3155),
    gps: { latitude: 29.1234, longitude: -13.5678, altitude: 100 },
    // ... other properties
  }
};

const newLocation = await flyzoneAPI.saveLocation(request);
```

#### Update Location
```typescript
const updateRequest: UpdateLocationRequest = {
  id: 'flyzone_123',
  location: {
    title: "Updated Title",
    verified: true
  }
};

const updated = await flyzoneAPI.updateLocation(updateRequest);
```

#### Delete Location
```typescript
const success = await flyzoneAPI.deleteLocation('flyzone_123');
```

### Weather Analysis

#### Get Wind-Based Recommendations
```typescript
const weatherRequest: WeatherRequest = {
  windDirection: 45,  // degrees (0-360)
  windSpeed: 25,      // km/h
  userLevel: 'intermediate'
};

const analysis = await flyzoneAPI.getWeatherRecommendations(weatherRequest);
```

The weather analysis returns:
- **Current weather conditions**
- **Ranked takeoff recommendations** (scored 0-100)
- **General flying advice**
- **Safety warnings**

### Coordinate Conversion

#### GPS to World Position
```typescript
const gps = { latitude: 29.1234, longitude: -13.5678, altitude: 100 };
const worldPos = flyzoneAPI.gpsToWorldPosition(gps);
// Returns: THREE.Vector3
```

#### World Position to GPS
```typescript
const position = new THREE.Vector3(1000, 100, -2000);
const gps = flyzoneAPI.worldPositionToGPS(position);
// Returns: { latitude, longitude, altitude }
```

## Wind Analysis Algorithm

The system uses a sophisticated scoring algorithm for takeoff recommendations:

### Direction Scoring (0-100)
- **Perfect match**: Wind direction matches ideal direction (100 points)
- **Within range**: Wind within acceptable range (70-100 points)
- **Outside range**: Score decreases with angular deviation (0-70 points)

### Speed Scoring (0-100)
- **Ideal speed**: Perfect wind speed for conditions (100 points)
- **Acceptable range**: Within min/max limits (70-100 points)
- **Outside range**: Score decreases with deviation (0-70 points)

### Overall Score
- Combines direction and speed scores
- Factors in pilot skill level
- Considers site-specific hazards
- Generates contextual warnings and advice

## Safety Features

### Pilot Skill Integration
- **Beginner**: Limited to easy sites, conservative wind limits
- **Intermediate**: Access to moderate difficulty sites
- **Advanced/Expert**: Full access with appropriate warnings

### Wind Condition Warnings
- **Light winds** (<8 km/h): Thermal flying advice
- **Strong winds** (>35 km/h): Advanced pilots only
- **Extreme winds** (>40 km/h): Flying not recommended
- **Gusty conditions**: Turbulence warnings

### Site-Specific Safety
- **Hazard identification**: Obstacles, power lines, restricted areas
- **Emergency information**: Contacts, procedures, nearest hospital
- **Access difficulty**: Parking, walking time, terrain difficulty

## Data Persistence

The system uses JSON file persistence:

### Browser Environment
- Data stored in localStorage
- Automatic synchronization
- Offline capability

### Server Environment (Future)
- File-based JSON storage
- Backup and versioning
- Multi-user support

## Usage Examples

### Finding Best Takeoff for Current Conditions

```typescript
// Get current wind conditions
const weatherRequest = {
  windDirection: 45,
  windSpeed: 20,
  userLevel: 'intermediate'
};

// Get recommendations
const analysis = await flyzoneAPI.getWeatherRecommendations(weatherRequest);

// Find best takeoff
const bestTakeoff = analysis.recommendations[0];
console.log(`Best takeoff: ${bestTakeoff.takeoff.title}`);
console.log(`Score: ${bestTakeoff.score}/100`);
console.log(`Reasoning: ${bestTakeoff.reasoning.join(', ')}`);
```

### Adding New Takeoff Location

```typescript
// Convert GPS to world coordinates
const gpsCoords = { latitude: 29.1234, longitude: -13.5678, altitude: 150 };
const worldPos = flyzoneAPI.gpsToWorldPosition(gpsCoords);

// Create location data
const newLocation = {
  title: "New Takeoff",
  description: "Newly discovered launch site",
  region: "Famara",
  position: worldPos,
  gps: gpsCoords,
  takeoffs: [{
    id: "takeoff_1",
    title: "Main Launch",
    description: "Primary takeoff area",
    position: worldPos,
    gps: gpsCoords,
    elevation: 150,
    windConditions: [{
      id: "wind_1",
      direction: { ideal: 45, range: [30, 60] },
      speed: { min: 15, max: 35, ideal: 25 },
      rating: 4,
      description: "Excellent coastal soaring conditions"
    }],
    safety: {
      difficulty: 'intermediate',
      hazards: ['power lines 200m south'],
      emergency: {
        contacts: ['+34 123 456 789'],
        procedures: ['Land in designated field'],
        nearestHospital: 'Hospital Arrecife'
      }
    },
    // ... other properties
  }],
  // ... other properties
};

// Save to system
const saved = await flyzoneAPI.saveLocation({ location: newLocation });
```

## Future Enhancements

### Planned Features
- **Real-time weather integration** - Live wind data from weather stations
- **Flight planning tools** - Route optimization and thermal mapping
- **Community features** - User reviews and condition reports
- **Mobile app** - Native iOS/Android application
- **Advanced analytics** - Flight statistics and trend analysis

### Technical Improvements
- **Server-side persistence** - Database integration
- **Real-time updates** - WebSocket for live data
- **Offline maps** - Cached terrain data
- **Performance optimization** - Large dataset handling
- **Multi-language support** - Internationalization