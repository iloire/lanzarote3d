export declare const FLYZONE_COLORS: {
    safe: number;
    caution: number;
    danger: number;
};
export declare const LANDING_COLORS: {
    primary: number;
    secondary: number;
    emergency: number;
};
export interface FlyZoneConfig {
    display: {
        flyzone: boolean;
        markers: boolean;
        labels: boolean;
        windArrows: boolean;
    };
    colors: {
        takeoff: number;
        landing: number;
        ridge: number;
        approach: number;
    };
    opacity: {
        boxes: number;
        lines: number;
    };
}
export declare const defaultConfig: FlyZoneConfig;
export declare const getConfig: () => FlyZoneConfig;
export interface ConfigUpdate {
    display?: Partial<FlyZoneConfig['display']>;
    colors?: Partial<FlyZoneConfig['colors']>;
    opacity?: Partial<FlyZoneConfig['opacity']>;
}
export declare const updateConfig: (newConfig: ConfigUpdate) => FlyZoneConfig;
//# sourceMappingURL=flyzone-config.d.ts.map