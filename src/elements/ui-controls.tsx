import React from "react";

type UIControlsProps = {
  onLeftBreak: () => void;
  onLeftBreakRelease: () => void;
  onRightBreak: () => void;
  onRightBreakRelease: () => void;
  onGameStart: (fnHideStartButton: () => void) => void;
  onSelectCamera: (num: number) => void;
};

type UIControlsState = {
  showStartButton: boolean;
};

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

    const cameraSelection = (
      <div id="camera-selection">
        <button onClick={() => this.handleCamSelection(1)}>1</button>
        <button onClick={() => this.handleCamSelection(2)}>2</button>
        <button onClick={() => this.handleCamSelection(3)}>3</button>
        <button onClick={() => this.handleCamSelection(4)}>top</button>
      </div>
    );

    return (
      <div id="game">
        {breakControls}
        {startButton}
        {cameraSelection}

        <div id="vario-info">
          <div id="vario-delta" className="delta"></div>
          <div id="vario-altitude" className="altitude"></div>
          <div id="vario-ground-speed" className="ground-speed"></div>
        </div>

        <div id="weather-info">
          <div id="weather-direction" className=""></div>
          <div id="weather-speed" className=""></div>
        </div>

        <div id="paraglider-info">
          <div id="paraglider-speedBar" className="speedBar"></div>
          <div id="paraglider-ears" className="ears"></div>
        </div>

        <div className="points" style={{ display: "none" }}>
          <div className="point point-0">
            <div className="label label-0">Famara/Teguise</div>
            <div className="text">Famara</div>
          </div>
          <div className="point point-1">
            <div className="label label-1">Mirador/Orzola</div>
            <div className="text"></div>
          </div>
          <div className="point point-2">
            <div className="label label-2">Macher/Asomada</div>
            <div className="text"></div>
          </div>
          <div className="point point-3">
            <div className="label label-3">Tenesar</div>
            <div className="text">4</div>
          </div>
        </div>
      </div>
    );
  }
}

export default UIControls;
