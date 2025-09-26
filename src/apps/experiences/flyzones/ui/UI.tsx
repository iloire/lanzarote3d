import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Location } from '../locations';
import { Vector3 } from 'three';
import LocationButtons from './LocationButtons';
import ToggleButtons from './ToggleButtons';

interface UIProps {
  locations: Location[];
  landingMarkersVisible: boolean;
  onNavigate: (position: Vector3, location: Location) => void;
  onToggleLandings: (visible: boolean) => void;
  onToggleRuler?: () => void;
  showRulerButton?: boolean;
}

const FlyzonesUI: React.FC<UIProps> = ({
  locations,
  landingMarkersVisible,
  onNavigate,
  onToggleLandings,
  onToggleRuler,
  showRulerButton = false,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(true);

  return (
    <div className="points">
      {/* Toggle button - always visible */}
      <button
        onClick={() => setIsMenuVisible(!isMenuVisible)}
        style={{
          marginBottom: '10px',
          background: isMenuVisible ? '#4CAF50' : '#f44336',
          color: 'white',
          fontWeight: 'bold',
        }}
        title={isMenuVisible ? 'Hide Bar' : 'Show Bar'}
      >
        {isMenuVisible ? 'Hide Bar' : 'Show Bar'}
      </button>

      {/* Menu content - conditionally visible */}
      {isMenuVisible && (
        <>
          {/* Flying Zones Section */}
          <div style={{
            marginBottom: '15px',
            padding: '8px',
            background: 'rgba(0, 150, 255, 0.1)',
            border: '1px solid rgba(0, 150, 255, 0.3)',
            borderRadius: '6px'
          }}>
            <div style={{
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              ✈️ Flying Zones
            </div>
            <LocationButtons locations={locations} onNavigate={onNavigate} />
          </div>

          {/* Action Tools Section */}
          <div style={{
            padding: '8px',
            background: 'rgba(255, 150, 0, 0.1)',
            border: '1px solid rgba(255, 150, 0, 0.3)',
            borderRadius: '6px'
          }}>
            <div style={{
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              🛠️ Tools
            </div>
            <ToggleButtons
              landingMarkersVisible={landingMarkersVisible}
              onToggleLandings={onToggleLandings}
              {...(onToggleRuler && { onToggleRuler })}
              showRulerButton={showRulerButton}
            />
          </div>
        </>
      )}
    </div>
  );
};

export const createUI = (props: UIProps) => {
  const rootElement = document.getElementById('legend-points');
  if (!rootElement) {
    console.error('Legend points element not found');
    return;
  }

  const root = createRoot(rootElement);
  root.render(<FlyzonesUI {...props} />);
};
