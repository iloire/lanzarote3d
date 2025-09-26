import { StoryOptions } from '../../shared/types';
declare const PhotoBooth: {
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
export default PhotoBooth;
//# sourceMappingURL=index.d.ts.map