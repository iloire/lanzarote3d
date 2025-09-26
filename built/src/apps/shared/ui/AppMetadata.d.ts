import React from 'react';
export interface AppInfo {
    name: string;
    description: string;
    version: string;
    components: string[];
    bundleSize?: string;
    loadTime?: number;
}
interface AppMetadataProps {
    appInfo: AppInfo;
    show: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
/**
 * AppMetadata - Beautiful overlay showing app information
 *
 * Perfect for showcasing the foundation architecture benefits:
 * - Component usage
 * - Bundle optimization
 * - Load performance
 */
export declare const AppMetadata: React.FC<AppMetadataProps>;
export default AppMetadata;
//# sourceMappingURL=AppMetadata.d.ts.map