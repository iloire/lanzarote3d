import React from "react";
import * as THREE from "three";
import { CameraMode } from "../../components/camera";
import Paraglider from "../../components/base/flier";
import Vario from "../../audio/vario";
import Weather from "../../elements/weather";
import arrowLeftImg from "../../img/left-chevron.png";
import arrowRightImg from "../../img/right-chevron.png";
import { GameStartOptions } from "./types";
import { Location } from "../../stories/locations/index";

const KMH_TO_MS = 3.6;

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
  onGameStart: (
    options: GameStartOptions,
    fnHideStartButton: () => void
  ) => void;
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

export enum View {
  ZoomIn = "zoomIn",
  ZoomInRelease = "zoomInRelease",
  ZoomOut = "zoomOut",
  ZoomOutRelease = "zoomOutRelease",
  Left = "left",
  LeftRelease = "leftRelease",
  Right = "right",
  RightRelease = "rightRelease",
}

class UIControls extends React.Component<UIControlsProps, UIControlsState> {
  constructor(props) {
    super(props);
    this.state = {
      showStartButton: true,
      delta: 0,
      altitude: 0,
      groundSpeed: 0,
      heightAboveGround: 0,
      speedBarEngaged: false,
      earsEngaged: false,
      posX: 0,
      posY: 0,
      posZ: 0,
      glidingRatio: 0,
      windSpeed: 0,
      windDirection: 0,
      lclLevel: 0,
      flyingTime: 0,
      metersFlown: 0,
      thermalLift: 0,
      dynamicLift: 0,
      drop: 0,
      gradient: 0,
      pausedGame: false,
      wrapSpeed: props.defaultGameSpeed,
      showHelp: false,
      cameraMode: props.defaultCameraMode,
      groundTouches: 0,
    };
    document.addEventListener("keydown", this.onDocumentKeyDown, false);
    document.addEventListener("keyup", this.onDocumentKeyUp, false);

    const vario = props.vario;
    vario.addEventListener("altitude", (event) => {
      this.setState({ altitude: Math.round(event.altitude) });
    });

    const pg = props.pg;
    pg.addEventListener("position", (event) => {
      const pos = pg.position();
      this.setState({
        groundSpeed: Math.round(pg.getGroundSpeed() * KMH_TO_MS * 100) / 100,
        speedBarEngaged: pg.isOnSpeedBar(),
        earsEngaged: pg.isOnEars(),
        posX: Math.round(pos.x),
        posY: Math.round(pos.y),
        posZ: Math.round(pos.z),
        glidingRatio: Math.round(pg.glidingRatio() * 100) / 100,
        flyingTime: Math.round((pg.getFlyingTime() * 100) / 60) / 100,
        metersFlown: Math.round(pg.getMetersFlown() * 100) / 100,
      });
    });
    pg.addEventListener("heightAboveGround", (event) => {
      this.setState({ heightAboveGround: Math.round(event.height) });
    });
    pg.addEventListener("thermalLift", (event) => {
      this.setState({ thermalLift: Math.round(event.lift * 100) / 100 });
    });
    pg.addEventListener("dynamicLift", (event) => {
      this.setState({ dynamicLift: Math.round(event.lift * 100) / 100 });
    });
    pg.addEventListener("drop", (event) => {
      this.setState({ drop: (-1 * Math.round(event.drop * 100)) / 100 });
    });
    pg.addEventListener("delta", (event) => {
      this.setState({ delta: Math.round(event.delta * 100) / 100 });
    });
    pg.addEventListener("gradient", (event) => {
      this.setState({ gradient: Math.round(event.gradient * 100) / 100 });
    });
    pg.addEventListener("touchedGround", (event) => {
      this.setState({ groundTouches: event.groundTouches });
    });

    const weather = props.weather;
    weather.addEventListener("wind-speedChange", (event) => {
      this.setState({
        windSpeed: Math.round(event.value * KMH_TO_MS * 100) / 100,
      });
    });
    weather.addEventListener("wind-directionChange", (event) => {
      this.setState({ windDirection: Math.round(event.value * 100) / 100 });
    });
    weather.addEventListener("lclChange", (event) => {
      this.setState({ lclLevel: Math.round(event.value * 100) / 100 });
    });
  }

  componentDidMount() {
    this.props.onWrapSpeedChange(this.props.defaultGameSpeed);
    this.setUpViewUI();
  }


  getMouseDirection(e, target) {
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left; //x position within the element.
    const y = e.clientY - rect.top; //y position within the element.
    const percentageX = x / rect.width;
    const percentageY = y / rect.height;
    const directionX = (percentageX - 0.5) * 100;
    const directionY = (percentageY - 0.5) * 100;
    return { x: directionX, y: directionY };
  }


  applyNavigationMouseMove(e, target, isMouseDown) {
    const direction = this.getMouseDirection(e, target);
    this.handleViewUIChange(direction);
    if (isMouseDown) {
      this.handleBreakUIChange(direction.x);
    }
  }

  setUpViewUI() {
    let mouseDown = false;
    const viewUIelement = document.getElementById("root");
    viewUIelement.onmousemove = (e: any) => {
      this.applyNavigationMouseMove(e, e.target, mouseDown);
    };
    viewUIelement.onmousedown = (e: any) => {
      if (e.button == 0) {
        mouseDown = true;
        this.applyNavigationMouseMove(e, e.target, mouseDown);
      }
    };
    viewUIelement.onmouseup = (e: any) => {
      if (e.button == 0) {
        mouseDown = false;
        this.handleBreakUIChange(0);
      }
    };
  }

  onDocumentKeyDown = (event) => {
    const keyCode = event.which;
    if (keyCode === 50) {
      //2
      this.handleWrapChange(2);
    } else if (keyCode === 51) {
      //3
      this.handleWrapChange(3);
    } else if (keyCode === 52) {
      //4
      this.handleWrapChange(5);
    } else if (keyCode === 53) {
      //5
      this.handleWrapChange(7);
    } else if (keyCode === 54) {
      //6
      this.handleWrapChange(9);
    } else if (keyCode === 55) {
      //7
      this.handleWrapChange(15);
    } else if (keyCode === 56) {
      //8
      this.handleWrapChange(20);
    } else if (keyCode === 57) {
      //9
      this.handleWrapChange(50);
    } else if (keyCode === 48) {
      //0
      this.handleWrapChange(100);
    } else if (keyCode === 65) {
      //a
      return this.handleLeft();
    } else if (keyCode === 68) {
      //d
      return this.handleRight();
    } else if (keyCode === 80 || keyCode === 32 || keyCode === 27) {
      //p, space, ESC
      return this.handlePause();
    } else if (keyCode === 72) {
      //h
      return this.toggleHelp();
    } else if (keyCode === 67) {
      this.toggleCamMode();
    }
  };

  onDocumentKeyUp = (event) => {
    const keyCode = event.which;
    if (keyCode == 65) {
      //a
      this.handleLeftRelease();
    } else if (keyCode == 68) {
      //d
      this.handleRightRelease();
    }
  };

  toggleCamMode() {
    const isGameStarted = !this.state.showStartButton;
    const { cameraMode } = this.state;
    if (!isGameStarted) {
      return;
    }
    const numberCameraModes = Object.keys(CameraMode).length / 2;
    const nextMode = cameraMode < numberCameraModes - 1 ? cameraMode + 1 : 1;
    this.setState({ cameraMode: nextMode }, () => {
      this.handleCamMode(CameraMode[CameraMode[nextMode]]);
    });
  }

  handleCamMode = (mode: CameraMode) => {
    console.log("CAMERA:", mode);
    this.props.onSelectCamera(mode);
  };

  handleLeft = () => {
    this.props.onLeftInput();
  };

  handleLeftRelease = () => {
    this.props.onLeftInputRelease();
  };

  handleRight = () => {
    this.props.onRightInput();
  };

  handleRightRelease = () => {
    this.props.onRightInputRelease();
  };

  handlePause = () => {
    this.setState({ pausedGame: !this.state.pausedGame }, () => {
      this.props.onPause(this.state.pausedGame);
    });
    return false;
  };

  handleFinishGame = () => {
    this.props.onFinishGame(() => {
      this.setState({ pausedGame: false });
    });
  };

  handleStart = (
    windSpeedMetresPerSecond: number,
    windDirectionDegreesFromNorth: number,
    startingLocation: Location
  ) => {
    this.handleCamMode(this.props.defaultCameraMode);
    const options: GameStartOptions = {
      startingLocation,
      windSpeedMetresPerSecond,
      windDirectionDegreesFromNorth,
    };
    this.props.onGameStart(options, () => {
      this.setState({ showStartButton: false });
    });
  };

  handleWrapChange = (newWrap: number) => {
    this.setState({ wrapSpeed: newWrap }, () => {
      this.props.onWrapSpeedChange(newWrap);
    });
  };

  toggleHelp = () => {
    this.setState({ showHelp: !this.state.showHelp });
  };

  handleBreakUIChange = (direction: number) => {
    this.props.onTurnMouseInputChange(direction);
  };

  handleViewUIChange = (direction: FirstPersonViewLook) => {
    this.props.onViewUIChange(direction);
  };

  render() {
    const availableForPlaying = (location) => location.availableForPlaying;
    const isGameStarted = !this.state.showStartButton;
    const buttons = this.props.locations
      .filter(availableForPlaying)
      .map((location) => (
        <button
          key={location.title}
          onClick={() =>
            this.handleStart(
              6,
              200, //hard coded temporal
              location
            )
          }
        >
          FLY "{location.title}"
        </button>
      ));
    const startButton = !isGameStarted ? (
      <div id="game-start">{buttons}</div>
    ) : (
      false
    );

    const breakControls = isGameStarted ? (
      <div id="game-controls">
        <button
          id="game-controls-left"
          onMouseUp={this.handleLeftRelease}
          onMouseDown={this.handleLeft}
        >
          <img src={arrowLeftImg} />
        </button>
        <button
          id="game-controls-right"
          onMouseUp={this.handleRightRelease}
          onMouseDown={this.handleRight}
        >
          <img src={arrowRightImg} />
        </button>
      </div>
    ) : (
      false
    );

    const { lclLevel, windSpeed, windDirection, groundTouches } = this.state;

    const weatherInfo = (
      <div id="weather-info" className="UIBox">
        <div id="weather-direction">Wind direction: {windDirection}</div>
        <div id="weather-speed">
          Wind speed:{" "}
          {windSpeed > 30 ? (
            <span style={{ color: "red", fontWeight: "bold" }}>
              {windSpeed}
            </span>
          ) : (
            windSpeed
          )}{" "}
          km/h
        </div>
        <div id="weather-lclLevel">LCL: {lclLevel} m.</div>
      </div>
    );

    const groundTouchesUI = groundTouches ? (
      <div id="ground-touches" className="UIBox">
        <span>{groundTouches}</span>
      </div>
    ) : (
      false
    );

    const {
      delta,
      altitude,
      groundSpeed,
      heightAboveGround,
      speedBarEngaged,
      earsEngaged,
      glidingRatio,
      flyingTime,
      metersFlown,
      thermalLift,
      dynamicLift,
      drop,
      gradient,
      wrapSpeed,
      pausedGame,
      posX,
      posY,
      posZ,
      showHelp,
    } = this.state;

    const { showDebugInfo, defaultGameSpeed } = this.props;
    const distanceFlown =
      metersFlown < 1000
        ? Math.round(metersFlown) + " m."
        : Math.round((metersFlown * 100) / 1000) / 100 + " km.";

    const varioInfo = isGameStarted ? (
      <div id="vario-info" className="UIBox">
        <div id="vario-delta"><span className="prefix">Δ:</span> {delta} <span className="sufix">m/s</span></div>
        <div id="vario-altitude"><span className="prefix">Alt.:</span> {altitude} m.</div>
        <div id="height-above-ground">
          <span className="prefix">Alt. above terrain:</span> {heightAboveGround} m.
        </div>
        <div id="vario-ground-speed"><span className="prefix">Ground speed:</span> {groundSpeed} <span className="prefix">km/h</span></div>
        <div id="pg-flying-time"><span className="prefix">Flight time:</span> {flyingTime} <span className="prefix">min.</span></div>
        <div id="pg-meters-flown"><span className="prefix">Flight distance:</span> {distanceFlown}</div>
        <div id="pg-gliding-ratio"><span className="prefix">Gliding ratio:</span> {glidingRatio}</div>
        {showDebugInfo && (
          <div id="pg-thermal-lift"><span className="prefix">Thermal lift :</span> {thermalLift} <span className="prefix">m/s</span></div>
        )}
        {showDebugInfo && (
          <div id="pg-dynamic-lift"><span className="prefix">Soaring lift :</span> {dynamicLift} <span className="prefix">m/s</span></div>
        )}
        {showDebugInfo && <div id="pg-drop"><span className="prefix">PG sink rate :</span> {drop} <span className="prefix">m/s</span></div>}
        {showDebugInfo && (
          <div id="pg-gradient"><span className="prefix">Terrain gradient :</span> {gradient}</div>
        )}
      </div>
    ) : (
      false
    );
    const speedBarText = speedBarEngaged ? "SPEED-BAR" : "";
    const earsText = earsEngaged ? "EARS" : "";
    const paragliderInfo = isGameStarted ? (
      <div id="paraglider-info" className="UIBox">
        <div id="paraglider-speedBar">{speedBarText}</div>
        <div id="paraglider-ears" className="ears">
          {earsText}
        </div>
      </div>
    ) : (
      false
    );

    const paragliderPosition = isGameStarted ? (
      <div id="paraglider-position" className="UIBox">
        <div id="paraglider-x">x: {posX}</div>
        <div id="paraglider-y">y: {posY}</div>
        <div id="paraglider-z">z: {posZ}</div>
      </div>
    ) : (
      false
    );

    const title = !isGameStarted ? (
      <div id="title">
        <h2>Paragliding simulator</h2>
      </div>
    ) : (
      false
    );

    const helpUI =
      !isGameStarted || showHelp ? (
        <div id="instructions">
          <h3>Help</h3>
          <div>
            <span>A</span>: turn left
          </div>
          <div>
            <span>D</span>: turn right
          </div>
          <div>
            <span>S</span>: speedbar
          </div>
          <div>
            <span>p</span>: pause
          </div>
          <div>
            <span>m</span>: toggle sound
          </div>
          <div>
            <span>h</span>: toggle Help menu
          </div>
          <div>
            <span>c</span>: toggle camera view
          </div>
          <div>
            <span>1-8</span>: game wrap speed
          </div>
          <div>
            <br />
            Tips: pick some thermals to get to cloud base and/or go soaring over
            the cliff. Stay close to the hill but don't crash!! Also keep an eye
            on wind direction and strenght, it may change without any warning!
          </div>
        </div>
      ) : (
        false
      );

    const pauseControls = pausedGame ? (
      <div id="game-pause">
        <button id="game-pause-button" onClick={this.handlePause}>
          PAUSE
        </button>
        <button id="game-end-button" onClick={this.handleFinishGame}>
          END
        </button>
      </div>
    ) : (
      false
    );

    const breakControlUI = (
      <div id="break-ui" style={{ display: isGameStarted ? "" : "none" }}>
        <div>&nbsp;</div>
      </div>
    );

    const wrapSpeedValueUI = <div id="wrapSpeed-ui">x{wrapSpeed}</div>;

    return (
      <div id="game">
        {title}
        {breakControls}
        {helpUI}
        {paragliderInfo}
        {paragliderPosition}
        {startButton}
        {varioInfo}
        {weatherInfo}
        {wrapSpeedValueUI}
        {pauseControls}
        {breakControlUI}
        {groundTouchesUI}
      </div>
    );
  }
}

export default UIControls;
