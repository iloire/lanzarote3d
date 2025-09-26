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
  showRulerButton = false
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
          fontWeight: 'bold'
        }}
        title={isMenuVisible ? 'Hide Menu' : 'Show Menu'}
      >
        {isMenuVisible ? 'Hide' : 'Show'} Menu
      </button>

      {/* Menu content - conditionally visible */}
      {isMenuVisible && (
        <>
          <LocationButtons
            locations={locations}
            onNavigate={onNavigate}
          />
          <ToggleButtons
            landingMarkersVisible={landingMarkersVisible}
            onToggleLandings={onToggleLandings}
            {...(onToggleRuler && { onToggleRuler })}
            showRulerButton={showRulerButton}
          />
        </>
      )}
    </div>
  );
};

export const createUI = (props: UIProps) => {
  const rootElement = document.getElementById("legend-points");
  if (!rootElement) {
    console.error("Legend points element not found");
    return;
  }

  const root = createRoot(rootElement);
  root.render(<FlyzonesUI {...props} />);
}; 