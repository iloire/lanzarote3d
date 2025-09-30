import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CameraTargetController, CameraMode, CameraTarget } from '../../systems/scene/CameraTargetController';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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

  const modeIcons: Record<CameraMode, string> = {
    [CameraMode.Follow]: '🎥',
    [CameraMode.FirstPerson]: '👁️',
    [CameraMode.Orbit]: '🔄',
    [CameraMode.Static]: '📌',
  };

  const modeLabels: Record<CameraMode, string> = {
    [CameraMode.Follow]: 'Follow',
    [CameraMode.FirstPerson]: 'First Person',
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
          marginBottom: '10px',
          padding: '10px',
          background: isMenuVisible ? '#4CAF50' : '#f44336',
          color: 'white',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}
        title={isMenuVisible ? 'Hide Camera Controls' : 'Show Camera Controls'}
      >
        {isMenuVisible ? '📷 Hide Camera Controls' : '📷 Show Camera Controls'}
      </button>

      {/* Menu content */}
      {isMenuVisible && (
        <>
          {/* Camera Modes Section */}
          <div
            style={{
              marginBottom: '15px',
              padding: '12px',
              background: 'rgba(100, 50, 200, 0.15)',
              border: '1px solid rgba(100, 50, 200, 0.4)',
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '10px',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              🎬 Camera Mode
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {Object.values(CameraMode).map(mode => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  style={{
                    background:
                      currentMode === mode
                        ? 'rgba(100, 50, 200, 0.8)'
                        : 'rgba(100, 50, 200, 0.3)',
                    color: 'white',
                    border: currentMode === mode ? '2px solid #fff' : '2px solid transparent',
                    borderRadius: '4px',
                    padding: '8px 6px',
                    fontSize: '11px',
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
                  {modeIcons[mode]} {modeLabels[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Targets Section */}
          <div
            style={{
              padding: '12px',
              background: 'rgba(0, 150, 255, 0.15)',
              border: '1px solid rgba(0, 150, 255, 0.4)',
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '10px',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              🎯 Targets ({targets.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                      border: isActive ? '2px solid white' : '2px solid transparent',
                      borderRadius: '4px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive
                        ? `0 4px 12px ${color}80`
                        : '0 2px 4px rgba(0,0,0,0.3)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.filter = 'brightness(1.2)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                  >
                    <span>{target.name}</span>
                    {isActive && <span style={{ fontSize: '16px' }}>●</span>}
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
    console.error('UI controls element not found');
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
