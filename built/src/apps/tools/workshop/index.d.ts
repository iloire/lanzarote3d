import { StoryOptions } from '../../shared/types';
declare const Workshop: {
    load: (options: StoryOptions) => Promise<void>;
    dispose: () => void;
    getAppInfo: () => {
        name: string;
        description: string;
        components: string[];
        isLoaded: boolean;
        performance: import("../../../foundation").PerformanceMetrics;
    };
};
export default Workshop;
//# sourceMappingURL=index.d.ts.map