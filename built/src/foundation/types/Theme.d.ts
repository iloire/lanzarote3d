export interface SkyTheme {
    timeOfDay: number;
    sunIntensity?: number;
    fogEnabled?: boolean;
    fogColor?: string;
    fogDensity?: number;
}
export interface CloudTheme {
    colors: string[];
    density?: number;
    scale?: number;
    opacity?: number;
}
export interface TerrainTheme {
    style: 'volcanic' | 'arctic' | 'desert' | 'alien' | 'crystal' | 'wireframe' | 'plasma';
    customMaterial?: {
        color?: string;
        emissive?: string;
        emissiveIntensity?: number;
        roughness?: number;
        metalness?: number;
        displacementScale?: number;
        displacementBias?: number;
    };
}
export interface WaterTheme {
    color: string;
    opacity: number;
    roughness?: number;
    animated?: boolean;
}
export interface WeatherTheme {
    windDirectionDegreesFromNorth: number;
    speedMetresPerSecond: number;
    lclLevel: number;
}
export interface AmbientTheme {
    lightingIntensity?: number;
    backgroundColor?: string;
    particleEffects?: boolean;
    shadowIntensity?: number;
}
export interface Theme {
    id: string;
    name: string;
    sky: SkyTheme;
    clouds: CloudTheme;
    terrain: TerrainTheme;
    water: WaterTheme;
    weather: WeatherTheme;
    ambient?: AmbientTheme;
}
export type PartialTheme = Partial<Theme> & {
    id: string;
};
export interface ThemeApplicationOptions {
    preserveCamera?: boolean;
    animateTransition?: boolean;
    transitionDuration?: number;
    skipComponents?: Array<'sky' | 'clouds' | 'terrain' | 'water' | 'weather' | 'ambient'>;
}
export default Theme;
//# sourceMappingURL=Theme.d.ts.map