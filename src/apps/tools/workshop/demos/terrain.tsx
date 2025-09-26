import * as THREE from 'three';
import textureImg from '../../../../../assets/foundation/textures/environment/h-map-lanzarote.png';
import { StoryOptions } from '../../../shared/types';

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
const createNoiseTexture = (width: number, height: number, scale: number = 0.1): THREE.DataTexture => {
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
    material: (displacement, settings) => new THREE.MeshStandardMaterial({
      color: 0x8B0000,
      emissive: 0xFF4500,
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
    material: (displacement, settings) => new THREE.MeshStandardMaterial({
      color: 0xE6F3FF,
      emissive: 0x4169E1,
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
    material: (displacement, settings) => new THREE.MeshStandardMaterial({
      color: 0xF4A460,
      emissive: 0xFFD700,
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
    material: (displacement, settings) => new THREE.MeshStandardMaterial({
      color: 0x9932CC,
      emissive: 0x00FF7F,
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
    material: (displacement, settings) => new THREE.MeshPhysicalMaterial({
      color: 0x87CEEB,
      emissive: 0xADD8E6,
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
    material: (displacement, settings) => new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00FF00,
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
    material: (displacement, settings) => new THREE.MeshStandardMaterial({
      color: 0xFF00FF,
      emissive: 0xFF1493,
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
      fogDensity: 0.002,
    };

    let currentTerrain: THREE.Mesh | null = null;
    let currentStyle = 'volcanic';
    let animationId: number | null = null;

    // Load textures
    const loader = new THREE.TextureLoader();
    const displacement = loader.load(textureImg);
    const proceduralNoise = createNoiseTexture(512, 512, 0.02);

    // Environment fog
    const fog = new THREE.Fog(0x000000, 1000, 20000);
    scene.fog = fog;

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

      // Update fog color based on style
      const fogColors: Record<string, number> = {
        volcanic: 0x330000,
        arctic: 0x001133,
        desert: 0x332200,
        alien: 0x220033,
        crystal: 0x003322,
        wireframe: 0x000000,
        plasma: 0x110022,
      };
      scene.fog!.color.setHex(fogColors[styleKey] || 0x000000);

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

    // Create initial terrain
    createTerrain(currentStyle);

    // GUI Controls
    if (gui) {
      const terrainFolder = gui.addFolder('🌍 Terrain Studio');

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
            fogDensity: 0.002,
          });
          createTerrain(terrainControl.style, terrainControl.useProceduralNoise);
        },
      };

      terrainFolder.add(terrainControl, 'style', styleNames)
        .name('🎨 Style')
        .onChange((value: string) => {
          currentStyle = value;
          createTerrain(value, terrainControl.useProceduralNoise);
          updateInfo();
        });

      terrainFolder.add(terrainControl, 'useProceduralNoise')
        .name('🔄 Procedural Noise')
        .onChange((value: boolean) => {
          createTerrain(currentStyle, value);
        });

      // Displacement settings
      const displacementFolder = terrainFolder.addFolder('⛰️ Displacement');
      displacementFolder.add(settings, 'displacementScale', 0, 2000)
        .name('Scale')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      displacementFolder.add(settings, 'displacementBias', -1, 1)
        .name('Bias')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      displacementFolder.add(settings, 'segments', 50, 500, 1)
        .name('Detail Level')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      // Visual settings
      const visualFolder = terrainFolder.addFolder('✨ Visual Effects');
      visualFolder.add(settings, 'wireframe')
        .name('Wireframe')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder.add(settings, 'transparency', 0, 1)
        .name('Transparency')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder.add(settings, 'roughness', 0, 1)
        .name('Roughness')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder.add(settings, 'metalness', 0, 1)
        .name('Metalness')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder.add(settings, 'emissiveIntensity', 0, 2)
        .name('Glow Intensity')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder.add(settings, 'animateVertices')
        .name('Dynamic Animation')
        .onChange(() => createTerrain(currentStyle, terrainControl.useProceduralNoise));

      visualFolder.add(settings, 'fogDensity', 0, 0.01)
        .name('Fog Density')
        .onChange((value) => {
          if (scene.fog) {
            scene.fog.far = 20000 / (1 + value * 100);
          }
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
          <h3 style="margin: 0 0 10px 0; color: #F64A8A;">🌍 ${style.name}</h3>
          <p style="margin: 0 0 15px 0; opacity: 0.9; font-size: 13px; line-height: 1.4;">
            ${style.description}
          </p>
          <div style="font-size: 12px; opacity: 0.8; line-height: 1.3;">
            <div>📊 Segments: ${settings.segments.toLocaleString()}</div>
            <div>⛰️ Displacement: ${settings.displacementScale}</div>
            <div>✨ Effects: ${settings.animateVertices ? 'Animated' : 'Static'}</div>
            <div>🎨 Available Styles: ${Object.keys(TERRAIN_STYLES).length}</div>
          </div>
        `;
      };

      updateInfo();
      document.body.appendChild(infoDiv);

      // Update info when style changes
      const originalOnChange = terrainFolder.controllers[0].onChange;
      terrainFolder.controllers[0].onChange = (value: string) => {
        originalOnChange(value);
        updateInfo();
      };

      terrainFolder.open();
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
