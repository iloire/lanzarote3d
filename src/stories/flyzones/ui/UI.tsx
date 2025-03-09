import React from 'react';
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

export const createUI = ({
  locations,
  landingMarkersVisible,
  onNavigate,
  onToggleLandings,
  onToggleRuler,
  showRulerButton = false
}: UIProps) => {
  const rootElement = document.getElementById("legend-points");
  if (!rootElement) {
    console.error("Legend points element not found");
    return;
  }

  const root = createRoot(rootElement);
  
  root.render(
    <div className="points">
      <LocationButtons 
        locations={locations} 
        onNavigate={onNavigate} 
      />
      <ToggleButtons 
        landingMarkersVisible={landingMarkersVisible}
        onToggleLandings={onToggleLandings}
        onToggleRuler={onToggleRuler}
        showRulerButton={showRulerButton}
      />
    </div>
  );
}; 