import React from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Sky } from "three/examples/jsm/objects/Sky";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";

import islandModel from "./models/lanzarote.glb";
import balloonModel from "./models/balloon.glb";
import cloudModel from "./models/low_poly_cloud.glb";
import hgModel from "./models/hang_glider_-_low_poly.glb";
import cloudModel2 from "./models/clouds.glb";

import Animations from "./utils/animations";
import Models from "./utils/models";
import "./index.css";

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

  initThree = () => {
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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.maxPolarAngle = 1.5;
    controls.minDistance = 10;
    controls.maxDistance = 1200;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 20);
    pointLight.color.setHSL(0.995, 0.5, 0.9);
    pointLight.position.set(0, 45, -2000);
    scene.add(pointLight);

    window.addEventListener(
      "resize",
      () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false
    );

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
    const phi = THREE.MathUtils.degToRad(89);
    const theta = THREE.MathUtils.degToRad(280);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms["sunPosition"].value.copy(sun);
    scene.environment = pmremGenerator.fromScene(sky).texture;

    const manager = new THREE.LoadingManager();
    manager.onProgress = async (url, loaded, total) => {
      if (Math.floor((loaded / total) * 100) === 100) {
        this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
        navigateFamara(4000, () => {
          this.setState({ sceneReady: true });
        });
      } else {
        this.setState({ loadingProcess: Math.floor((loaded / total) * 100) });
      }
    };

    const loader = new GLTFLoader(manager);

    loader.load(islandModel, (mesh) => {
      mesh.scene.traverse((child) => {
        if (child.isMesh) {
          // child.material.metalness = 0.4;
          // child.material.roughness = 0.6;
          child.material = new THREE.MeshPhongMaterial({ color: 0x808080});
        }
      });
      mesh.scene.position.set(0, 0, 0);
      mesh.scene.scale.set(100, 100, 100);
      scene.add(mesh.scene);
    });

    Models.load(scene, balloonModel, 0.0008, {x: 21, y: 32, z: 9}, {x: -Math.PI/2})
    Models.load(scene, hgModel, 0.03, {x: 21, y: 32, z: 29})
    Models.load(scene, cloudModel2, 0.03, {x: 1, y: 42, z: 29})

    const clouds = [
      { scale: 0.3, location : { x: 0, y: 10, z: 0} },
      { scale: 0.2, location : { x: 10, y: 20, z: 0} },
      { scale: 0.1, location : { x: 12, y: 20, z: 0} },
    ];

    clouds.forEach(cloud => {
      Models.load(scene, cloudModel, cloud.scale, cloud.location)
    });

    const raycaster = new THREE.Raycaster();

    // var axesHelper = new THREE.AxesHelper(25);
    // scene.add(axesHelper);

    const navigateFamara = (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: -40, y: 20, z: -10 },
        { x: 50, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    };

    const navigateOrzola = (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 120, y: 10, z: -70 },
        { x: 20, y: 0, z: -30 },
        t || 1600,
        cb || (() => {})
      );
    }

    const navigateMacher = (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: 30, y: 10, z: 100 },
        { x: -20, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    }

    const navigateTenesar = (t, cb) => {
      Animations.animateCamera(
        camera,
        controls,
        { x: -30, y: 5, z: -20 },
        { x: -20, y: 0, z: 0 },
        t || 1600,
        cb || (() => {})
      );
    }

    document.querySelectorAll(".point").forEach((item) => {
      item.addEventListener(
        "click",
        (event) => {
          let className =
            event.target.classList[event.target.classList.length - 1];
          switch (className) {
            case "label-0": // famara
              navigateFamara();
              break;
            case "label-1": // mirador Orzola
              navigateOrzola();
              break;
            case "label-2": // macher
              navigateMacher();
              break;
            case "label-3": // Tenesar
              navigateTenesar();
              break;
            default:
              break;
          }
        },
        false
      );
    });

    const animate = () => {
      requestAnimationFrame(animate);
      controls && controls.update();
      const timer = Date.now() * 0.0005;
      TWEEN && TWEEN.update();
      camera && (camera.position.y += Math.sin(timer) * 0.004);
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

ReactDOM.render(<App /> , document.getElementById("root"));
