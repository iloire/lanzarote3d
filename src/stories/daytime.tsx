import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import Helpers from "../utils/helpers";
import React from "react";
import { createRoot } from "react-dom/client";

type Props = {
  onChange: (time) => void;
};

type State = {
  time: number;
};

class TimeControl extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
    };
  }
  onIncrease() {
    if (this.state.time > 23) {
      return;
    }
    this.setState({ time: this.state.time + 1 }, () => {
      this.props.onChange(this.state.time);
    });
  }

  onDecrase() {
    if (this.state.time < 1) {
      return;
    }
    this.setState({ time: this.state.time - 1 }, () => {
      this.props.onChange(this.state.time);
    });
  }

  render() {
    return (
      <div>
        <span id="time"></span>
        <button onClick={(event) => this.onDecrase()}>minus</button>
        <button onClick={(event) => this.onIncrease()}>more</button>
      </div>
    );
  }
}

const DayTime = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    const controls = Controls.createControls(camera, renderer);

    Helpers.drawPoint(scene, sky.getSunPosition());

    const rootElement = document.getElementById("daytime");
    const root = createRoot(rootElement);
    sky.updateSunPosition(0);
    root.render(
      <TimeControl
        onChange={(time) => {
          console.log(time);
          sky.updateSunPosition(time);
        }}
      />
    );
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    camera.position.set(-21200, 2500, 23000);
    controls.target = sky.getSunPosition();
  },
};

export default DayTime;
