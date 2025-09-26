import * as THREE from 'three';
import Environment from '../../shared/env/environment';
import { StoryOptions } from '../../shared/types';
import { THEMES } from '../../../foundation/themes';
import { ThemeEngine } from '../../../foundation/systems/ThemeEngine';

// Use the natural theme from our theme library
const FAMARA_THEME = THEMES.natural;

/**
 * Famara Demo - Based on PhotoBooth but without paragliders
 * Focuses on the natural beauty of Famara beach area
 */
const Famara = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, controls, sky } = options;

    controls.enabled = true;

    // Apply theme to scene
    const theme = options.theme || FAMARA_THEME;
    await ThemeEngine.apply(options, theme);

    // Position camera to showcase Famara beach area (no paragliders to focus on)
    const initialPos = new THREE.Vector3(5800, 1200, 800);
    const lookAtPos = new THREE.Vector3(6500, 600, -200); // Look towards Famara beach

    // Set camera position and look at target
    camera.position.copy(initialPos);
    camera.lookAt(lookAtPos);
    controls.target.copy(lookAtPos);
    controls.update();

    // must render before adding env
    renderer.render(scene, camera);

    // Set up environment using theme
    const env = new Environment(scene);
    const weather = env.createWeatherFromTheme(theme);
    const thermals = env.generateThermals(weather, 0);

    // Add environment elements using theme
    await env.addCloudsFromTheme(thermals, theme);
    env.addTrees(terrain);
    env.addHouses(terrain);
    env.addBoats(water);

    // Add birds for more natural ambiance
    const birdPath = [
      new THREE.Vector3(5000, 1000, 0),
      new THREE.Vector3(6000, 1100, -500),
      new THREE.Vector3(7000, 1200, -1000),
      new THREE.Vector3(8000, 1000, -500),
      new THREE.Vector3(7000, 900, 0),
    ];
    await env.addBirds(birdPath);

    // Add hang glider for variety (different from paragliders)
    const hangGliderPath = [
      new THREE.Vector3(6000, 1500, -200),
      new THREE.Vector3(6200, 1400, -400),
      new THREE.Vector3(6400, 1300, -600),
      new THREE.Vector3(6600, 1200, -400),
      new THREE.Vector3(6400, 1100, -200),
    ];
    await env.addHangGlider(hangGliderPath);

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  },
};

export default Famara;
