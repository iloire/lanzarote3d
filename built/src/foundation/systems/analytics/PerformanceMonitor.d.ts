import * as THREE from 'three';
export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    memoryUsage: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
    renderInfo: {
        triangles: number;
        geometries: number;
        textures: number;
        programs: number;
    };
    drawCalls: number;
}
export interface PerformanceThresholds {
    minFps?: number;
    maxFrameTime?: number;
    maxMemoryUsage?: number;
}
export declare class PerformanceMonitor {
    private renderer?;
    private metrics;
    private thresholds;
    private frameCount;
    private lastTime;
    private frameTimeSum;
    private fpsUpdateInterval;
    private lastFpsUpdate;
    private warningCallbacks;
    constructor(renderer?: THREE.WebGLRenderer, thresholds?: PerformanceThresholds);
    update(): void;
    private checkThresholds;
    private triggerWarning;
    getMetrics(): PerformanceMetrics;
    getFPS(): number;
    getFrameTime(): number;
    getMemoryUsage(): PerformanceMetrics['memoryUsage'];
    getRenderInfo(): PerformanceMetrics['renderInfo'];
    setRenderer(renderer: THREE.WebGLRenderer): void;
    updateThresholds(thresholds: Partial<PerformanceThresholds>): void;
    onWarning(callback: (metric: string, value: number, threshold: number) => void): void;
    removeWarning(callback: (metric: string, value: number, threshold: number) => void): void;
    generateReport(): string;
    logPerformance(): void;
    reset(): void;
}
export default PerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.d.ts.map