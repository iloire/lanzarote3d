import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from 'react-dom/client';

import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";

import islandModel from "./models/lanzarote.glb";
import balloonModel from "./models/balloon.glb";
import cloudModel from "./models/low_poly_cloud.glb";
import hgModel from "./models/hang_glider_-_low_poly.glb";
import cloudModel2 from "./models/clouds.glb";

import Animations from "./utils/animations";
import Lights from "./utils/lights.js";
import Controls from "./utils/controls.js";
import Models from "./utils/models";
import Navigation from "./utils/navigation";
import Helpers from "./utils/helpers";
import Water from "./utils/water";

import Island from "./elements/island";
import Balloon from "./elements/balloon";
import Cloud from "./elements/cloud1";
import HG from "./elements/hg";
import PG from "./elements/pg";

import "./index.css";

const SHOW_HELPERS = false;

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
    const clock = new THREE.Clock();

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("canvas.webgl"),
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(sizes.width, sizes.height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      sizes.width / sizes.height,
      1,
      2000
    );
    camera.position.set(0, 600, 1200);

    const controls = Controls.createControls(camera, renderer);

    Lights.addLightsToScene(scene, SHOW_HELPERS);

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

    const navigator = Navigation(camera, controls);

    Models.manager.onProgress = async (url, loaded, total) => {
      if (Math.floor((loaded / total) * 100) === 100) {
        this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
        navigator.default(1000, () => {
          this.setState({ sceneReady: true });
        });
      } else {
        this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
      }
    };

    const island = await Island.load(100, {x:0, y:0, z:0});
    scene.add(island);

    // balloons
    const balloonScale = 0.0005;
    const balloons = [
      { scale: balloonScale, location: { x: 0, y: 5, z: 10 }, speed: {x: 0.0001, y: 0.0002, z: 0.00005 }},
      { scale: balloonScale * 1.2, location: { x: 10, y: 22, z: 5 }, speed: {x: 0.0003, y: 0.0003, z: 0.0001 }},
      { scale: balloonScale * 1.4, location: { x: 7, y: 14, z: 10 }, speed: {x: 0.0001, y: 0.0002, z: 0.0001 }},
    ];
    balloons.forEach(async (b) => {
      const balloon = await Balloon.load(b.scale, b.location, b.speed);
      scene.add(balloon);
    });

    // hang glider
    const hg = await HG.load(0.008, { x: 0, y: 10, z: 10 });
    scene.add(hg);

    // paraglider
    const pgScale = 0.08;
    const pgs = [
      { scale: pgScale, location: { x: 45, y: 10, z: -40 }, speed: {x: 0.0001, y: 0.0002, z: 0.00005 }},
      { scale: pgScale * 1.2, location: { x: 50, y: 16, z: -45 }, speed: {x: 0.0003, y: 0.0003, z: 0.0001 }},
      { scale: pgScale * 1.4, location: { x: 55, y: 14, z: -57 }, speed: {x: 0.0001, y: 0.0002, z: 0.0001 }},
      { scale: pgScale * 1.4, location: { x: 62, y: 13, z: -52 }, speed: {x: 0.0001, y: 0.0002, z: 0.0001 }},
      { scale: pgScale * 1.4, location: { x: 55, y: 19, z: -53 }, speed: {x: 0.0001, y: 0.0002, z: 0.0001 }},
    ];
    pgs.forEach(async (p) => {
      const pg = await PG.load(p.scale, p.location, p.speed);
      scene.add(pg);
    });

    // clouds
    const clouds = [
      { type: 0, scale: 0.3, location: { x: 0, y: 30, z: 34} },
      { type: 0, scale: 0.2, location: { x: 10, y: 20, z: 0 } },
      { type: 0, scale: 0.1, location: { x: 12, y: 20, z: 0 } },
      { type: 1, scale: 0.01, location: { x: 50, y: 10, z: -40 } },
      { type: 1, scale: 0.02, location: { x: 60, y: 8, z: -45 } },
      { type: 0, scale: 0.2, location: { x: 55, y: 9, z: -45 } },
    ];

    clouds.forEach(async (cloud) => {
      const c = await Cloud.load(cloud.type, cloud.scale, cloud.location);
      scene.add(c);
    });

    // main. animate
    const animate = () => {
      requestAnimationFrame(animate);
      controls && controls.update();
      const timer = Date.now() * 0.0005;
      TWEEN && TWEEN.update();
      camera && (camera.position.y += Math.sin(timer) * 0.0003);
      renderer.render(scene, camera);
    };
    animate();
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
        <div className="points">
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
