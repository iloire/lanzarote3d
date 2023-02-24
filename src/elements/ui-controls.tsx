import React from "react";
import { CameraMode } from "./camera";
import Paraglider from "./pg";
import Vario from "../audio/vario";

const KMH_TO_MS = 3.6;

type UIControlsProps = {
  pg: Paraglider;
  vario: Vario;
  onLeftBreak: () => void;
  onLeftBreakRelease: () => void;
  onRightBreak: () => void;
  onRightBreakRelease: () => void;
  onGameStart: (fnHideStartButton: () => void) => void;
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
};

export enum View {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
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
      });
    });
    pg.addEventListener("heightAboveGround", (event) => {
      this.setState({ heightAboveGround: Math.round(event.height) });
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

  handleStart = () => {
    this.props.onGameStart(() => {
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
        <button id="game-start-button" onClick={this.handleStart}>
          START
        </button>
      </div>
    ) : (
      false
    );

    const breakControls = this.state.showStartButton ? (
      false
    ) : (
      <div id="game-controls" className="UIBox">
        <button
          id="game-controls-left"
          onMouseUp={this.handleLeftRelease}
          onMouseDown={this.handleLeft}
        >
          &nbsp; &lt;&nbsp;
        </button>
        <button
          id="game-controls-right"
          onMouseUp={this.handleRightRelease}
          onMouseDown={this.handleRight}
        >
          &nbsp; &gt;&nbsp;
        </button>
      </div>
    );

    const cameraSelection = this.state.showStartButton ? (
      false
    ) : (
      <div id="camera-selection" className="UIBox">
        <button onClick={() => this.handleCamMode(CameraMode.FollowTarget)}>
          f1
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.FollowTarget2)}>
          f2
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.FirstPersonView)}>
          fpv
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.TopView)}>
          top
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.FarAway)}>
          far away
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.AirplaneView)}>
          airplane
        </button>
        <button onClick={() => this.handleCamMode(CameraMode.OrbitControl)}>
          orbit
        </button>
      </div>
    );

    const viewControl = (
      <div id="view-controls" className="UIBox">
        <button onClick={() => this.handleView(View.Left)}>&lt;</button>
        <button onClick={() => this.handleView(View.Right)}>&gt;</button>
      </div>
    );

    const { delta, altitude, groundSpeed, heightAboveGround, speedBarEngaged } =
      this.state;

    const varioInfo = (
      <div id="vario-info" className="UIBox">
        <div id="vario-delta">Δ: {delta} m/s</div>
        <div id="vario-altitude">Alt.: {altitude} m.</div>
        <div id="height-above-ground">
          Alt. above terrain: {heightAboveGround} m.
        </div>
        <div id="vario-ground-speed">Ground speed: {groundSpeed} km/h</div>
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
          defaultValue="1"
          id="wrapSpeed"
          onChange={this.handleWrapChange}
        >
          <option value="1">rookie</option>
          <option value="3">"pro"</option>
          <option value="7">I'm from Lanzarote</option>
          <option value="12">I'm a swiss pilot</option>
        </select>
      </div>
    );

    return (
      <div id="game">
        {breakControls}
        {cameraSelection}
        {paragliderInfo}
        {paragliderPosition}
        {startButton}
        {varioInfo}
        {viewControl}
        {wrapSpeedControl}
      </div>
    );
  }
}

export default UIControls;
