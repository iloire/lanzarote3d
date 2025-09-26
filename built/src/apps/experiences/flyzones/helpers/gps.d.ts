import * as THREE from 'three';
export interface GPSAnchor {
    gps: {
        latitude: number;
        longitude: number;
        altitude: number;
    };
    world: THREE.Vector3;
}
export interface WorldScale {
    metersPerDegreeLatitude: number;
    metersPerDegreeLongitude: number;
    northOffset: number;
}
/**
 * Converts GPS coordinates to 3D world coordinates
 */
export declare function gpsToWorld(latitude: number, longitude: number, altitude?: number, anchor?: GPSAnchor, scale?: WorldScale): THREE.Vector3;
/**
 * Converts 3D world coordinates to GPS coordinates
 */
export declare function worldToGPS(position: THREE.Vector3, anchor?: GPSAnchor, scale?: WorldScale): {
    latitude: number;
    longitude: number;
    altitude: number;
};
export declare const defaultAnchor: GPSAnchor;
export declare const defaultScale: WorldScale;
//# sourceMappingURL=gps.d.ts.map