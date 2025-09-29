import * as THREE from 'three';
import {
  FlyzoneLocation,
  FlyzoneLocationSummary,
  SaveLocationRequest,
  UpdateLocationRequest,
  WeatherRequest,
  WeatherAnalysis,
  CurrentWeather,
  TakeoffRecommendation,
} from '../types/flyzone-types';

/**
 * FlyzoneAPI - Backend API for managing flyzone locations and weather analysis
 *
 * This API provides:
 * - CRUD operations for flyzone locations
 * - Weather-based takeoff recommendations
 * - JSON file persistence
 * - GPS coordinate conversion utilities
 */
export class FlyzoneAPI {
  private readonly DATA_DIR = '/data/flyzones';
  private readonly LOCATIONS_FILE = `${this.DATA_DIR}/locations.json`;
  private readonly WEATHER_CACHE_FILE = `${this.DATA_DIR}/weather-cache.json`;

  /**
   * Initialize the API and ensure data directory exists
   */
  async initialize(): Promise<void> {
    try {
      // In a browser environment, we'll use localStorage for persistence
      // In a Node.js environment, we would use filesystem operations
      if (typeof window !== 'undefined') {
        console.log('FlyzoneAPI initialized with localStorage persistence');
      }
    } catch (error) {
      console.error('Failed to initialize FlyzoneAPI:', error);
      throw error;
    }
  }

  /**
   * Get all flyzone locations with summary information
   */
  async getLocationSummaries(): Promise<FlyzoneLocationSummary[]> {
    try {
      const locations = await this.loadLocations();
      return locations.map(location => ({
        id: location.id,
        title: location.title,
        region: location.region,
        takeoffCount: location.takeoffs.length,
        landingZoneCount: location.landingZones.length,
        popularity: location.popularity,
        lastUpdated: location.lastUpdated,
        verified: location.verified,
      }));
    } catch (error) {
      console.error('Failed to get location summaries:', error);
      return [];
    }
  }

  /**
   * Get a specific flyzone location by ID
   */
  async getLocation(id: string): Promise<FlyzoneLocation | null> {
    try {
      const locations = await this.loadLocations();
      return locations.find(location => location.id === id) || null;
    } catch (error) {
      console.error(`Failed to get location ${id}:`, error);
      return null;
    }
  }

  /**
   * Save a new flyzone location
   */
  async saveLocation(request: SaveLocationRequest): Promise<FlyzoneLocation> {
    try {
      const locations = await this.loadLocations();

      const newLocation: FlyzoneLocation = {
        id: this.generateId(),
        lastUpdated: new Date().toISOString(),
        ...request.location,
      };

      locations.push(newLocation);
      await this.saveLocations(locations);

      console.log(`Saved new flyzone location: ${newLocation.title} (${newLocation.id})`);
      return newLocation;
    } catch (error) {
      console.error('Failed to save location:', error);
      throw error;
    }
  }

  /**
   * Update an existing flyzone location
   */
  async updateLocation(request: UpdateLocationRequest): Promise<FlyzoneLocation | null> {
    try {
      const locations = await this.loadLocations();
      const index = locations.findIndex(location => location.id === request.id);

      if (index === -1) {
        return null;
      }

      const updatedLocation = {
        ...locations[index],
        ...request.location,
        lastUpdated: new Date().toISOString(),
      };

      locations[index] = updatedLocation;
      await this.saveLocations(locations);

      console.log(`Updated flyzone location: ${updatedLocation.title} (${updatedLocation.id})`);
      return updatedLocation;
    } catch (error) {
      console.error(`Failed to update location ${request.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a flyzone location
   */
  async deleteLocation(id: string): Promise<boolean> {
    try {
      const locations = await this.loadLocations();
      const initialLength = locations.length;
      const filteredLocations = locations.filter(location => location.id !== id);

      if (filteredLocations.length === initialLength) {
        return false; // Location not found
      }

      await this.saveLocations(filteredLocations);
      console.log(`Deleted flyzone location: ${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete location ${id}:`, error);
      return false;
    }
  }

  /**
   * Get weather-based takeoff recommendations
   */
  async getWeatherRecommendations(request: WeatherRequest): Promise<WeatherAnalysis> {
    try {
      const locations = await this.loadLocations();
      const currentWeather: CurrentWeather = {
        windDirection: request.windDirection,
        windSpeed: request.windSpeed,
        timestamp: new Date().toISOString(),
        source: 'user-input',
      };

      const recommendations: TakeoffRecommendation[] = [];

      // Filter locations if specific IDs provided
      const targetLocations = request.locationIds
        ? locations.filter(loc => request.locationIds!.includes(loc.id))
        : locations;

      // Analyze each takeoff location
      for (const location of targetLocations) {
        for (const takeoff of location.takeoffs) {
          const recommendation = this.analyzeWindConditions(
            takeoff,
            currentWeather,
            request.userLevel || 'intermediate'
          );
          recommendations.push(recommendation);
        }
      }

      // Sort by score (best first)
      recommendations.sort((a, b) => b.score - a.score);

      const analysis: WeatherAnalysis = {
        currentWeather,
        recommendations,
        generalAdvice: this.generateGeneralAdvice(
          currentWeather,
          request.userLevel || 'intermediate'
        ),
        safetyWarnings: this.generateSafetyWarnings(
          currentWeather,
          request.userLevel || 'intermediate'
        ),
        timestamp: new Date().toISOString(),
      };

      return analysis;
    } catch (error) {
      console.error('Failed to get weather recommendations:', error);
      throw error;
    }
  }

  /**
   * Convert GPS coordinates to Three.js world position
   */
  gpsToWorldPosition(gps: {
    latitude: number;
    longitude: number;
    altitude: number;
  }): THREE.Vector3 {
    // Lanzarote reference point (approximate center)
    const LAT_REF = 29.0469; // Lanzarote center latitude
    const LON_REF = -13.5896; // Lanzarote center longitude

    // Convert to meters from reference point
    const x = (gps.longitude - LON_REF) * 111320 * Math.cos((LAT_REF * Math.PI) / 180);
    const z = -(gps.latitude - LAT_REF) * 110540; // Negative Z for correct orientation
    const y = gps.altitude;

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Convert Three.js world position to GPS coordinates
   */
  worldPositionToGPS(position: THREE.Vector3): {
    latitude: number;
    longitude: number;
    altitude: number;
  } {
    const LAT_REF = 29.0469;
    const LON_REF = -13.5896;

    const latitude = LAT_REF - position.z / 110540;
    const longitude = LON_REF + position.x / (111320 * Math.cos((LAT_REF * Math.PI) / 180));
    const altitude = position.y;

    return { latitude, longitude, altitude };
  }

  // Private helper methods

  private async loadLocations(): Promise<FlyzoneLocation[]> {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('flyzoneLocations');
        return data ? JSON.parse(data) : [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load locations:', error);
      return [];
    }
  }

  private async saveLocations(locations: FlyzoneLocation[]): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('flyzoneLocations', JSON.stringify(locations, null, 2));
      }
    } catch (error) {
      console.error('Failed to save locations:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `flyzone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private analyzeWindConditions(
    takeoff: any,
    weather: CurrentWeather,
    userLevel: string
  ): TakeoffRecommendation {
    const windConditions = takeoff.windConditions || [];
    let bestMatch = null;
    let bestScore = 0;

    // Find best matching wind condition
    for (const condition of windConditions) {
      const directionScore = this.calculateDirectionScore(
        weather.windDirection,
        condition.direction
      );
      const speedScore = this.calculateSpeedScore(weather.windSpeed, condition.speed);
      const overallScore = (directionScore + speedScore) / 2;

      if (overallScore > bestScore) {
        bestScore = overallScore;
        bestMatch = {
          directionScore,
          speedScore,
          overallScore,
        };
      }
    }

    const windMatch = bestMatch || { directionScore: 0, speedScore: 0, overallScore: 0 };
    const score = Math.round(windMatch.overallScore);

    return {
      takeoff,
      score,
      reasoning: this.generateReasoning(score, windMatch, weather),
      warnings: this.generateWarnings(takeoff, weather, userLevel),
      windMatch,
    };
  }

  private calculateDirectionScore(windDirection: number, idealDirection: any): number {
    const ideal = idealDirection.ideal;
    const range = idealDirection.range;

    // Normalize angles to 0-360
    const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

    const normalizedWind = normalizeAngle(windDirection);
    const normalizedIdeal = normalizeAngle(ideal);

    // Calculate angular difference (shortest path)
    let diff = Math.abs(normalizedWind - normalizedIdeal);
    if (diff > 180) diff = 360 - diff;

    // Check if within acceptable range
    const rangeSize = Math.abs(range[1] - range[0]);
    if (diff <= rangeSize / 2) {
      return 100 - (diff / (rangeSize / 2)) * 30; // 70-100 if within range
    }

    // Score decreases with distance from range
    const maxDeviation = 90; // Maximum useful deviation
    if (diff > maxDeviation) return 0;

    return Math.max(0, 70 - (diff / maxDeviation) * 70);
  }

  private calculateSpeedScore(windSpeed: number, idealSpeed: any): number {
    const { min, max, ideal } = idealSpeed;

    if (windSpeed >= min && windSpeed <= max) {
      // Within acceptable range
      const distanceFromIdeal = Math.abs(windSpeed - ideal);
      const rangeSize = max - min;
      return Math.max(70, 100 - (distanceFromIdeal / rangeSize) * 30);
    }

    // Outside acceptable range
    if (windSpeed < min) {
      const deficit = min - windSpeed;
      return Math.max(0, 70 - (deficit / min) * 70);
    }

    if (windSpeed > max) {
      const excess = windSpeed - max;
      return Math.max(0, 70 - (excess / max) * 70);
    }

    return 0;
  }

  private generateReasoning(score: number, windMatch: any, weather: CurrentWeather): string[] {
    const reasoning = [];

    if (score >= 80) {
      reasoning.push('Excellent wind conditions for this takeoff');
    } else if (score >= 60) {
      reasoning.push('Good wind conditions with minor adjustments needed');
    } else if (score >= 40) {
      reasoning.push('Marginal conditions - proceed with caution');
    } else {
      reasoning.push('Poor conditions - not recommended');
    }

    if (windMatch.directionScore < 50) {
      reasoning.push(`Wind direction (${weather.windDirection}°) not optimal for this takeoff`);
    }

    if (windMatch.speedScore < 50) {
      reasoning.push(`Wind speed (${weather.windSpeed} km/h) outside ideal range`);
    }

    return reasoning;
  }

  private generateWarnings(takeoff: any, weather: CurrentWeather, userLevel: string): string[] {
    const warnings = [];

    // High wind speed warnings
    if (weather.windSpeed > 35) {
      warnings.push('Strong winds - advanced pilots only');
    }

    // Low wind speed warnings
    if (weather.windSpeed < 8) {
      warnings.push('Light winds - difficult for beginners');
    }

    // User level specific warnings
    if (userLevel === 'beginner' && takeoff.safety?.difficulty !== 'beginner') {
      warnings.push('This takeoff is not suitable for beginners');
    }

    // Site-specific safety warnings
    if (takeoff.safety?.hazards?.length > 0) {
      warnings.push(`Site hazards: ${takeoff.safety.hazards.join(', ')}`);
    }

    return warnings;
  }

  private generateGeneralAdvice(weather: CurrentWeather, userLevel: string): string[] {
    const advice = [];

    if (weather.windSpeed < 10) {
      advice.push('Light wind conditions - consider thermal flying');
    } else if (weather.windSpeed > 30) {
      advice.push('Strong wind conditions - only for experienced pilots');
    }

    if (userLevel === 'beginner') {
      advice.push('Always fly with an instructor in new conditions');
      advice.push('Check local weather reports and forecasts');
    }

    advice.push('Verify wind conditions at launch before committing');
    advice.push('Have an escape plan and emergency contacts ready');

    return advice;
  }

  private generateSafetyWarnings(weather: CurrentWeather, userLevel: string): string[] {
    const warnings = [];

    if (weather.windSpeed > 40) {
      warnings.push('DANGER: Extreme wind conditions - flying not recommended');
    }

    if (weather.gustSpeed && weather.gustSpeed > weather.windSpeed * 1.5) {
      warnings.push('WARNING: Strong gusts detected - high turbulence risk');
    }

    if (userLevel === 'beginner' && weather.windSpeed > 20) {
      warnings.push('WARNING: Wind speed too high for beginner pilots');
    }

    return warnings;
  }
}

// Singleton instance
export const flyzoneAPI = new FlyzoneAPI();
