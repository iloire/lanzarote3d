import React from "react";

type UIControlsProps = {
  onLeftBreak: () => void;
  onLeftBreakRelease: () => void;
  onRightBreak: () => void;
  onRightBreakRelease: () => void;
  onGameStart: (fnHideStartButton: () => void) => void;
  onSelectCamera: (num: number) => void;
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
  handleCamSelection = (cam: number) => {
    this.props.onSelectCamera(cam);
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
          LEFT
        </button>
        <button
          id="game-controls-right"
          onMouseUp={this.handleRightRelease}
          onMouseDown={this.handleRight}
        >
          RIGHT
        </button>
      </div>
    );

    const cameraSelection = this.state.showStartButton ? (
      false
    ) : (
      <div id="camera-selection">
        <button onClick={() => this.handleCamSelection(1)}>f1</button>
        <button onClick={() => this.handleCamSelection(2)}>f2</button>
        <button onClick={() => this.handleCamSelection(3)}>fpv</button>
        <button onClick={() => this.handleCamSelection(4)}>far</button>
        <button onClick={() => this.handleCamSelection(5)}>top</button>
        <button onClick={() => this.handleCamSelection(6)}>orbit</button>
      </div>
    );

    const viewControl = (
      <div id="view-controls">
        <button onClick={() => this.handleView(View.Left)}>l</button>
        <button onClick={() => this.handleView(View.Right)}>r</button>
        <button onClick={() => this.handleView(View.Up)}>up</button>
        <button onClick={() => this.handleView(View.Down)}>down</button>
      </div>
    );

    const wrapSpeedControl = this.state.showStartButton ? (
      false
    ) : (
      <div id="wrapSpeed-controls">
        wrap speed:
        <select
          defaultValue="1"
          id="wrapSpeed"
          onChange={this.handleWrapChange}
        >
          <option value="0.5">half speed</option>
          <option value="1">normal</option>
          <option value="5">fast</option>
          <option value="10">very fast</option>
          <option value="15">I'm from Lanzarote</option>
          <option value="20">I'm a swiss pilot</option>
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
