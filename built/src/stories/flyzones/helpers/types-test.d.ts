export declare enum MarkerType {
    LOCATION = "location",
    TAKEOFF = "takeoff",
    LANDING = "landing"
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
//# sourceMappingURL=types-test.d.ts.map