import React from 'react';
import { Location } from '../locations';
import { Vector3 } from 'three';

interface LocationButtonsProps {
  locations: Location[];
  onNavigate: (position: Vector3, location: Location) => void;
}

const LocationButtons: React.FC<LocationButtonsProps> = ({ locations, onNavigate }) => {
  // Define colors for each location for visual distinction
  const locationColors = {
    famara: '#00ff88',
    teguise: '#ff6b6b',
    mala: '#ff9500',
    'playa-quemada': '#9400d3',
  };

  return (
    <>
      {locations.map(location => {
        const color = locationColors[location.id as keyof typeof locationColors] || '#4CAF50';
        return (
          <div key={location.id} style={{ marginBottom: '4px' }}>
            <button
              onClick={() => onNavigate(location.position, location)}
              style={{
                background: color,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: 'bold',
                width: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: `0 2px 4px rgba(0,0,0,0.3)`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 8px rgba(0,0,0,0.4)`;
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 4px rgba(0,0,0,0.3)`;
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              📍 {location.title}
            </button>
          </div>
        );
      })}
    </>
  );
};

export default LocationButtons;
