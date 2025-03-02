import React, { useEffect, useState } from "react";
import GUI from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module";
import * as THREE from "three";
import Sky from "./components/sky";
import Water from "./components/water";
import Island from "./components/island";
import Stories from "./stories/index";
import Camera from "./components/camera";
import Menu from './menu';
import Controls from "./utils/controls";

import "./index.css";

THREE.Cache.enabled = true;

const gui = new GUI();
gui.hide();

interface AppProps {
  initialStory?: string;
  showAppSelection?: boolean;
}

interface SceneConfig {
  sizes: {
    width: number;
    height: number;
  };
  scale: number;
  islandPosition: [number, number, number];
  cameraSettings: {
    fov: number;
    near: number;
    far: number;
  };
}

const SCENE_CONFIG: SceneConfig = {
  sizes: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scale: 20000,
  islandPosition: [0, -10, 0],
  cameraSettings: {
    fov: 45,
    near: 1,
    far: 200000,
  },
};

const createRenderer = (sizes: { width: number; height: number }) => {
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

const App: React.FC<AppProps> = ({ initialStory, showAppSelection: initialShowAppSelection = false }) => {
  const [loadingProcess, setLoadingProcess] = useState(0);
  const [showAppSelection, setShowAppSelection] = useState(initialShowAppSelection);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  const initThree = async () => {
    const renderer = createRenderer(SCENE_CONFIG.sizes);
    setRenderer(renderer);
    
    const scene = new THREE.Scene();
    
    // Sky setup
    const sky = new Sky(20, 3);
    sky.addToScene(scene);
    sky.addGui(gui);

    // Water setup
    const water = new Water({ size: 500000 }).load(sky.getSunPosition());
    scene.add(water);

    // Loading manager
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (_, loaded, total) => {
      setLoadingProcess(Math.floor((loaded / total) * 100));
    };

    // Island setup
    const island = await Island.load(loadingManager);
    island.scale.set(SCENE_CONFIG.scale, SCENE_CONFIG.scale, SCENE_CONFIG.scale);
    island.position.set(...SCENE_CONFIG.islandPosition);
    scene.add(island);

    // Camera setup
    const camera = new Camera(
      SCENE_CONFIG.cameraSettings.fov,
      SCENE_CONFIG.sizes.width / SCENE_CONFIG.sizes.height,
      SCENE_CONFIG.cameraSettings.near,
      SCENE_CONFIG.cameraSettings.far,
      renderer,
      island
    );
    camera.addGui(gui);
    scene.add(camera);

    // Event listeners
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === 'z') {
        gui._hidden ? gui.show() : gui.hide();
      }
    });

    const controls = Controls.createControls(camera, renderer);
    await Stories[initialStory](camera, scene, renderer, island, water, sky, gui, controls);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      stats.update();
    };
    animate();
    
    console.log("triangles:", renderer.info.render.triangles);
  };

  useEffect(() => {
    if (!renderer) {
      initThree();
    }
    
    return () => {
      // Cleanup
      renderer?.dispose();
    };
  }, []);

  const navigateTo = (story: string) => {
    window.location.href = `?story=${story}`;
  };

  return (
    <div className="lanzarote">
      {loadingProcess !== 100 && (
        <div className="loading">
          <span className="progress">LOADING {loadingProcess} %</span>
        </div>
      )}
      {showAppSelection && <Menu />}
      <canvas className="webgl" />
    </div>
  );
};

const stats = Stats();
stats.showPanel(0);
document.getElementById("stats")?.appendChild(stats.dom);

export default App;
