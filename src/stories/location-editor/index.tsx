import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import { StoryOptions } from "../types";
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { setupLabelRenderer } from "../flyzones/helpers";
import { EditorState, createNewLocation, addTakeoff, addLandingSpot, addFlyZonePhase, exportLocationData, resetLocation, undoLastAction } from "./state";
import { createEditorUI } from "./ui";
import { setupInteraction } from "./interaction";
import "./styles.css"; // Import the CSS

const LocationEditor = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, controls, gui, terrain } = options;

    camera.position.set(1000,5000,1000);

    console.log("Location Editor loading...");
    console.log("Scene:", scene);
    console.log("Terrain:", terrain);

    // Store scene in window for UI access
    (window as any).__editorScene = scene;

    // Initialize editor state
    const editorState: EditorState = {
      currentLocation: null,
      selectedItem: null,
      mode: "location", // Start in location creation mode
      flyZonePhaseType: "takeoff",
      markers: [],
      flyZones: [],
      history: [] // Initialize history array
    };

    // Setup renderers and containers
    const labelRenderer = setupLabelRenderer();

    // Setup editor GUI
    const editorFolder = gui.addFolder('Location Editor');
    editorFolder.open(); // Make sure the folder is open
    
    // Mode selection
    const modeFolder = editorFolder.addFolder('Mode');
    modeFolder.open(); // Make sure the folder is open
    modeFolder.add(editorState, 'mode', ['location', 'takeoff', 'landing', 'flyzone'])
      .name('Edit Mode')
      .onChange((value: string) => {
        console.log(`Switched to ${value} mode`);
        updateCursorStyle(value);
      });
    
    // FlyZone phase type selection (only visible in flyzone mode)
    const flyZoneFolder = editorFolder.addFolder('FlyZone Settings');
    flyZoneFolder.open(); // Make sure the folder is open
    flyZoneFolder.add(editorState, 'flyZonePhaseType', ['takeoff', 'ridge', 'approach', 'landing'])
      .name('Phase Type');
    
    // Export button
    editorFolder.add({ exportData: () => exportLocationData(editorState) }, 'exportData')
      .name('Export Location Data');
    
    // Reset button
    editorFolder.add({ resetLocation: () => resetLocation(editorState, scene) }, 'resetLocation')
      .name('Reset Location')
      .onChange(() => {
        // Update UI after reset
        createEditorUI(editorState);
      });

    // Undo button
    editorFolder.add({ undoLastAction: () => undoLastAction(editorState, scene) }, 'undoLastAction')
      .name('Undo Last Action')
      .onChange(() => {
        // Update UI after undo
        createEditorUI(editorState);
      });

    // Make sure terrain is clickable
    if (terrain) {
      terrain.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData.type = 'terrain';
          child.userData.clickable = true;
        }
      });
    }

    // Setup interaction
    const { raycaster, mouse } = setupInteraction(renderer, camera, scene, editorState);

    // Create UI
    createEditorUI(editorState);

    // Helper function to update cursor style based on mode
    const updateCursorStyle = (mode: string) => {
      switch(mode) {
        case 'location':
          renderer.domElement.style.cursor = 'crosshair';
          break;
        case 'takeoff':
          renderer.domElement.style.cursor = 'cell';
          break;
        case 'landing':
          renderer.domElement.style.cursor = 'copy';
          break;
        case 'flyzone':
          renderer.domElement.style.cursor = 'pointer';
          break;
        default:
          renderer.domElement.style.cursor = 'default';
      }
    };
    
    // Initialize cursor style
    updateCursorStyle(editorState.mode);

    // Render loop
    const animate = () => {
      TWEEN.update();
      
      // Update hover states
      raycaster.setFromCamera(mouse, camera);
      
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      requestAnimationFrame(animate);
      controls.update();
    };

    // Initialize
    window.addEventListener('resize', () => labelRenderer.setSize(window.innerWidth, window.innerHeight));
    animate();

    // Add a debug sphere to verify the scene is working
    const debugSphere = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    debugSphere.position.set(0, 1000, 0);
    scene.add(debugSphere);
    console.log("Added debug sphere at position:", debugSphere.position);
  },
};

export default LocationEditor; 