import React, { useEffect, useState } from 'react';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as THREE from 'three';
import { loadApp, hasApp } from './apps/shared/index';
import { CameraController as Camera } from './foundation/systems/scene/CameraController';
import Menu from './menu';
import Controls from './foundation/utils/controls';
import { StoryOptions } from './apps/shared/types';
import { themeManager } from './foundation/systems/ThemeManager';
import { ThemeEngine } from './foundation/systems/ThemeEngine';
import { getAllApps } from './apps/config/app-registry';
import { getThemeById } from './foundation/themes';

import './index.css';

THREE.Cache.enabled = true;

const gui = new GUI();
gui.hide();

interface AppProps {
  initialStory?: string;
  showAppSelection?: boolean;
  showPublic?: boolean;
  showExperiments?: boolean;
  showDev?: boolean;
}

interface SceneConfig {
  sizes: {
    width: number;
    height: number;
  };
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
  cameraSettings: {
    fov: 45,
    near: 1,
    far: 200000,
  },
};

const createRenderer = (sizes: { width: number; height: number }) => {
  const renderer = new THREE.WebGLRenderer({
    // powerPreference: "low-power" ,
    powerPreference: 'high-performance',
    canvas: document.querySelector('canvas.webgl') || undefined,
    antialias: true,
    alpha: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(sizes.width, sizes.height);

  // Shadow settings for consistency
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return renderer;
};

const App: React.FC<AppProps> = ({
  initialStory,
  showAppSelection: initialShowAppSelection = false,
  showPublic,
  showExperiments,
  showDev,
}) => {
  const [loadingProcess, setLoadingProcess] = useState(0);
  const [showAppSelection] = useState(initialShowAppSelection);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  const initThree = async () => {
    const renderer = createRenderer(SCENE_CONFIG.sizes);
    setRenderer(renderer);

    const scene = new THREE.Scene();

    // Camera setup (no terrain dependency)
    const camera = new Camera(
      SCENE_CONFIG.cameraSettings.fov,
      SCENE_CONFIG.sizes.width / SCENE_CONFIG.sizes.height,
      SCENE_CONFIG.cameraSettings.near,
      SCENE_CONFIG.cameraSettings.far
    );
    camera.addGui(gui);
    scene.add(camera);

    // Event listeners
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('keydown', event => {
      if (event.key.toLowerCase() === 'z') {
        gui._hidden ? gui.show() : gui.hide();
      }
    });

    const controls = Controls.createControls(camera, renderer);
    if (controls) {
      controls.enabled = false;
    }

    // Simple, direct animation loop - no complex manager needed
    const animate = () => {
      requestAnimationFrame(animate);
      if (process.env.NODE_ENV === 'development') {
        stats.update();
      }
    };
    animate();

    const storyOptions: StoryOptions = {
      camera,
      scene,
      renderer,
      gui,
      controls,
      // Environment components will be loaded by base classes as needed
    };

    // Check for app-specific theme override
    const allApps = getAllApps();
    const currentApp = allApps.find(app => app.route.replace('/', '') === initialStory);

    if (currentApp?.theme) {
      const appTheme = getThemeById(currentApp.theme);
      if (appTheme) {
        console.log(`🎨 Applying app-specific theme: ${appTheme.name} for app: ${currentApp.name}`);
        // Apply the app-specific theme before initializing theme manager
        await ThemeEngine.apply(storyOptions, appTheme);
        storyOptions.theme = appTheme;
      } else {
        console.warn(
          `🎨 App-specific theme '${currentApp.theme}' not found for app: ${currentApp.name}`
        );
      }
    }

    // Initialize theme manager for dynamic theme switching
    themeManager.initialize(storyOptions);

    // Load the selected app
    if (initialStory && hasApp(initialStory)) {
      await loadApp(initialStory, storyOptions);

      // If the app applied a theme, capture it in the theme manager
      if (storyOptions.theme && ThemeEngine.getCurrentTheme()) {
        themeManager.setCurrentTheme(ThemeEngine.getCurrentTheme()!);
      }

      // Apply saved theme after app has loaded (includes environment for cloud colors)
      await themeManager.applySavedThemeAfterLoad();
    } else {
      console.error(`App "${initialStory}" not found in registry`);
    }

    // Rendering complete
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

  return (
    <div className="lanzarote">
      {loadingProcess !== 100 && (
        <div className="loading">
          <span className="progress">LOADING {loadingProcess} %</span>
        </div>
      )}
      {showAppSelection && (
        <Menu
          showPublic={typeof showPublic === 'undefined' ? true : showPublic}
          showDev={typeof showDev === 'undefined' ? false : showDev}
          showExperiments={typeof showExperiments === 'undefined' ? false : showExperiments}
        />
      )}
      <canvas className="webgl" />
    </div>
  );
};

const stats = new Stats();
if (process.env.NODE_ENV === 'development') {
  stats.showPanel(0);
  document.getElementById('stats')?.appendChild(stats.dom);
}

export default App;
