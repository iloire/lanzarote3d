import React from 'react';
import { Location } from '../locations';
import { Vector3 } from 'three';

interface LocationButtonsProps {
  locations: Location[];
  onNavigate: (position: Vector3, location: Location) => void;
}

const LocationButtons: React.FC<LocationButtonsProps> = ({ locations, onNavigate }) => {
  return (
    <>
      {locations.map(location => (
        <div key={location.id}>
          <button onClick={() => onNavigate(location.position, location)}>
            {location.title}
          </button>
        </div>
      ))}
    </>
  );
};

export default LocationButtons; 