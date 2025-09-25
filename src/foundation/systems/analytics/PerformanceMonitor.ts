import * as THREE from "three";

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

export class PerformanceMonitor {
  private renderer?: THREE.WebGLRenderer;
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;

  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private frameTimeSum: number = 0;
  private fpsUpdateInterval: number = 1000; // Update FPS every second
  private lastFpsUpdate: number = performance.now();

  private warningCallbacks: Array<(metric: string, value: number, threshold: number) => void> = [];

  constructor(renderer?: THREE.WebGLRenderer, thresholds: PerformanceThresholds = {}) {
    this.renderer = renderer;
    this.thresholds = {
      minFps: 30,
      maxFrameTime: 33.33, // ~30 FPS
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      ...thresholds
    };

    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      },
      renderInfo: {
        triangles: 0,
        geometries: 0,
        textures: 0,
        programs: 0
      },
      drawCalls: 0
    };
  }

  // Update metrics (call this every frame)
  update(): void {
    const now = performance.now();
    const deltaTime = now - this.lastTime;

    // Update frame time
    this.metrics.frameTime = deltaTime;
    this.frameTimeSum += deltaTime;
    this.frameCount++;

    // Update FPS periodically
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.metrics.fps = (this.frameCount * 1000) / (now - this.lastFpsUpdate);
      this.frameCount = 0;
      this.frameTimeSum = 0;
      this.lastFpsUpdate = now;
    }

    // Update memory usage
    if (performance.memory) {
      this.metrics.memoryUsage = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }

    // Update renderer info if available
    if (this.renderer) {
      const info = this.renderer.info;
      this.metrics.renderInfo = {
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length || 0
      };
      this.metrics.drawCalls = info.render.calls;
    }

    this.lastTime = now;
    this.checkThresholds();
  }

  private checkThresholds(): void {
    if (this.thresholds.minFps && this.metrics.fps < this.thresholds.minFps) {
      this.triggerWarning('fps', this.metrics.fps, this.thresholds.minFps);
    }

    if (this.thresholds.maxFrameTime && this.metrics.frameTime > this.thresholds.maxFrameTime) {
      this.triggerWarning('frameTime', this.metrics.frameTime, this.thresholds.maxFrameTime);
    }

    if (this.thresholds.maxMemoryUsage &&
        this.metrics.memoryUsage.usedJSHeapSize > this.thresholds.maxMemoryUsage) {
      this.triggerWarning('memoryUsage', this.metrics.memoryUsage.usedJSHeapSize, this.thresholds.maxMemoryUsage);
    }
  }

  private triggerWarning(metric: string, value: number, threshold: number): void {
    this.warningCallbacks.forEach(callback => {
      callback(metric, value, threshold);
    });
  }

  // Public API methods
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getFPS(): number {
    return this.metrics.fps;
  }

  getFrameTime(): number {
    return this.metrics.frameTime;
  }

  getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    return { ...this.metrics.memoryUsage };
  }

  getRenderInfo(): PerformanceMetrics['renderInfo'] {
    return { ...this.metrics.renderInfo };
  }

  // Set renderer for render info monitoring
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  // Update thresholds
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  // Add warning callback
  onWarning(callback: (metric: string, value: number, threshold: number) => void): void {
    this.warningCallbacks.push(callback);
  }

  // Remove warning callback
  removeWarning(callback: (metric: string, value: number, threshold: number) => void): void {
    const index = this.warningCallbacks.indexOf(callback);
    if (index > -1) {
      this.warningCallbacks.splice(index, 1);
    }
  }

  // Generate performance report
  generateReport(): string {
    const report = [
      `Performance Report (${new Date().toISOString()})`,
      `================================`,
      `FPS: ${this.metrics.fps.toFixed(1)}`,
      `Frame Time: ${this.metrics.frameTime.toFixed(2)}ms`,
      `Memory Usage: ${(this.metrics.memoryUsage.usedJSHeapSize / (1024 * 1024)).toFixed(1)}MB / ${(this.metrics.memoryUsage.jsHeapSizeLimit / (1024 * 1024)).toFixed(1)}MB`,
      `Triangles: ${this.metrics.renderInfo.triangles.toLocaleString()}`,
      `Draw Calls: ${this.metrics.drawCalls}`,
      `Geometries: ${this.metrics.renderInfo.geometries}`,
      `Textures: ${this.metrics.renderInfo.textures}`,
      `Programs: ${this.metrics.renderInfo.programs}`,
      ``
    ];

    return report.join('\n');
  }

  // Log performance info to console
  logPerformance(): void {
    console.group('Performance Monitor');
    console.log(`FPS: ${this.metrics.fps.toFixed(1)}`);
    console.log(`Frame Time: ${this.metrics.frameTime.toFixed(2)}ms`);
    console.log(`Memory: ${(this.metrics.memoryUsage.usedJSHeapSize / (1024 * 1024)).toFixed(1)}MB`);
    console.log(`Triangles: ${this.metrics.renderInfo.triangles.toLocaleString()}`);
    console.log(`Draw Calls: ${this.metrics.drawCalls}`);
    console.groupEnd();
  }

  // Reset metrics
  reset(): void {
    this.frameCount = 0;
    this.frameTimeSum = 0;
    this.lastTime = performance.now();
    this.lastFpsUpdate = performance.now();

    this.metrics.fps = 0;
    this.metrics.frameTime = 0;
  }
}

export default PerformanceMonitor;