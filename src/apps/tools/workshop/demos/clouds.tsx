import * as THREE from 'three';
import Clouds from '../../../../foundation/components/environment/Clouds';
import Helpers from '../../../../foundation/utils/helpers';
import { StoryOptions } from '../../../shared/types';
import { THEMES, getAllThemes, getThemeCategories, getThemeById } from '../../../../foundation/themes';
import { ThemeEngine } from '../../../../foundation/systems/ThemeEngine';
import Environment from '../../../shared/env/environment';

// Use themes from our comprehensive theme system
const ALL_THEMES = getAllThemes();
const THEME_CATEGORIES = getThemeCategories();

const CloudsWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, controls, gui } = options;
    controls.enabled = true;

    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    let currentClouds: THREE.Object3D | null = null;
    let currentTheme = ALL_THEMES[0]; // Start with first theme

    // Apply initial theme to the scene
    await ThemeEngine.apply(options, currentTheme);

    // Create clouds using theme
    const createClouds = async (theme: any) => {
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

      const cloudOptions = ThemeEngine.getCloudOptionsFromTheme(theme);
      const mesh = await new Clouds(cloudOptions).load(1, new THREE.Vector3(0, 0, 0));
      mesh.scale.set(0.1, 0.1, 0.1);
      mesh.position.set(0, 0, 0);
      scene.add(mesh);
      currentClouds = mesh;
      return mesh;
    };

    // Create initial clouds
    await createClouds(currentTheme);

    // GUI Controls for comprehensive theme switching
    if (gui) {
      const themeFolder = gui.addFolder('🎨 Complete Theme System');

      // Theme selector by categories
      const categoryFolder = themeFolder.addFolder('📂 Browse by Category');
      THEME_CATEGORIES.forEach(category => {
        const categoryThemes = ALL_THEMES.filter(theme => theme.category === category);
        if (categoryThemes.length > 0) {
          const folder = categoryFolder.addFolder(`${category} (${categoryThemes.length})`);
          categoryThemes.forEach(theme => {
            folder.add({
              apply: async () => {
                currentTheme = theme;
                await ThemeEngine.apply(options, theme);
                await createClouds(theme);
                updateInfo();
              }
            }, 'apply').name(`${theme.name}`);
          });
        }
      });

      // Quick theme selector
      const themeNames = ALL_THEMES.map(theme => theme.id);
      const themeControl = {
        theme: currentTheme.id,
        regenerate: () => createClouds(currentTheme),
        applyFullTheme: async () => {
          await ThemeEngine.apply(options, currentTheme);
          await createClouds(currentTheme);
          updateInfo();
        }
      };

      themeFolder
        .add(themeControl, 'theme', themeNames)
        .name('🚀 Quick Select')
        .onChange(async (value: string) => {
          const theme = getThemeById(value);
          if (theme) {
            currentTheme = theme;
            await ThemeEngine.apply(options, theme);
            await createClouds(theme);
            updateInfo();
          }
        });

      themeFolder.add(themeControl, 'applyFullTheme').name('🌟 Apply Complete Theme');
      themeFolder.add(themeControl, 'regenerate').name('🔄 Regenerate Clouds Only');

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
        infoDiv.innerHTML = `
          <h3 style="margin: 0 0 10px 0; color: #F64A8A;">🎨 ${currentTheme.name}</h3>
          <div style="margin-bottom: 8px; font-size: 12px; opacity: 0.9;">
            <strong>Category:</strong> ${currentTheme.category || 'general'}
          </div>
          <div style="margin-bottom: 8px; font-size: 11px; opacity: 0.8; line-height: 1.3;">
            ${currentTheme.description}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Cloud Colors:</strong>
          </div>
          <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            ${currentTheme.clouds.colors
              .map(
                color =>
                  `<div style="width: 20px; height: 20px; background: ${color}; border: 1px solid #666; border-radius: 3px;" title="${color}"></div>`
              )
              .join('')}
          </div>
          <div style="font-size: 11px; opacity: 0.8; line-height: 1.3; border-top: 1px solid #333; padding-top: 8px;">
            <div><strong>Theme Details:</strong></div>
            <div>🌅 Time: ${currentTheme.sky.timeOfDay}:00</div>
            <div>💧 Water: ${currentTheme.water.color} (${Math.round(currentTheme.water.opacity * 100)}%)</div>
            <div>🌍 Terrain: ${currentTheme.terrain.style}</div>
          </div>
          <div style="font-size: 10px; opacity: 0.7; margin-top: 10px;">
            Available themes: ${ALL_THEMES.length} across ${THEME_CATEGORIES.length} categories
          </div>
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #333; font-size: 11px; line-height: 1.3;">
            <div style="color: #F64A8A; font-weight: bold; margin-bottom: 5px;">⌨️ Keyboard Shortcuts:</div>
            <div>← → (or ↑ ↓): Switch themes</div>
            <div>1-9: Direct theme selection</div>
            <div>R: Regenerate clouds</div>
            <div>T: Apply complete theme</div>
          </div>
        `;
      };

      updateInfo();
      document.body.appendChild(infoDiv);

      // Update info when theme changes - access the controller directly
      const themeController = themeFolder.controllers.find(c => c.property === 'theme');
      if (themeController) {
        const originalOnChange = themeController.onChange;
        themeController.onChange = (value: string) => {
          const result = originalOnChange.call(themeController, value);
          const theme = getThemeById(value);
          if (theme) {
            currentTheme = theme;
            updateInfo();
          }
          return result;
        };
      }

      // Enhanced keyboard shortcuts for theme switching
      const handleKeyPress = async (event: KeyboardEvent) => {
        const currentIndex = ALL_THEMES.findIndex(theme => theme.id === currentTheme.id);

        switch (event.key) {
          case 'ArrowLeft':
          case 'ArrowDown': {
            // Previous theme
            event.preventDefault();
            const prevIndex = (currentIndex - 1 + ALL_THEMES.length) % ALL_THEMES.length;
            const prevTheme = ALL_THEMES[prevIndex];
            if (prevTheme) {
              currentTheme = prevTheme;
              await ThemeEngine.apply(options, prevTheme);
              await createClouds(prevTheme);
              updateInfo();
            }
            break;
          }
          case 'ArrowRight':
          case 'ArrowUp': {
            // Next theme
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % ALL_THEMES.length;
            const nextTheme = ALL_THEMES[nextIndex];
            if (nextTheme) {
              currentTheme = nextTheme;
              await ThemeEngine.apply(options, nextTheme);
              await createClouds(nextTheme);
              updateInfo();
            }
            break;
          }
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9': {
            // Direct theme selection (1-9)
            event.preventDefault();
            const themeIndex = parseInt(event.key) - 1;
            if (themeIndex >= 0 && themeIndex < ALL_THEMES.length) {
              const selectedTheme = ALL_THEMES[themeIndex];
              if (selectedTheme) {
                currentTheme = selectedTheme;
                await ThemeEngine.apply(options, selectedTheme);
                await createClouds(selectedTheme);
                updateInfo();
              }
            }
            break;
          }
          case 'r':
          case 'R':
            // Regenerate clouds only
            event.preventDefault();
            await createClouds(currentTheme);
            break;
          case 't':
          case 'T':
            // Apply complete theme
            event.preventDefault();
            await ThemeEngine.apply(options, currentTheme);
            await createClouds(currentTheme);
            updateInfo();
            break;
        }
      };

      // Add keyboard event listeners
      document.addEventListener('keydown', handleKeyPress);

      themeFolder.open();
      categoryFolder.open();
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
