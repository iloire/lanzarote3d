import { StoryOptions } from '../../shared/types';
import './styles.css';
declare const LocationEditor: {
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
export default LocationEditor;
//# sourceMappingURL=index.d.ts.map