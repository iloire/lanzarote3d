import React from 'react';
import { Location } from '../locations';
import { Vector3 } from 'three';
interface LocationButtonsProps {
    locations: Location[];
    onNavigate: (position: Vector3, location: Location) => void;
}
declare const LocationButtons: React.FC<LocationButtonsProps>;
export default LocationButtons;
//# sourceMappingURL=LocationButtons.d.ts.map