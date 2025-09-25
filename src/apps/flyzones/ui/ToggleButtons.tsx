import React from 'react';

interface ToggleButtonsProps {
  landingMarkersVisible: boolean;
  onToggleLandings: (visible: boolean) => void;
  onToggleRuler?: () => void;
  showRulerButton?: boolean;
}

const ToggleButtons: React.FC<ToggleButtonsProps> = ({ 
  landingMarkersVisible, 
  onToggleLandings,
  onToggleRuler,
  showRulerButton = false
}) => {
  return (
    <div className="toggle-buttons">
      <button 
        onClick={() => onToggleLandings(!landingMarkersVisible)}
        className={landingMarkersVisible ? "active" : ""}
      >
        {landingMarkersVisible ? "Hide Landings" : "Show Landings"}
      </button>
      
      {showRulerButton && onToggleRuler && (
        <button 
          id="ruler-toggle-btn"
          onClick={onToggleRuler}
          className=""
        >
          Ruler Tool
        </button>
      )}
    </div>
  );
};

export default ToggleButtons; 