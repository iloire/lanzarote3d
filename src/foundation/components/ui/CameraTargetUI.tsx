import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CameraTargetController, CameraMode, CameraTarget } from '../../systems/scene/CameraTargetController';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { logger } from '../../utils/logger';

interface CameraTargetUIProps {
  controller: CameraTargetController;
  controls?: OrbitControls;
  onTargetSwitch?: (targetIndex: number, mode: CameraMode) => void;
}

const CameraTargetUIComponent: React.FC<CameraTargetUIProps> = ({
  controller,
  controls,
  onTargetSwitch,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<CameraMode>(controller.getMode());
  const targets = controller.getTargets();

  const handleTargetClick = (index: number) => {
    setCurrentTargetIndex(index);
    controller.switchToTarget(index, currentMode, 1500, controls);
    if (onTargetSwitch) {
      onTargetSwitch(index, currentMode);
    }
  };

  const handleModeChange = (mode: CameraMode) => {
    setCurrentMode(mode);
    controller.setMode(mode);
    // Re-switch to current target with new mode
    controller.switchToTarget(currentTargetIndex, mode, 1000, controls);
    if (onTargetSwitch) {
      onTargetSwitch(currentTargetIndex, mode);
    }
  };

  const targetColors: Record<string, string> = {
    'cessna': '#00bfff',
    'plane': '#00bfff',
    'jet': '#4169e1',
    'boat': '#1e90ff',
    'bird': '#32cd32',
    'car': '#ff6347',
    'truck': '#ff4500',
    'marker': '#ffa500',
    'default': '#4CAF50',
  };

  const getTargetColor = (target: CameraTarget): string => {
    const nameLower = target.name.toLowerCase();
    for (const [key, color] of Object.entries(targetColors)) {
      if (nameLower.includes(key)) {
        return color;
      }
    }
    return targetColors.default;
  };

  const modeLabels: Record<CameraMode, string> = {
    [CameraMode.Follow]: 'Follow',
    [CameraMode.FirstPerson]: 'FPV',
    [CameraMode.Orbit]: 'Orbit',
    [CameraMode.Static]: 'Static',
  };

  if (targets.length === 0) {
    return null; // Don't render if no targets
  }

  return (
    <div
      className="camera-target-ui"
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        fontFamily: 'Ubuntu Mono, monospace',
        maxWidth: '280px',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsMenuVisible(!isMenuVisible)}
        style={{
          width: '100%',
          marginBottom: '6px',
          padding: '6px',
          background: isMenuVisible ? '#4CAF50' : '#f44336',
          color: 'white',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}
        title={isMenuVisible ? 'Hide Camera Controls' : 'Show Camera Controls'}
      >
        {isMenuVisible ? 'Hide Controls' : 'Show Controls'}
      </button>

      {/* Menu content */}
      {isMenuVisible && (
        <>
          {/* Camera Modes Section */}
          <div
            style={{
              marginBottom: '6px',
              padding: '6px',
              background: 'rgba(100, 50, 200, 0.15)',
              border: '1px solid rgba(100, 50, 200, 0.4)',
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                marginBottom: '4px',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Camera Mode
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {Object.values(CameraMode)
                .filter(mode => mode !== CameraMode.FirstPerson)
                .map(mode => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  style={{
                    flex: '1',
                    background:
                      currentMode === mode
                        ? 'rgba(100, 50, 200, 0.8)'
                        : 'rgba(100, 50, 200, 0.3)',
                    color: 'white',
                    border: currentMode === mode ? '1px solid #fff' : '1px solid rgba(100, 50, 200, 0.3)',
                    borderRadius: '3px',
                    padding: '4px',
                    fontSize: '10px',
                    fontWeight: currentMode === mode ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow:
                      currentMode === mode
                        ? '0 2px 8px rgba(100, 50, 200, 0.6)'
                        : '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.filter = 'brightness(1.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  {modeLabels[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Targets Section */}
          <div
            style={{
              padding: '6px',
              background: 'rgba(0, 150, 255, 0.15)',
              border: '1px solid rgba(0, 150, 255, 0.4)',
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                marginBottom: '4px',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Targets ({targets.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {targets.map((target, index) => {
                const color = getTargetColor(target);
                const isActive = index === currentTargetIndex;

                return (
                  <button
                    key={index}
                    onClick={() => handleTargetClick(index)}
                    style={{
                      background: isActive ? color : `${color}80`,
                      color: 'white',
                      border: isActive ? '1px solid white' : '1px solid transparent',
                      borderRadius: '3px',
                      padding: '4px 6px',
                      fontSize: '11px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive
                        ? `0 2px 6px ${color}80`
                        : '0 1px 2px rgba(0,0,0,0.3)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'translateX(2px)';
                        e.currentTarget.style.filter = 'brightness(1.2)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                  >
                    <span>{target.name}</span>
                    {isActive && <span style={{ fontSize: '10px' }}>●</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Create and render the camera target UI
 */
export const createCameraTargetUI = (
  controller: CameraTargetController,
  controls?: OrbitControls,
  onTargetSwitch?: (targetIndex: number, mode: CameraMode) => void
): void => {
  const rootElement = document.getElementById('ui-controls');
  if (!rootElement) {
    logger.error('UI controls element not found');
    return;
  }

  const root = createRoot(rootElement);
  root.render(
    <CameraTargetUIComponent
      controller={controller}
      controls={controls}
      onTargetSwitch={onTargetSwitch}
    />
  );
};

export default CameraTargetUIComponent;
