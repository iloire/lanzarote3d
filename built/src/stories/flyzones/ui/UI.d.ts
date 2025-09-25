import { Location } from '../locations';
import { Vector3 } from 'three';
interface UIProps {
    locations: Location[];
    landingMarkersVisible: boolean;
    onNavigate: (position: Vector3, location: Location) => void;
    onToggleLandings: (visible: boolean) => void;
    onToggleRuler?: () => void;
    showRulerButton?: boolean;
}
export declare const createUI: ({ locations, landingMarkersVisible, onNavigate, onToggleLandings, onToggleRuler, showRulerButton }: UIProps) => void;
export {};
//# sourceMappingURL=UI.d.ts.map