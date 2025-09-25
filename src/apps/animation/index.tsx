import * as THREE from "three";
import { ParaglidingScene } from './scenes/ParaglidingScene';
import { StoryOptions } from "../shared/types";

// Configuration for the animation showcase
const ANIMATION_CONFIG = {
  paragliders: [
    {
      position: new THREE.Vector3(0, 800, 0),
      gliderOptions: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        numeroCajones: 35
      }
    },
    {
      position: new THREE.Vector3(500, 700, -200),
      gliderOptions: {
        wingColor1: '#00c330',
        wingColor2: '#0db1cd',
        numeroCajones: 40
      }
    },
    {
      position: new THREE.Vector3(-300, 900, 300),
      gliderOptions: {
        wingColor1: '#c39000',
        wingColor2: '#cd7b00',
        numeroCajones: 38
      }
    }
  ]
};

/**
 * Animation App - Showcase beautiful paragliding scenes
 *
 * This app demonstrates the power of the Foundation architecture:
 * - Uses only SceneManager, Paraglider, Sky, Weather, SoundManager
 * - Minimal bundle size with tree-shaking
 * - Clean, declarative scene configuration
 * - Professional scene management patterns
 */
const Animation = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, gui, controls } = options;

    // Disable orbit controls for cinematic experience
    controls.enabled = false;

    // Create the paragliding scene using foundation systems
    const paraglidingScene = new ParaglidingScene(ANIMATION_CONFIG);

    // Load and start the scene
    paraglidingScene.load(options);

    console.log('Animation App loaded with Foundation v3.0.0');
    console.log('Bundle includes: SceneManager, Paraglider, Sky, Weather, SoundManager');
  }
};

export default Animation;