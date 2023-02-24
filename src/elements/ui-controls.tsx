import React from "react";
import { CameraMode } from "./camera";

type UIControlsProps = {
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
    };
    document.addEventListener("keydown", this.onDocumentKeyDown, false);
    document.addEventListener("keyup", this.onDocumentKeyUp, false);
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
      <div id="game-controls">
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
      <div id="camera-selection">
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
      </div>
    );

    const viewControl = (
      <div id="view-controls">
        <button onClick={() => this.handleView(View.Left)}>&lt;</button>
        <button onClick={() => this.handleView(View.Right)}>&gt;</button>
      </div>
    );

    const wrapSpeedControl = this.state.showStartButton ? (
      false
    ) : (
      <div id="wrapSpeed-controls">
        skill:
        <select
          defaultValue="1"
          id="wrapSpeed"
          onChange={this.handleWrapChange}
        >
          <option value="1">rookie</option>
          <option value="5">"pro"</option>
          <option value="10">I'm from Lanzarote</option>
          <option value="15">I'm a swiss pilot</option>
        </select>
      </div>
    );

    return (
      <div id="game">
        {breakControls}
        {startButton}
        {cameraSelection}
        {startButton} {viewControl}
        {cameraSelection}
        {viewControl}
        {wrapSpeedControl}
      </div>
    );
  }
}

export default UIControls;
