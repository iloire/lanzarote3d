import { StoryOptions } from '../../shared/types';
import './styles/ruler.css';
import './styles/popup.css';
declare const FlyZones: {
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
export default FlyZones;
//# sourceMappingURL=index.d.ts.map