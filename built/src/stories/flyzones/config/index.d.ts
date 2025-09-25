export * from './gps-config';
export * from './marker-config';
export * from './flyzone-config';
export * from './wind-config';
export * from '../config';
export declare const defaultConfig: {
    showTakeoffs: boolean;
    showLandings: boolean;
    showFlyzones: boolean;
    showWind: boolean;
    windSpeed: number;
    windDirection: number;
};
export declare const getConfig: () => {
    showTakeoffs: boolean;
    showLandings: boolean;
    showFlyzones: boolean;
    showWind: boolean;
    windSpeed: number;
    windDirection: number;
};
export declare const updateConfig: (newConfig: Partial<typeof defaultConfig>) => {
    showTakeoffs: boolean;
    showLandings: boolean;
    showFlyzones: boolean;
    showWind: boolean;
    windSpeed: number;
    windDirection: number;
};
//# sourceMappingURL=index.d.ts.map