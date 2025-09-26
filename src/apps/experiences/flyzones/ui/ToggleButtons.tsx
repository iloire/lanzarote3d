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
  showRulerButton = false,
}) => {
  const buttonStyle = (isActive: boolean = false) => ({
    background: isActive ? '#ff9500' : '#666',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 'bold',
    width: '100%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    marginBottom: '4px'
  });

  return (
    <div className="toggle-buttons">
      <button
        onClick={() => onToggleLandings(!landingMarkersVisible)}
        style={buttonStyle(landingMarkersVisible)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          e.currentTarget.style.filter = 'brightness(1)';
        }}
      >
        🎯 {landingMarkersVisible ? 'Hide Landings' : 'Show Landings'}
      </button>

      {showRulerButton && onToggleRuler && (
        <button
          id="ruler-toggle-btn"
          onClick={onToggleRuler}
          style={buttonStyle(false)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
            e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          📏 Ruler Tool
        </button>
      )}
    </div>
  );
};

export default ToggleButtons;
