export declare enum MarkerType {
    LOCATION = "location",
    TAKEOFF = "takeoff",
    LANDING = "landing"
}
export interface Marker {
    type: MarkerType;
    position: any;
    object?: any;
    label?: any;
    data?: any;
    pin: any;
    setVisibility?: (visible: boolean) => void;
}
export interface GPS {
    latitude: number;
    longitude: number;
    altitude: number;
}
export interface Media {
    type: 'image' | 'video';
    url: string;
    title?: string;
}
export interface WindDirection {
    ideal: number;
    range: [number, number];
}
export interface WindCondition {
    direction: WindDirection;
    speed: {
        min: number;
        max: number;
        ideal: number;
    };
    rating: number;
    description: string;
}
export interface Takeoff {
    id: string;
    title: string;
    description: string;
    position: any;
    gps?: GPS;
    elevation: number;
    conditions: WindCondition[];
    mediaItems: Media[];
}
export interface LandingSpot {
    id: string;
    title: string;
    description: string;
    position: any;
    gps?: GPS;
    elevation: number;
    type: 'primary' | 'secondary' | 'emergency';
    mediaItems: Media[];
}
export interface FlightPhase {
    type: string;
    gps: GPS;
    position: any;
    dimensions: {
        width: number;
        height: number;
        length: number;
    };
    nextPhases?: string[];
}
export interface FlyZoneShape {
    color?: number;
    phases: {
        [key: string]: FlightPhase;
    };
}
export interface LocationMetadata {
    id: string;
    title: string;
    description: string;
    position: any;
    gps?: GPS;
    cameraView: {
        position: any;
        lookAt?: any;
        distance?: number;
    };
}
export interface Location extends LocationMetadata {
    takeoffs: Takeoff[];
    landingSpots?: LandingSpot[];
    flyzone?: FlyZoneShape;
}
//# sourceMappingURL=types.d.ts.map