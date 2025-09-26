import { SceneManager } from '../../foundation/systems/scene';
import { PerformanceMonitor } from '../../foundation/systems/analytics';
import { StoryOptions } from './types';
export interface AppConfig {
    name: string;
    description: string;
    requiredComponents: string[];
    scene?: {
        environment?: 'lanzarote' | 'custom';
        lighting?: 'dynamic' | 'static';
        physics?: boolean;
        fog?: {
            enabled: boolean;
            color?: number;
            near?: number;
            far?: number;
        };
    };
    performance?: {
        monitoring?: boolean;
        logIntervalMs?: number;
    };
}
/**
 * AppBase - Common foundation for all Lanzarote3D apps
 *
 * Provides:
 * - Standardized app initialization
 * - Performance monitoring
 * - Scene management
 * - Error handling
 * - Cleanup utilities
 */
export declare abstract class AppBase {
    protected config: AppConfig;
    protected sceneManager?: SceneManager;
    protected performanceMonitor?: PerformanceMonitor;
    protected isLoaded: boolean;
    constructor(config: AppConfig);
    protected initializeCore(options: StoryOptions): void;
    protected updatePerformance(): void;
    abstract load(options: StoryOptions): Promise<void> | void;
    protected onAppStart?(): void;
    protected onAppStop?(): void;
    protected onAppPause?(): void;
    protected onAppResume?(): void;
    protected logAppInfo(): void;
    protected handleError(error: Error, context: string): void;
    getAppInfo(): {
        name: string;
        description: string;
        components: string[];
        isLoaded: boolean;
        performance: import("../../foundation").PerformanceMetrics;
    };
    dispose(): void;
}
export default AppBase;
//# sourceMappingURL=AppBase.d.ts.map