import React from "react";
import { createRoot } from "react-dom/client";
import GUI from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module";
import * as THREE from "three";
import Sky from "../../components/sky";
import Water from "../../components/water";
import Island from "../../components/island";
import Stories from "../../stories/index";
import Camera from "../../components/camera";
import Menu from '../../menu';
import WebGL from "../../WebGL";

import "../../index.css";

THREE.Cache.enabled = true;

const gui = new GUI();
gui.hide();

const createRenderer = (sizes) => {
  const renderer = new THREE.WebGLRenderer({
    // powerPreference: "low-power" ,
    powerPreference: "high-performance",
    canvas: document.querySelector("canvas.webgl"),
    antialias: true,
    alpha: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(sizes.width, sizes.height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  return renderer;
};

interface AppProps {
  // Define your component props here
}

interface AppState {
  loadingProcess: number;
  showAppSelection: boolean;
}

class App extends React.Component<AppProps, AppState> {
  renderer: any;

  state = {
    loadingProcess: 0,
    showAppSelection: false,
  };

  constructor(props: AppProps) {
    super(props);
    this.renderer = null;
  }

  async componentDidMount() {
    if (!this.renderer) {
      await this.initThree();
    }
  }

  componentWillUnmount() {
    this.setState = () => {
      return;
    };
  }

  initThree = async () => {
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const renderer = createRenderer(sizes);
    this.renderer = renderer;

    const scene = new THREE.Scene();

    window.addEventListener(
      "resize",
      () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false
    );

    const sky: Sky = new Sky(20, 3);
    sky.addToScene(scene);
    sky.addGui(gui);

    const water = new Water({ size: 500000 }).load(sky.getSunPosition());
    scene.add(water);
    // Helpers.drawSphericalPosition(30, 90, 100, scene);

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = async (url, loaded, total) => {
      this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
    };

    const island = await Island.load(loadingManager);
    const scale = 20000;
    island.scale.set(scale, scale, scale);
    island.position.set(0, -10, 0);
    scene.add(island);

    const camera = new Camera(
      45,
      sizes.width / sizes.height,
      1,
      200000,
      renderer,
      island
    );
    camera.addGui(gui);
    scene.add(camera);

    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
      const keyCode = event.which;
      if (keyCode == 90) {
        //z
        if (gui._hidden) {
          gui.show();
        } else {
          gui.hide();
        }
      }
    }

    await Stories.animation(camera, scene, renderer, island, water);

    function animate() {
      requestAnimationFrame(animate);
      stats.update();
    }
    animate();
    console.log("triangles:", renderer.info.render.triangles);
  };

  render() {
    const { loadingProcess } = this.state;

    return (
      <div className="lanzarote">
        {loadingProcess === 100 ? (
          ""
        ) : (
          <div className="loading">
            <span className="progress">LOADING {loadingProcess} %</span>
          </div>
        )}
        <canvas className="webgl"></canvas>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
if (WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
}

const stats = Stats();
stats.showPanel(0);
document.getElementById("stats").appendChild(stats.dom);
