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
export declare function gpsToWorld(latitude: number, longitude: number, altitude?: number, anchor?: GPSAnchor, scale?: WorldScale): THREE.Vector3;
export declare function worldToGPS(position: THREE.Vector3, anchor?: GPSAnchor, scale?: WorldScale): {
    latitude: number;
    longitude: number;
    altitude: number;
};
export declare const defaultAnchor: GPSAnchor;
export declare const defaultScale: WorldScale;
//# sourceMappingURL=gps.d.ts.map