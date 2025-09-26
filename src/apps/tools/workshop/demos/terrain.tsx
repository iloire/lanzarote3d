import * as THREE from 'three';
import textureImg from '../../../../../assets/foundation/textures/environment/h-map-lanzarote.png';
import { StoryOptions } from '../../../shared/types';
import { getAllThemes, getThemeById } from '../../../../foundation/themes';
import { ThemeEngine } from '../../../../foundation/systems/ThemeEngine';
import { themeManager } from '../../../../foundation/systems/ThemeManager';

// Terrain style definitions
interface TerrainStyle {
  name: string;
  description: string;
  material: (displacement: THREE.Texture, settings: TerrainSettings) => THREE.Material;
  postProcess?: (mesh: THREE.Mesh, settings: TerrainSettings) => void;
}

interface TerrainSettings {
  displacementScale: number;
  displacementBias: number;
  segments: number;
  wireframe: boolean;
  transparency: number;
  roughness: number;
  metalness: number;
  emissiveIntensity: number;
  animateVertices: boolean;
  fogDensity: number;
}

// Create procedural noise texture
const createNoiseTexture = (
  width: number,
  height: number,
  scale: number = 0.1
): THREE.DataTexture => {
  const size = width * height;
  const data = new Uint8Array(size);

  for (let i = 0; i < size; i++) {
    const x = (i % width) * scale;
    const y = Math.floor(i / width) * scale;

    // Layered noise for more realistic terrain
    const noise1 = Math.sin(x * 0.5) * Math.cos(y * 0.5);
    const noise2 = Math.sin(x * 2.0) * Math.cos(y * 2.0) * 0.5;
    const noise3 = Math.sin(x * 8.0) * Math.cos(y * 8.0) * 0.25;

    const combined = (noise1 + noise2 + noise3) * 0.5 + 0.5;
    data[i] = Math.floor(combined * 255);
  }

  const texture = new THREE.DataTexture(data, width, height);
  texture.needsUpdate = true;
  return texture;
};

// Advanced terrain styles
const TERRAIN_STYLES: Record<string, TerrainStyle> = {
  volcanic: {
    name: 'Volcanic Lava',
    description: 'Glowing volcanic terrain with emissive lava flows',
    material: (displacement, settings) =>
      new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        emissive: 0xff4500,
        emissiveIntensity: settings.emissiveIntensity,
        displacementMap: displacement,
        displacementScale: settings.displacementScale,
        displacementBias: settings.displacementBias,
        roughness: settings.roughness,
        metalness: 0.1,
        wireframe: settings.wireframe,
        transparent: settings.transparency < 1.0,
        opacity: settings.transparency,
      }),
  },

  arctic: {
    name: 'Arctic Tundra',
    description: 'Frozen landscape with icy crystalline surfaces',
    material: (displacement, settings) =>
      new THREE.MeshStandardMaterial({
        color: 0xe6f3ff,
        emissive: 0x4169e1,
        emissiveIntensity: settings.emissiveIntensity * 0.3,
        displacementMap: displacement,
        displacementScale: settings.displacementScale * 0.6,
        displacementBias: settings.displacementBias,
        roughness: 0.1,
        metalness: settings.metalness,
        wireframe: settings.wireframe,
        transparent: settings.transparency < 1.0,
        opacity: settings.transparency,
      }),
  },

  desert: {
    name: 'Sahara Dunes',
    description: 'Sandy desert with golden dunes and heat distortion',
    material: (displacement, settings) =>
      new THREE.MeshStandardMaterial({
        color: 0xf4a460,
        emissive: 0xffd700,
        emissiveIntensity: settings.emissiveIntensity * 0.5,
        displacementMap: displacement,
        displacementScale: settings.displacementScale * 1.5,
        displacementBias: settings.displacementBias,
        roughness: settings.roughness,
        metalness: 0.0,
        wireframe: settings.wireframe,
        transparent: settings.transparency < 1.0,
        opacity: settings.transparency,
      }),
  },

  alien: {
    name: 'Alien World',
    description: 'Otherworldly terrain with exotic materials and colors',
    material: (displacement, settings) =>
      new THREE.MeshStandardMaterial({
        color: 0x9932cc,
        emissive: 0x00ff7f,
        emissiveIntensity: settings.emissiveIntensity,
        displacementMap: displacement,
        displacementScale: settings.displacementScale * 2.0,
        displacementBias: settings.displacementBias,
        roughness: settings.roughness * 0.5,
        metalness: settings.metalness,
        wireframe: settings.wireframe,
        transparent: settings.transparency < 1.0,
        opacity: settings.transparency,
      }),
  },

  crystal: {
    name: 'Crystal Caves',
    description: 'Crystalline formations with refractive surfaces',
    material: (displacement, settings) =>
      new THREE.MeshPhysicalMaterial({
        color: 0x87ceeb,
        emissive: 0xadd8e6,
        emissiveIntensity: settings.emissiveIntensity * 0.4,
        displacementMap: displacement,
        displacementScale: settings.displacementScale,
        displacementBias: settings.displacementBias,
        roughness: 0.0,
        metalness: 0.0,
        transmission: 0.3,
        thickness: 5,
        wireframe: settings.wireframe,
        transparent: true,
        opacity: settings.transparency * 0.8,
      }),
  },

  wireframe: {
    name: 'Digital Matrix',
    description: 'Cyberpunk wireframe with glowing edges',
    material: (displacement, settings) =>
      new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: settings.emissiveIntensity,
        displacementMap: displacement,
        displacementScale: settings.displacementScale,
        displacementBias: settings.displacementBias,
        wireframe: true,
        transparent: settings.transparency < 1.0,
        opacity: settings.transparency,
      }),
  },

  plasma: {
    name: 'Plasma Energy',
    description: 'Energy-based terrain with dynamic plasma effects',
    material: (displacement, settings) =>
      new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff1493,
        emissiveIntensity: settings.emissiveIntensity * 1.5,
        displacementMap: displacement,
        displacementScale: settings.displacementScale,
        displacementBias: settings.displacementBias,
        roughness: 0.2,
        metalness: settings.metalness,
        wireframe: settings.wireframe,
        transparent: settings.transparency < 1.0,
        opacity: settings.transparency,
      }),
    postProcess: (mesh, settings) => {
      if (settings.animateVertices) {
        const geometry = mesh.geometry as THREE.PlaneGeometry;
        const positions = geometry.attributes.position;
        const time = Date.now() * 0.001;

        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const z = positions.getZ(i);
          const wave = Math.sin(x * 0.01 + time) * Math.cos(z * 0.01 + time * 0.7) * 50;
          positions.setY(i, wave);
        }
        positions.needsUpdate = true;
      }
    },
  },
};

// Use themes from our comprehensive theme system
const ALL_THEMES = getAllThemes();

const TerrainWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, controls, gui } = options;

    controls.enabled = true;
    water.visible = false;
    terrain.visible = false;

    sky.updateSunPosition(14);

    // Default settings
    const settings: TerrainSettings = {
      displacementScale: 800,
      displacementBias: 0.2,
      segments: 200,
      wireframe: false,
      transparency: 1.0,
      roughness: 0.8,
      metalness: 0.0,
      emissiveIntensity: 0.5,
      animateVertices: false,
      fogDensity: 0.001,
    };

    let currentTerrain: THREE.Mesh | null = null;
    let currentStyle = 'volcanic';
    let currentTheme = ALL_THEMES[0]; // Start with first theme

    // Apply initial theme (theme manager should already be initialized by app.tsx)
    await themeManager.applyTheme(currentTheme.id);

    // Load textures
    const loader = new THREE.TextureLoader();
    const displacement = loader.load(textureImg);
    const proceduralNoise = createNoiseTexture(512, 512, 0.02);

    // Note: Fog is handled by ThemeEngine to avoid conflicts
    // Remove manual fog application to prevent conflicts with theme system

    const createTerrain = (styleKey: string, useProceduralNoise = false) => {
      // Remove existing terrain
      if (currentTerrain) {
        scene.remove(currentTerrain);
        if (currentTerrain.material instanceof THREE.Material) {
          currentTerrain.material.dispose();
        }
        currentTerrain.geometry.dispose();
      }

      const style = TERRAIN_STYLES[styleKey];
      const displacementTexture = useProceduralNoise ? proceduralNoise : displacement;

      const geometry = new THREE.PlaneGeometry(15000, 15000, settings.segments, settings.segments);
      const material = style.material(displacementTexture, settings);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, -500, 0);

      scene.add(mesh);
      currentTerrain = mesh;

      // Apply post-processing
      if (style.postProcess) {
        style.postProcess(mesh, settings);
      }

      // Note: Fog color is handled by ThemeEngine to avoid conflicts
      // Remove manual fog color updates to prevent conflicts with theme system

      return mesh;
    };

    // Animation loop with post-processing
    const animate = () => {
      if (currentTerrain && currentStyle === 'plasma' && settings.animateVertices) {
        const style = TERRAIN_STYLES[currentStyle];
        if (style.postProcess) {
          style.postProcess(currentTerrain, settings);
        }
      }

      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      controls.update();
    };

    // Function to sync terrain with theme
    const syncTerrainWithTheme = async (theme: any) => {
      currentTheme = theme;
      await themeManager.applyTheme(theme.id);

      // Map theme terrain style to our terrain styles
      const themeTerrainStyle = theme.terrain?.style || 'volcanic';
      if (TERRAIN_STYLES[themeTerrainStyle]) {
        currentStyle = themeTerrainStyle;
        createTerrain(currentStyle);
      } else {
        // Fallback to volcanic if theme terrain style doesn't exist
        createTerrain(currentStyle);
      }
    };

    // Create initial terrain with theme integration
    await syncTerrainWithTheme(currentTheme);

    // GUI Controls
    if (gui) {
      const terrainFolder = gui.addFolder('🌍 Terrain Studio');

      // Theme controls
      const themeFolder = terrainFolder.addFolder('🎨 Complete Theme System');

      // Direct theme buttons
      const themesFolder = themeFolder.addFolder('🎨 All Themes');
      ALL_THEMES.forEach(theme => {
        themesFolder
          .add(
            {
              apply: async () => {
                await syncTerrainWithTheme(theme);
                updateInfo();
              },
            },
            'apply'
          )
          .name(`${theme.name}`);
      });

      // Quick theme selector
      const themeNames = ALL_THEMES.map(theme => theme.id);
      const themeControl = {
        theme: currentTheme.id,
        applyFullTheme: async () => {
          await syncTerrainWithTheme(currentTheme);
          updateInfo();
        },
      };

      themeFolder
        .add(themeControl, 'theme', themeNames)
        .name('🚀 Quick Select')
        .onChange(async (value: string) => {
          const theme = getThemeById(value);
          if (theme) {
            await syncTerrainWithTheme(theme);
            updateInfo();
          }
        });

      themeFolder.add(themeControl, 'applyFullTheme').name('🌟 Apply Complete Theme');

      // Style selector
      const styleNames = Object.keys(TERRAIN_STYLES);
      const terrainControl = {
        style: currentStyle,
        useProceduralNoise: false,
        regenerate: () => createTerrain(terrainControl.style, terrainControl.useProceduralNoise),
        resetSettings: () => {
          Object.assign(settings, {
            displacementScale: 800,
            displacementBias: 0.2,
            segments: 200,
            wireframe: false,
            transparency: 1.0,
            roughness: 0.8,
            metalness: 0.0,
            emissiveIntensity: 0.5,
            animateVertices: false,
            fogDensity: 0.001,
          });
          createTerrain(terrainControl.style, terrainControl.useProceduralNoise);
        },
      };

      terrainFolder
        .add(terrainControl, 'style', styleNames)
        .name('🎨 Style')
        .onChange((value: string) => {
          currentStyle = value;
          createTerrain(value, terrainControl.useProceduralNoise);
          updateInfo();
        });

      terrainFolder
        .add(terrainControl, 'useProceduralNoise')
        .name('🔄 Procedural Noise')
        .onChange((value: boolean) => {
          createTerrain(currentStyle, value);
        });

      // Displacement settings
      const displacementFolder = terrainFolder.addFolder('⛰️ Displacement');
      displacementFolder
        .add(settings, 'displacementScale', 0, 2000)
        .name('Scale')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      displacementFolder
        .add(settings, 'displacementBias', -1, 1)
        .name('Bias')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      displacementFolder
        .add(settings, 'segments', 50, 500, 1)
        .name('Detail Level')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      // Visual settings
      const visualFolder = terrainFolder.addFolder('✨ Visual Effects');
      visualFolder
        .add(settings, 'wireframe')
        .name('Wireframe')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder
        .add(settings, 'transparency', 0, 1)
        .name('Transparency')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder
        .add(settings, 'roughness', 0, 1)
        .name('Roughness')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder
        .add(settings, 'metalness', 0, 1)
        .name('Metalness')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder
        .add(settings, 'emissiveIntensity', 0, 2)
        .name('Glow Intensity')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder
        .add(settings, 'animateVertices')
        .name('Dynamic Animation')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder
        .add(settings, 'fogDensity', 0, 0.005)
        .name('Fog Density (Read-only - controlled by theme)')
        .onChange(value => {
          // Note: Fog density is controlled by ThemeEngine
          console.log('Fog density setting changed but not applied - controlled by theme system');
        });

      // Action buttons
      terrainFolder.add(terrainControl, 'regenerate').name('🔄 Regenerate');
      terrainFolder.add(terrainControl, 'resetSettings').name('⚡ Reset All');

      // Display current style info
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: 'Ubuntu Mono', monospace;
        font-size: 14px;
        z-index: 1000;
        max-width: 350px;
        border: 2px solid #F64A8A;
      `;

      const updateInfo = () => {
        const style = TERRAIN_STYLES[currentStyle];
        infoDiv.innerHTML = `
          <h3 style="margin: 0 0 10px 0; color: #F64A8A;">🎨 ${currentTheme.name}</h3>
          <div style="margin-bottom: 8px; font-size: 12px; opacity: 0.9;">
            <strong>Theme:</strong> ${currentTheme.category || 'general'}
          </div>
          <div style="margin-bottom: 8px; font-size: 11px; opacity: 0.8; line-height: 1.3;">
            ${currentTheme.description}
          </div>
          <h4 style="margin: 15px 0 8px 0; color: #F64A8A; font-size: 14px;">🌍 ${style.name}</h4>
          <p style="margin: 0 0 15px 0; opacity: 0.9; font-size: 12px; line-height: 1.4;">
            ${style.description}
          </p>
          <div style="font-size: 12px; opacity: 0.8; line-height: 1.3;">
            <div>📊 Segments: ${settings.segments.toLocaleString()}</div>
            <div>⛰️ Displacement: ${settings.displacementScale}</div>
            <div>✨ Effects: ${settings.animateVertices ? 'Animated' : 'Static'}</div>
            <div>🎨 Available Themes: ${ALL_THEMES.length}</div>
          </div>
          <div style="font-size: 11px; opacity: 0.8; line-height: 1.3; border-top: 1px solid #333; padding-top: 8px; margin-top: 10px;">
            <div><strong>Current Theme Details:</strong></div>
            <div>🌅 Time: ${currentTheme.sky.timeOfDay}:00</div>
            <div>💧 Water: ${currentTheme.water.color}</div>
            <div>🌍 Terrain: ${currentTheme.terrain.style}</div>
          </div>
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #333; font-size: 11px; line-height: 1.3;">
            <div style="color: #F64A8A; font-weight: bold; margin-bottom: 5px;">⌨️ Keyboard Shortcuts:</div>
            <div>← → (or ↑ ↓): Switch themes</div>
            <div>1-9: Direct theme selection</div>
            <div>R: Regenerate terrain</div>
            <div>T: Apply complete theme</div>
          </div>
        `;
      };

      updateInfo();
      document.body.appendChild(infoDiv);

      // Update info when style changes - access the controller directly
      const styleController = terrainFolder.controllers.find(c => c.property === 'style');
      if (styleController) {
        const originalOnChange = styleController.onChange;
        styleController.onChange = (value: string) => {
          const result = originalOnChange.call(styleController, value);
          updateInfo();
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
              await syncTerrainWithTheme(prevTheme);
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
              await syncTerrainWithTheme(nextTheme);
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
                await syncTerrainWithTheme(selectedTheme);
                updateInfo();
              }
            }
            break;
          }
          case 'r':
          case 'R':
            // Regenerate terrain only
            event.preventDefault();
            createTerrain(currentStyle);
            break;
          case 't':
          case 'T':
            // Apply complete theme
            event.preventDefault();
            await syncTerrainWithTheme(currentTheme);
            updateInfo();
            break;
        }
      };

      // Add keyboard event listeners
      document.addEventListener('keydown', handleKeyPress);

      terrainFolder.open();
      themeFolder.open();
      themesFolder.open();
      displacementFolder.open();
      visualFolder.open();
    }

    // Set camera position for dramatic terrain viewing
    camera.position.set(8000, 4000, 8000);
    camera.lookAt(0, 0, 0);

    animate();
  },
};

export default TerrainWorkshop;
