import React from "react";
import { CameraMode } from "../../components/camera";
import Paraglider from "../../components/base/flier";
import Vario from "../../audio/vario";
import Weather from "../../elements/weather";
import { GameStartOptions } from "./types";
import { Location } from "../flyzones/locations/index";
export type FirstPersonViewLook = {
    x: number;
    y: number;
};
type UIControlsProps = {
    pg: Paraglider;
    locations: Location[];
    vario: Vario;
    weather: Weather;
    defaultGameSpeed: number;
    defaultCameraMode: CameraMode;
    showDebugInfo: boolean;
    onTurnMouseInputChange: (direction: number) => void;
    onViewUIChange: (direction: FirstPersonViewLook) => void;
    onLeftInput: () => void;
    onLeftInputRelease: () => void;
    onRightInput: () => void;
    onRightInputRelease: () => void;
    onGameStart: (options: GameStartOptions, fnHideStartButton: () => void) => void;
    onSelectCamera: (mode: CameraMode) => void;
    onWrapSpeedChange: (value: number) => void;
    onPause: (paused: boolean) => void;
    onFinishGame: (fnHideButtons: () => void) => void;
};
type UIControlsState = {
    showStartButton: boolean;
    delta: number;
    altitude: number;
    groundSpeed: number;
    heightAboveGround: number;
    speedBarEngaged: boolean;
    earsEngaged: boolean;
    posX: number;
    posY: number;
    posZ: number;
    glidingRatio: number;
    windSpeed: number;
    windDirection: number;
    lclLevel: number;
    flyingTime: number;
    metersFlown: number;
    thermalLift: number;
    dynamicLift: number;
    drop: number;
    gradient: number;
    pausedGame: boolean;
    wrapSpeed: number;
    showHelp: boolean;
    cameraMode: CameraMode;
    groundTouches: number;
};
export declare enum View {
    ZoomIn = "zoomIn",
    ZoomInRelease = "zoomInRelease",
    ZoomOut = "zoomOut",
    ZoomOutRelease = "zoomOutRelease",
    Left = "left",
    LeftRelease = "leftRelease",
    Right = "right",
    RightRelease = "rightRelease"
}
declare class UIControls extends React.Component<UIControlsProps, UIControlsState> {
    constructor(props: any);
    componentDidMount(): void;
    getMouseDirection(e: any, target: any): {
        x: number;
        y: number;
    };
    applyNavigationMouseMove(e: any, target: any, isMouseDown: any): void;
    setUpViewUI(): void;
    onDocumentKeyDown: (event: any) => boolean | void;
    onDocumentKeyUp: (event: any) => void;
    toggleCamMode(): void;
    handleCamMode: (mode: CameraMode) => void;
    handleLeft: () => void;
    handleLeftRelease: () => void;
    handleRight: () => void;
    handleRightRelease: () => void;
    handlePause: () => boolean;
    handleFinishGame: () => void;
    handleStart: (windSpeedMetresPerSecond: number, windDirectionDegreesFromNorth: number, startingLocation: Location) => void;
    handleWrapChange: (newWrap: number) => void;
    toggleHelp: () => void;
    handleBreakUIChange: (direction: number) => void;
    handleViewUIChange: (direction: FirstPersonViewLook) => void;
    render(): React.JSX.Element;
}
export default UIControls;
//# sourceMappingURL=ui-controls.d.ts.map