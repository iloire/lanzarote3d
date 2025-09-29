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
export const AppMetadata: React.FC<AppMetadataProps> = ({
  appInfo,
  show,
  position = 'top-right',
}) => {
  if (!show) return null;

  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={`fixed ${positionStyles[position]} z-50 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm font-mono max-w-xs`}
      style={{
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="mb-2">
        <h3 className="text-lg font-bold text-blue-400">{appInfo.name}</h3>
        <p className="text-gray-300 text-xs">{appInfo.description}</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Version:</span>
          <span className="text-green-400">{appInfo.version}</span>
        </div>

        {appInfo.bundleSize && (
          <div className="flex justify-between">
            <span className="text-gray-400">Bundle:</span>
            <span className="text-yellow-400">{appInfo.bundleSize}</span>
          </div>
        )}

        {appInfo.loadTime && (
          <div className="flex justify-between">
            <span className="text-gray-400">Load Time:</span>
            <span className="text-purple-400">{appInfo.loadTime}ms</span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-gray-400 text-xs mb-1">Foundation Components:</div>
        <div className="flex flex-wrap gap-1">
          {appInfo.components.map((component, index) => (
            <span key={index} className="bg-blue-600 bg-opacity-30 px-2 py-1 rounded text-xs">
              {component}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-500">🏗️ Built with Foundation v3.0.0</div>
      </div>
    </div>
  );
};

export default AppMetadata;
