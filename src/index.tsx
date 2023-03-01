import React from "react";
import { createRoot } from "react-dom/client";
import GUI from "lil-gui";

import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky";

import Animations from "./utils/animations";
import Lights from "./utils/lights";
import Models from "./utils/models";
import Helpers from "./utils/helpers";
import Water from "./utils/water";

import Island from "./elements/island";

import Stories from "./stories/index";
import Camera from "./elements/camera";

import "./index.css";

const SHOW_HELPERS = true;

THREE.Cache.enabled = true;
const gui = new GUI();

const createRenderer = (sizes) => {
  const renderer = new THREE.WebGLRenderer({
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

    const camera = new Camera(45, sizes.width / sizes.height, 1, 200000);
    camera.addGui(gui);
    scene.add(camera);

    Lights.addLightsToScene(scene, false);

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

    const water = Water.load();
    scene.add(water);
    // Helpers.drawSphericalPosition(30, 90, 100, scene);

    const sky: any = new Sky();
    sky.scale.setScalar(1000000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms["turbidity"].value = 20;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const sun = new THREE.Vector3();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const phi = THREE.MathUtils.degToRad(88);
    const theta = THREE.MathUtils.degToRad(280);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms["sunPosition"].value.copy(sun);
    scene.environment = pmremGenerator.fromScene(sky).texture;

    const loadingManager = new THREE.LoadingManager();
    const island = await Island.load(loadingManager);
    const scale = 20000;
    island.scale.set(scale, scale, scale);
    island.position.copy(new THREE.Vector3(0, 0, 0));
    scene.add(island);

    loadingManager.onLoad = async () => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      if (urlParams.get("story") === "mechanics") {
        await Stories.mechanics(camera, scene, renderer, island, water, gui);
      } else {
        await Stories.game(camera, scene, renderer, island, water, gui);
      }
    };
    loadingManager.onProgress = async (url, loaded, total) => {
      console.log(loaded, url);
      this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
    };
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

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(<App />);
