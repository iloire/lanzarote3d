import React from "react";
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

const KMH_TO_MS = 3.6;

interface GameStartOptions {
  windSpeedMetresPerSecond: number;
}

type UIControlsProps = {
  pg: Paraglider;
  vario: Vario;
  weather: Weather;
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
};

export enum View {
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
    };
    document.addEventListener("keydown", this.onDocumentKeyDown, false);
    document.addEventListener("keyup", this.onDocumentKeyUp, false);

    const vario = props.vario;
    vario.addEventListener("delta", (event) => {
      this.setState({ delta: Math.round(event.delta * 100) / 100 });
    });
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
      });
    });
    pg.addEventListener("heightAboveGround", (event) => {
      this.setState({ heightAboveGround: Math.round(event.height) });
    });

    const weather = props.weather;
    weather.addEventListener("wind-speedChange", (event) => {
      this.setState({
        windSpeed: Math.round(event.value * KMH_TO_MS * 100) / 100,
      });
      // weatherSpeedUi.innerText =
      //   "wind speed: " + round(event.value * KMH_TO_MS) + " km/h";
    });
    weather.addEventListener("wind-directionChange", (event) => {
      this.setState({ windDirection: Math.round(event.value * 100) / 100 });
      // weatherDirectionUi.innerText =
      //   "wind direction: " + Math.round(event.value) + " degrees";
    });
    weather.addEventListener("lclChange", (event) => {
      this.setState({ lclLevel: Math.round(event.value * 100) / 100 });
      // weatherLCLUi.innerText = "lcl: " + Math.round(event.value) + "m";
    });
  }

  onDocumentKeyDown = (event) => {
    const keyCode = event.which;
    if (keyCode == 65) {
      //a
      this.handleLeft();
    } else if (keyCode == 68) {
      //d
      this.handleRight();
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

  handleStart = (windSpeedMetresPerSecond: number) => {
    const options = {
      windSpeedMetresPerSecond,
    };
    this.props.onGameStart(options, () => {
      this.setState({ showStartButton: false });
    });
  };

  handleView = (view: View) => {
    this.props.onViewChange(view);
  };

  handleWrapChange = (event) => {
    this.props.onWrapSpeedChange(event.target.value);
  };
  render() {
    const startButton = this.state.showStartButton ? (
      <div id="game-start">
        <button id="game-start-normal" onClick={() => this.handleStart(6)}>
          normal wind
        </button>
        <button id="game-start-strong" onClick={() => this.handleStart(9)}>
          strongcito
        </button>
      </div>
    ) : (
      false
    );

    const breakControls = this.state.showStartButton ? (
      false
    ) : (
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
    );

    const cameraSelection = this.state.showStartButton ? (
      false
    ) : (
      <div id="camera-selection">
        <button onClick={() => this.handleCamMode(CameraMode.FollowTarget)}>
          <img src={viewLeftImg} />
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.FollowTarget2)}>
          <img src={viewRightImg} />
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
    );

    const viewControl = this.state.viewControlsVisible ? (
      <div id="view-controls">
        <button
          onMouseDown={() => this.handleView(View.Left)}
          onMouseUp={() => this.handleView(View.LeftRelease)}
        >
          &lt;
        </button>
        <button
          onMouseDown={() => this.handleView(View.Right)}
          onMouseUp={() => this.handleView(View.RightRelease)}
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
    } = this.state;

    const varioInfo = (
      <div id="vario-info" className="UIBox">
        <div id="vario-delta">Δ: {delta} m/s</div>
        <div id="vario-altitude">Alt.: {altitude} m.</div>
        <div id="height-above-ground">
          Alt. above terrain: {heightAboveGround} m.
        </div>
        <div id="vario-ground-speed">Ground speed: {groundSpeed} km/h</div>
        <div id="pg-gliding-ratio">Gliding ratio: {glidingRatio}</div>
        <div id="pg-flying-time">Flying time: {flyingTime} min.</div>
      </div>
    );
    const speedBarText = speedBarEngaged ? "SPEED-BAR" : "";
    const paragliderInfo = (
      <div id="paraglider-info" className="UIBox">
        <div id="paraglider-speedBar">{speedBarText}</div>
        <div id="paraglider-ears" className="ears"></div>
      </div>
    );

    const { posX, posY, posZ } = this.state;
    const paragliderPosition = (
      <div id="paraglider-position" className="UIBox">
        <div id="paraglider-x">x: {posX}</div>
        <div id="paraglider-y">y: {posY}</div>
        <div id="paraglider-z">z: {posZ}</div>
      </div>
    );
    const wrapSpeedControl = this.state.showStartButton ? (
      false
    ) : (
      <div id="wrapSpeed-controls" className="UIBox">
        skill:
        <select
          defaultValue="7"
          id="wrapSpeed"
          onChange={this.handleWrapChange}
        >
          <option value="1">rookie</option>
          <option value="3">"pro"</option>
          <option value="7">I'm from Lanzarote</option>
          <option value="12">I'm a swiss pilot</option>
          <option value="52">turbo</option>
        </select>
      </div>
    );

    const instructions = this.state.showStartButton ? (
      <div id="instructions">
        <p>A: turn left</p>
        <p>D: turn right</p>
        <p>S: speedbar</p>
        <p>E: ears (WIP)</p>
      </div>
    ) : (
      false
    );

    return (
      <div id="game">
        {breakControls}
        {cameraSelection}
        {instructions}
        {paragliderInfo}
        {paragliderPosition}
        {startButton}
        {varioInfo}
        {viewControl}
        {weatherInfo}
        {wrapSpeedControl}
      </div>
    );
  }
}

export default UIControls;
