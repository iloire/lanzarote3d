import React from "react";
import { createRoot } from "react-dom/client";
import GUI from "lil-gui";

import * as THREE from "three";
import Sky from "./components/sky";

import Animations from "./utils/animations";
import Models from "./utils/models";
import Helpers from "./utils/helpers";
import Water from "./components/water";

import Island from "./elements/island";

import Stories from "./stories/index";
import Camera from "./elements/camera";

import WebGL from "./WebGL";
import "./index.css";

const SHOW_HELPERS = true;

THREE.Cache.enabled = true;
const gui = new GUI();

const createRenderer = (sizes) => {
  const renderer = new THREE.WebGLRenderer({
    // powerPreference: "low-power" /* This can also be 'high-performance' */,
    canvas: document.querySelector("canvas.webgl"),
    antialias: true,
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
  // Define your component state here
}

class App extends React.Component<AppProps, AppState> {
  renderer: any;

  state = {
    loadingProcess: 0,
    sceneReady: false,
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

    if (SHOW_HELPERS) {
      Helpers.createHelpers(scene);
    }

    const sky: Sky = new Sky(20, 3);
    const skyMesh = sky.addToScene(scene);

    const water = new Water().load(sky.getSunPosition());
    scene.add(water);
    // Helpers.drawSphericalPosition(30, 90, 100, scene);

    const loadingManager = new THREE.LoadingManager();
    const island = await Island.load(loadingManager);
    const scale = 20000;
    island.scale.set(scale, scale, scale);
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

    loadingManager.onLoad = async () => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const story = urlParams.get("story");
      console.log("loading story:", story);
      if (story === "mechanics") {
        await Stories.mechanics(
          camera,
          scene,
          renderer,
          island,
          water,
          sky,
          gui
        );
      } else if (story === "flyzones") {
        await Stories.flyzones(camera, scene, renderer);
      } else if (story === "default") {
        await Stories.default(camera, scene, renderer);
      } else if (story === "daytime") {
        await Stories.daytime(camera, scene, renderer, island, water, sky, gui);
      } else {
        // default is game
        await Stories.game(camera, scene, renderer, island, water, sky, gui);
      }
    };
    loadingManager.onProgress = async (url, loaded, total) => {
      this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
    };

    function animate() {
      water.material.uniforms["time"].value += 1.0 / 60.0;
      requestAnimationFrame(animate);
    }
    animate();
  };

  render() {
    return (
      <div className="lanzarote">
        {this.state.loadingProcess === 100 ? (
          ""
        ) : (
          <div className="loading">
            <span className="progress">
              LOADING {this.state.loadingProcess} %
            </span>
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
