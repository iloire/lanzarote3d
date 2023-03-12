import React from "react";
import * as THREE from "three";
import { CameraMode } from "./camera";
import Paraglider from "./pg";
import Vario from "../audio/vario";
import Weather from "../elements/weather";
import airplaneImg from "../img/airplane.png";
import mountainImg from "../img/mountain.png";
import mapImg from "../img/map.png";
import glidingImg from "../img/gliding.png";
import viewLeftImg from "../img/eye-left.png";
import viewRightImg from "../img/eye-right.png";
import arrowLeftImg from "../img/left-chevron.png";
import arrowRightImg from "../img/right-chevron.png";
import { GameStartOptions } from "../stories/game/types";
import { Location } from "../stories/locations/index";

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
  onBreakUIChange: (direction: number) => void;
  onViewUIChange: (direction: FirstPersonViewLook) => void;
  onLeftBreak: () => void;
  onLeftBreakRelease: () => void;
  onRightBreak: () => void;
  onRightBreakRelease: () => void;
  onGameStart: (
    options: GameStartOptions,
    fnHideStartButton: () => void
  ) => void;
  onSelectCamera: (mode: CameraMode) => void;
  onViewChange: (view: View) => void;
  onWrapSpeedChange: (value: number) => void;
  onPause: (paused: boolean) => void;
};

type UIControlsState = {
  showStartButton: boolean;
  delta: number;
  altitude: number;
  groundSpeed: number;
  heightAboveGround: number;
  speedBarEngaged: boolean;
  posX: number;
  posY: number;
  posZ: number;
  viewControlsVisible: boolean;
  glidingRatio: number;
  windSpeed: number;
  windDirection: number;
  lclLevel: number;
  flyingTime: number;
  metersFlown: number;
  thermalLift: number;
  dynamicLift: number;
  drop: number;
  rollDrop: number;
  gradient: number;
  pausedGame: boolean;
  wrapSpeed: number;
  showHelp: boolean;
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
      posX: 0,
      posY: 0,
      posZ: 0,
      viewControlsVisible: true,
      glidingRatio: 0,
      windSpeed: 0,
      windDirection: 0,
      lclLevel: 0,
      flyingTime: 0,
      metersFlown: 0,
      thermalLift: 0,
      dynamicLift: 0,
      drop: 0,
      rollDrop: 0,
      gradient: 0,
      pausedGame: false,
      wrapSpeed: props.defaultGameSpeed,
      showHelp: false,
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
    pg.addEventListener("rollDrop", (event) => {
      this.setState({ rollDrop: (-1 * Math.round(event.drop * 100)) / 100 });
    });
    pg.addEventListener("delta", (event) => {
      this.setState({ delta: Math.round(event.delta * 100) / 100 });
    });
    pg.addEventListener("gradient", (event) => {
      this.setState({ gradient: Math.round(event.gradient * 100) / 100 });
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

  applyViewMouseMove(e, target, isMouseDown) {
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left; //x position within the element.
    const y = e.clientY - rect.top; //y position within the element.
    const percentageX = x / rect.width;
    const percentageY = y / rect.height;
    const directionX = (percentageX - 0.5) * 100;
    const directionY = (percentageY - 0.5) * 100;
    this.handleViewUIChange({ x: directionX, y: directionY });
    if (isMouseDown) {
      this.handleBreakUIChange(directionX);
    }
  }

  setUpViewUI() {
    let mouseDown = false;
    const viewUIelement = document.getElementById("root");
    viewUIelement.onmousemove = (e: any) => {
      this.applyViewMouseMove(e, e.target, mouseDown);
    };
    viewUIelement.onmousedown = (e: any) => {
      mouseDown = true;
      this.applyViewMouseMove(e, e.target, mouseDown);
    };
    viewUIelement.onmouseup = (e: any) => {
      mouseDown = false;
      this.handleBreakUIChange(0);
    };
  }

  onDocumentKeyDown = (event) => {
    const keyCode = event.which;
    console.log(keyCode);
    if (keyCode === 49) {
      //1
      this.handleWrapChange(1);
    } else if (keyCode === 50) {
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
    } else if (keyCode === 65) {
      //a
      return this.handleLeft();
    } else if (keyCode === 68) {
      //d
      return this.handleRight();
    } else if (keyCode === 80) {
      //p
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
    const { viewControlsVisible } = this.state;
    if (!isGameStarted) {
      return;
    }

    if (viewControlsVisible) {
      this.handleCamMode(CameraMode.FirstPersonView);
    } else {
      this.handleCamMode(CameraMode.FollowTargetBehind);
    }
  }

  handleCamMode = (mode: CameraMode) => {
    if (mode === CameraMode.FirstPersonView) {
      this.setState({ viewControlsVisible: false });
    } else {
      this.setState({ viewControlsVisible: true });
    }
    this.props.onSelectCamera(mode);
  };

  handleLeft = () => {
    this.props.onLeftBreak();
  };

  handleLeftRelease = () => {
    this.props.onLeftBreakRelease();
  };

  handleRight = () => {
    this.props.onRightBreak();
  };

  handleRightRelease = () => {
    this.props.onRightBreakRelease();
  };

  handlePause = () => {
    this.setState({ pausedGame: !this.state.pausedGame }, () => {
      this.props.onPause(this.state.pausedGame);
    });
    return false;
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

  handleView = (view: View) => {
    this.props.onViewChange(view);
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
    this.props.onBreakUIChange(direction);
  };

  handleViewUIChange = (direction: FirstPersonViewLook) => {
    this.props.onViewUIChange(direction);
  };

  render() {
    const isGameStarted = !this.state.showStartButton;
    const buttons = this.props.locations.map((location) => (
      <button
        key={location.title}
        onClick={() =>
          this.handleStart(
            6,
            location.idealWindDirectionDegreesFromNorth,
            location
          )
        }
      >
        {location.title}
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

    const cameraSelection = isGameStarted ? (
      <div id="camera-selection">
        <button onClick={() => this.handleCamMode(CameraMode.FollowTarget)}>
          <img src={viewLeftImg} />
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.FirstPersonView)}>
          <img src={glidingImg} />
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.TopView)}>
          <img src={mapImg} />
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.FarAway)}>
          <img src={mountainImg} />
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.AirplaneView)}>
          <img src={airplaneImg} />
        </button>
        <button
          style={{ display: "none" }}
          onClick={() => this.handleCamMode(CameraMode.OrbitControl)}
        >
          orbit
        </button>
      </div>
    ) : (
      false
    );

    const viewControl =
      isGameStarted && this.state.viewControlsVisible ? (
        <div id="view-controls">
          <button
            onMouseDown={() => this.handleView(View.ZoomIn)}
            onMouseUp={() => this.handleView(View.ZoomInRelease)}
            onMouseLeave={() => this.handleView(View.ZoomInRelease)}
          >
            in
          </button>
          <button
            onMouseDown={() => this.handleView(View.ZoomOut)}
            onMouseUp={() => this.handleView(View.ZoomOutRelease)}
            onMouseLeave={() => this.handleView(View.ZoomOutRelease)}
          >
            out
          </button>
          <button
            onMouseDown={() => this.handleView(View.Left)}
            onMouseUp={() => this.handleView(View.LeftRelease)}
            onMouseLeave={() => this.handleView(View.LeftRelease)}
          >
            &lt;
          </button>
          <button
            onMouseDown={() => this.handleView(View.Right)}
            onMouseUp={() => this.handleView(View.RightRelease)}
            onMouseLeave={() => this.handleView(View.RightRelease)}
          >
            &gt;
          </button>
        </div>
      ) : (
        false
      );

    const { lclLevel, windSpeed, windDirection } = this.state;

    const weatherInfo = (
      <div id="weather-info" className="UIBox">
        <div id="weather-direction">Wind direction: {windDirection}</div>
        <div id="weather-speed">Wind speed: {windSpeed} km/h</div>
        <div id="weather-lclLevel">LCL: {lclLevel} m.</div>
      </div>
    );

    const {
      delta,
      altitude,
      groundSpeed,
      heightAboveGround,
      speedBarEngaged,
      glidingRatio,
      flyingTime,
      metersFlown,
      thermalLift,
      dynamicLift,
      drop,
      rollDrop,
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
        <div id="vario-delta">Δ: {delta} m/s</div>
        <div id="vario-altitude">Alt.: {altitude} m.</div>
        <div id="height-above-ground">
          Alt. above terrain: {heightAboveGround} m.
        </div>
        <div id="vario-ground-speed">Ground speed: {groundSpeed} km/h</div>
        <div id="pg-flying-time">Flight time: {flyingTime} min.</div>
        <div id="pg-meters-flown">Flight distance: {distanceFlown}</div>
        <div id="pg-gliding-ratio">Gliding ratio: {glidingRatio}</div>
        {showDebugInfo && (
          <div id="pg-thermal-lift">Thermal lift : {thermalLift} m/s</div>
        )}
        {showDebugInfo && (
          <div id="pg-dynamic-lift">Soaring lift : {dynamicLift} m/s</div>
        )}
        {showDebugInfo && <div id="pg-drop">PG sink rate : {drop} m/s</div>}
        {showDebugInfo && (
          <div id="pg-drop">Roll sink rate : {rollDrop} m/s</div>
        )}
        {showDebugInfo && (
          <div id="pg-gradient">Terrain gradient : {gradient}</div>
        )}
      </div>
    ) : (
      false
    );
    const speedBarText = speedBarEngaged ? "SPEED-BAR" : "";
    const paragliderInfo = isGameStarted ? (
      <div id="paraglider-info" className="UIBox">
        <div id="paraglider-speedBar">{speedBarText}</div>
        <div id="paraglider-ears" className="ears"></div>
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
        {cameraSelection}
        {helpUI}
        {paragliderInfo}
        {paragliderPosition}
        {startButton}
        {varioInfo}
        {viewControl}
        {weatherInfo}
        {wrapSpeedValueUI}
        {pauseControls}
        {breakControlUI}
      </div>
    );
  }
}

export default UIControls;
