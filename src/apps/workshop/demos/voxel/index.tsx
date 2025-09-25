import * as THREE from 'three';
import { StoryOptions } from '../types';
import createVoxelExample from './example';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';

const VoxelStory = {
  load: async (options: StoryOptions) => {
    const { scene, camera, controls, renderer } = options;
    
    console.log('Starting VoxelStory load');
    
    // Create and add elephant to scene
    const example = createVoxelExample();
    scene.add(example);
    
    console.log('Scene info:', {
      children: scene.children.length,
      renderInfo: renderer.info.render,
      sceneObjects: scene.children.map(child => ({
        type: child.type,
        position: child.position,
        visible: child.visible
      }))
    });

    // Add multiple lights for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Add key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(1000, 1000, 1000);
    scene.add(keyLight);

    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-1000, 500, 0);
    scene.add(fillLight);

    // Add back light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(0, 500, -1000);
    scene.add(backLight);

    // Reset camera and controls
    camera.position.set(0, 500, 1000);
    camera.lookAt(0, 200, 0);
    controls.target.set(0, 200, 0);
    controls.minDistance = 100;
    controls.maxDistance = 5000;
    controls.update();

    console.log('Camera setup:', {
      position: camera.position,
      target: controls.target
    });

    // Add axes helper for debugging
    const axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);

    // Add grid helper for scale reference
    const gridHelper = new THREE.GridHelper(2000, 20);
    scene.add(gridHelper);

    // Add a platform under the elephant
    const platformGeometry = new THREE.PlaneGeometry(2000, 2000);
    const platformMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x666666,
      shininess: 0,
      side: THREE.DoubleSide
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.rotation.x = -Math.PI / 2;
    platform.position.y = -50;
    scene.add(platform);

    // Add fog to the scene for depth
    scene.fog = new THREE.Fog(0x000000, 1000, 5000);

    // Add button to download STL if needed
    const addDownloadButton = () => {
      const button = document.createElement('button');
      button.innerHTML = 'Download STL';
      button.style.position = 'absolute';
      button.style.bottom = '20px';
      button.style.left = '20px';
      button.style.zIndex = '1000';
      button.onclick = () => {
        const exporter = new STLExporter();
        const stlString = exporter.parse(example);
        const blob = new Blob([stlString], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'voxel_example.stl';
        link.click();
      };
      document.body.appendChild(button);
    };

    addDownloadButton();


    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const lookAt = new THREE.Vector3(0, 300, 0);
    camera.position.set(500, 1400, 1000);
    camera.lookAt(lookAt);
    controls.update();
    animate();
  }
};

export default VoxelStory; 