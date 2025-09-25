import * as THREE from "three";
export interface EditorState {
    locations: EditorLocation[];
    currentLocationIndex: number | null;
    selectedItem: any | null;
    mode: "location" | "takeoff" | "landing" | "flyzone";
    flyZonePhaseType: "takeoff" | "ridge" | "approach" | "landing";
    markers: THREE.Object3D[];
    flyZones: THREE.Object3D[];
    history: EditorAction[];
}
export interface EditorLocation {
    id: string;
    title: string;
    description: string;
    position: THREE.Vector3;
    gps?: {
        latitude: number;
        longitude: number;
        altitude: number;
    };
    cameraView: {
        position: THREE.Vector3;
        distance: number;
    };
    takeoffs: EditorTakeoff[];
    landingSpots: EditorLandingSpot[];
    flyzone: EditorFlyZone;
}
export interface EditorTakeoff {
    id: string;
    title: string;
    description: string;
    position: THREE.Vector3;
    gps?: {
        latitude: number;
        longitude: number;
        altitude: number;
    };
    elevation: number;
    marker: THREE.Object3D;
}
export interface EditorLandingSpot {
    id: string;
    title: string;
    description: string;
    position: THREE.Vector3;
    gps?: {
        latitude: number;
        longitude: number;
        altitude: number;
    };
    elevation: number;
    type: 'primary' | 'secondary' | 'emergency';
    marker: THREE.Object3D;
}
export interface EditorFlyZone {
    phases: {
        [key: string]: EditorFlightPhase;
    };
    object: THREE.Object3D | null;
}
export interface EditorFlightPhase {
    type: "takeoff" | "landing" | "ridge" | "approach";
    position: THREE.Vector3;
    gps?: {
        latitude: number;
        longitude: number;
        altitude: number;
    };
    dimensions: {
        width: number;
        height: number;
        length: number;
    };
    nextPhases?: string[];
    object: THREE.Object3D;
}
export interface EditorAction {
    type: 'add_takeoff' | 'add_landing' | 'add_flyzone' | 'create_location';
    object: THREE.Object3D;
    data?: any;
}
export declare const createNewLocation: (state: EditorState, position: THREE.Vector3, scene: THREE.Scene) => EditorLocation;
export declare const addTakeoff: (state: EditorState, position: THREE.Vector3, scene: THREE.Scene) => EditorTakeoff | null;
export declare const addLandingSpot: (state: EditorState, position: THREE.Vector3, scene: THREE.Scene) => EditorLandingSpot | null;
export declare const addFlyZonePhase: (state: EditorState, position: THREE.Vector3, scene: THREE.Scene) => EditorFlightPhase | null;
export declare const copyToClipboard: (text: string) => Promise<void>;
export declare const exportLocationData: (state: EditorState) => {
    metadata: string;
    takeoffs: string;
    landingSpots: string;
    flyzone: string;
};
export declare const resetLocation: (state: EditorState, scene: THREE.Scene) => void;
export declare const undoLastAction: (state: EditorState, scene: THREE.Scene) => void;
export declare const saveToLocalStorage: (state: EditorState) => void;
export declare const loadFromLocalStorage: (scene: THREE.Scene) => EditorState | null;
export declare const clearLocalStorage: () => void;
export declare const getCurrentLocation: (state: EditorState) => EditorLocation | null;
export declare const setCurrentLocation: (state: EditorState, index: number | null) => void;
export declare const deleteLocation: (state: EditorState, index: number, scene: THREE.Scene) => void;
export declare const editLocation: (state: EditorState, index: number, properties: Partial<Pick<EditorLocation, "title" | "description">>) => void;
//# sourceMappingURL=state.d.ts.map