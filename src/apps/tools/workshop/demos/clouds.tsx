import * as THREE from 'three';
import Clouds from '../../../../foundation/components/environment/Clouds';
import Helpers from '../../../../foundation/utils/helpers';
import { StoryOptions } from '../../../shared/types';

// Define cloud color themes
const CLOUD_THEMES = {
  sunset: {
    name: 'Sunset Romance',
    colors: ['#F64A8A', '#F987C5', '#DE3163'], // Pink/magenta theme
  },
  golden: {
    name: 'Golden Hour',
    colors: ['#FFD700', '#FFA500', '#FF8C00'], // Golden/yellow theme
  },
  storm: {
    name: 'Storm Clouds',
    colors: ['#2F2F2F', '#4A4A4A', '#666666'], // Dark/gray theme
  },
  ethereal: {
    name: 'Ethereal Blue',
    colors: ['#87CEEB', '#B0E0E6', '#F0F8FF'], // Light blue theme
  },
  autumn: {
    name: 'Autumn Mist',
    colors: ['#CD853F', '#DEB887', '#F5DEB3'], // Autumn brown/beige theme
  },
  arctic: {
    name: 'Arctic White',
    colors: ['#FFFAFA', '#F8F8FF', '#F5F5F5'], // Pure white theme
  },
};

const CloudsWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, controls, gui } = options;
    controls.enabled = true;

    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);
    sky.updateSunPosition(12);

    let currentClouds: THREE.Object3D | null = null;
    let currentTheme = 'sunset';

    // Create initial clouds with sunset theme
    const createClouds = async (themeKey: string) => {
      // Remove existing clouds
      if (currentClouds) {
        scene.remove(currentClouds);
        // Dispose of materials and geometries
        currentClouds.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      }

      const theme = CLOUD_THEMES[themeKey as keyof typeof CLOUD_THEMES];
      const cloudOptions = { colors: theme.colors };
      const mesh = await new Clouds(cloudOptions).load(1, new THREE.Vector3(0, 0, 0));
      mesh.scale.set(0.1, 0.1, 0.1);
      mesh.position.set(0, 0, 0);
      scene.add(mesh);
      currentClouds = mesh;
      return mesh;
    };

    // Create initial clouds
    await createClouds(currentTheme);

    // GUI Controls for theme switching
    if (gui) {
      const cloudFolder = gui.addFolder('Cloud Themes');

      // Theme selector
      const themeNames = Object.keys(CLOUD_THEMES);
      const themeControl = {
        theme: currentTheme,
        regenerate: () => createClouds(themeControl.theme),
      };

      cloudFolder
        .add(themeControl, 'theme', themeNames)
        .name('Theme')
        .onChange(async (value: string) => {
          currentTheme = value;
          await createClouds(value);
        });

      cloudFolder.add(themeControl, 'regenerate').name('Regenerate Clouds');

      // Display current theme info
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: 'Ubuntu Mono', monospace;
        font-size: 14px;
        z-index: 1000;
        max-width: 300px;
      `;

      const updateInfo = () => {
        const theme = CLOUD_THEMES[currentTheme as keyof typeof CLOUD_THEMES];
        infoDiv.innerHTML = `
          <h3 style="margin: 0 0 10px 0; color: #F64A8A;">${theme.name}</h3>
          <div style="margin-bottom: 8px;">
            <strong>Colors:</strong>
          </div>
          <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            ${theme.colors
              .map(
                color =>
                  `<div style="width: 20px; height: 20px; background: ${color}; border: 1px solid #666; border-radius: 3px;" title="${color}"></div>`
              )
              .join('')}
          </div>
          <div style="font-size: 12px; opacity: 0.8; line-height: 1.3;">
            Available themes: ${Object.keys(CLOUD_THEMES).length}<br>
            Use GUI controls or keyboard shortcuts
          </div>
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #333; font-size: 11px; line-height: 1.3;">
            <div style="color: #F64A8A; font-weight: bold; margin-bottom: 5px;">⌨️ Keyboard Shortcuts:</div>
            <div>← → (or ↑ ↓): Switch themes</div>
            <div>1-6: Direct theme selection</div>
            <div>R: Regenerate clouds</div>
          </div>
        `;
      };

      updateInfo();
      document.body.appendChild(infoDiv);

      // Update info when theme changes - access the controller directly
      const themeController = cloudFolder.controllers.find(c => c.property === 'theme');
      if (themeController) {
        const originalOnChange = themeController.onChange;
        themeController.onChange = (value: string) => {
          const result = originalOnChange.call(themeController, value);
          currentTheme = value;
          updateInfo();
          return result;
        };
      }

      // Keyboard shortcuts for theme switching
      const handleKeyPress = (event: KeyboardEvent) => {
        const themeKeys = Object.keys(CLOUD_THEMES);
        const currentIndex = themeKeys.indexOf(currentTheme);

        switch (event.key) {
          case 'ArrowLeft':
          case 'ArrowDown': {
            // Previous theme
            event.preventDefault();
            const prevIndex = (currentIndex - 1 + themeKeys.length) % themeKeys.length;
            const prevTheme = themeKeys[prevIndex];
            if (prevTheme) {
              currentTheme = prevTheme;
              createClouds(prevTheme);
              updateInfo();
            }
            break;
          }
          case 'ArrowRight':
          case 'ArrowUp': {
            // Next theme
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % themeKeys.length;
            const nextTheme = themeKeys[nextIndex];
            if (nextTheme) {
              currentTheme = nextTheme;
              createClouds(nextTheme);
              updateInfo();
            }
            break;
          }
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6': {
            // Direct theme selection (1-6)
            event.preventDefault();
            const themeIndex = parseInt(event.key) - 1;
            if (themeIndex >= 0 && themeIndex < themeKeys.length) {
              const selectedTheme = themeKeys[themeIndex];
              if (selectedTheme) {
                currentTheme = selectedTheme;
                createClouds(selectedTheme);
                updateInfo();
              }
            }
            break;
          }
          case 'r':
          case 'R':
            // Regenerate current theme
            event.preventDefault();
            createClouds(currentTheme);
            break;
        }
      };

      // Add keyboard event listeners
      document.addEventListener('keydown', handleKeyPress);

      cloudFolder.open();
    }

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    // Set camera position for good cloud viewing
    const lookAt = new THREE.Vector3(0, 0, 0);
    camera.position.set(290, 30, 230);
    camera.lookAt(lookAt);
    animate();
  },
};

export default CloudsWorkshop;
