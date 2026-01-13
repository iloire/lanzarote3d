import React, { useEffect, useState } from 'react';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as THREE from 'three';
import { loadApp, hasApp } from './shared/index';
import { CameraTargetController as Camera } from './foundation/systems/scene/CameraTargetController';
import Menu from './menu';
import Controls from './foundation/utils/controls';
import { StoryOptions } from './shared/types';
import { themeManager } from './foundation/systems/ThemeManager';
import { ThemeEngine } from './foundation/systems/ThemeEngine';
import { getAppConfig } from './config/app-registry';
import { getThemeById } from './foundation/themes';
import { logger } from './foundation/utils/logger';

import './index.css';

THREE.Cache.enabled = true;

const gui = new GUI();
gui.hide();

interface AppProps {
  initialStory?: string;
  showAppSelection?: boolean;
  showPublic?: boolean;
  showPrivate?: boolean;
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

/**
 * Check if the sidebar should be shown for the current app.
 * Sidebar is hidden by default for the home app unless overridden via localStorage.
 */
function shouldShowSidebar(story?: string): boolean {
  // Check for localStorage override to force show menu
  const forceShowMenu = localStorage.getItem('lanzarote_show_menu') === 'true';
  if (forceShowMenu) {
    return true;
  }

  // Hide for home app
  if (story === 'home') {
    return false;
  }

  // Check for root path with no story (development default = home)
  const params = new URLSearchParams(window.location.search);
  const urlStory = params.get('story');
  const isRootPath =
    window.location.pathname === '/' || window.location.pathname === '/index.html';
  if (isRootPath && !urlStory) {
    return false;
  }

  return true;
}

const App: React.FC<AppProps> = ({
  initialStory,
  showAppSelection: initialShowAppSelection = false,
  showPublic,
  showPrivate,
  showDev,
}) => {
  const [loadingProcess, setLoadingProcess] = useState(0);
  const [showAppSelection] = useState(initialShowAppSelection);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  // Get current app name for title display
  const currentAppConfig = initialStory ? getAppConfig(initialStory) : null;
  const appName = currentAppConfig?.name || 'Lanzarote 3D';

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
    // Match by route (without leading slash) which comes from the HTML filename
    const currentApp = initialStory ? getAppConfig(initialStory) : null;

    if (currentApp?.theme) {
      const appTheme = getThemeById(currentApp.theme);
      if (appTheme) {
        logger.info(`Applying app-specific theme: ${appTheme.name} for app: ${currentApp.name}`);
        // Apply the app-specific theme before initializing theme manager
        await ThemeEngine.apply(storyOptions, appTheme);
        storyOptions.theme = appTheme;
      } else {
        logger.warn(
          `App-specific theme '${currentApp.theme}' not found for app: ${currentApp.name}`
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
      logger.error(`App "${initialStory}" not found in registry`);
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
      {showAppSelection && shouldShowSidebar(initialStory) && (
        <Menu
          showPublic={typeof showPublic === 'undefined' ? true : showPublic}
          showDev={typeof showDev === 'undefined' ? false : showDev}
          showPrivate={typeof showPrivate === 'undefined' ? false : showPrivate}
        />
      )}
      <div className="app-title">{appName}</div>
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
