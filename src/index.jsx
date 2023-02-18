import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import GUI from "lil-gui";

import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky";

import islandModel from "./models/lanzarote.glb";

import Animations from "./utils/animations";
import Lights from "./utils/lights.js";
import Models from "./utils/models";
import Helpers from "./utils/helpers";
import Water from "./utils/water";

import Island from "./elements/island";
import Clouds from "./elements/clouds";

import Stories from './stories/index.js'

import "./index.css";

const SHOW_HELPERS = true;

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
}

class App extends React.Component {
  constructor() {
    super();
  }

  state = {
    loadingProcess: 0,
    sceneReady: false,
  };

  componentDidMount() {
    this.initThree();
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

    const renderer = createRenderer(sizes)

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      sizes.width / sizes.height,
      1,
      2000
    );
    scene.add(camera)

    const cameraGui = gui.addFolder("Camera");
    cameraGui.add(camera.position, "x", -100, 100).name("x").listen();
    cameraGui.add(camera.position, "y", 0, 100).name("y").listen();
    cameraGui.add(camera.position, "z", -100, 100).name("z").listen();

    cameraGui.add(camera.rotation, "x", -Math.PI, Math.PI).name("rotation.x").listen();
    cameraGui.add(camera.rotation, "y", -Math.PI, Math.PI).name("rotation.y").listen();
    cameraGui.add(camera.rotation, "z", -Math.PI, Math.PI).name("rotation.z").listen();

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

    const sky = new Sky();
    sky.scale.setScalar(10000);
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

    Models.manager.onProgress = async (url, loaded, total) => {
      if (Math.floor((loaded / total) * 100) === 100) {
        this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
        this.setState({ sceneReady: true });
      } else {
        this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
      }
    };

    const island = await Island.load(100, { x: 0, y: 0, z: 0 });
    scene.add(island);

    const c = await Clouds.load(1, {x: 0, y: 10, z:0});
    scene.add(c);
    const c1 = await Clouds.load(1, {x: 60, y: 12, z:-40});
    scene.add(c1);

    await Stories.game (camera, scene, renderer, island, water, gui);
  };

  render() {
    return (
      <div className="lanzarote">
        <canvas className="webgl"></canvas>
        {this.state.loadingProcess === 100 ? (
          ""
        ) : (
          <div className="loading">
            <span className="progress">{this.state.loadingProcess} %</span>
          </div>
        )}
        <div className="points" style={{display:'none'}}>
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
