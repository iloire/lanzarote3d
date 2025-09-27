import * as THREE from 'three';
import Helpers from '../../../../foundation/utils/helpers';
import { Igloo, IglooSize } from '../../../../foundation/components/scenery';
import { StoryOptions } from '../../../shared/types';

const IglooWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, controls } = options;

    controls.enabled = true;

    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    // Create container for labels
    const labelContainer = document.createElement('div');
    labelContainer.style.position = 'absolute';
    labelContainer.style.top = '0';
    labelContainer.style.left = '0';
    labelContainer.style.width = '100%';
    labelContainer.style.height = '100%';
    labelContainer.style.pointerEvents = 'none';
    document.body.appendChild(labelContainer);

    // Create array of igloo configurations
    const iglooConfigs = [
      { size: IglooSize.Small, name: 'Small Igloo' },
      { size: IglooSize.Medium, name: 'Medium Igloo' },
      { size: IglooSize.Large, name: 'Large Igloo' },
    ];

    const x = -400;
    const z = 0;
    const ITEMS_PER_ROW = 3;

    // Add snowy ground plane
    const groundGeometry = new THREE.PlaneGeometry(2000, 1000);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff, // Snow white ground
      transparent: true,
      opacity: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -15;
    scene.add(ground);

    iglooConfigs.forEach((config, index) => {
      // Create igloo
      const igloo = new Igloo(config.size);
      const mesh = igloo.load();

      // Calculate grid position
      const row = Math.floor(index / ITEMS_PER_ROW);
      const col = index % ITEMS_PER_ROW;
      mesh.position.set(x + col * 400, 0, z + row * 600);

      scene.add(mesh);

      // Create HTML label
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.color = 'white';
      label.style.padding = '10px';
      label.style.background = 'rgba(0, 0, 0, 0.5)';
      label.style.borderRadius = '5px';
      label.style.textAlign = 'center';
      label.style.fontSize = '14px';
      label.style.fontFamily = 'Arial, sans-serif';

      label.innerHTML = `<strong>${config.name}</strong><br>
        <span style="font-size: 12px">
          Size: ${IglooSize[config.size]}<br>
          Radius: ${igloo.radius}m<br>
          Height: ${igloo.height}m
        </span>`;

      labelContainer.appendChild(label);

      // Update label position in animation loop
      const updateLabelPosition = () => {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(mesh.matrixWorld);
        vector.y += igloo.height + 50; // Position above the igloo

        // Project 3D position to 2D screen coordinates
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

        label.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
      };

      // Store update function on the mesh for later use
      (mesh as any).updateLabel = updateLabelPosition;
    });

    const animate = () => {
      requestAnimationFrame(animate);

      // Update all labels
      scene.traverse(object => {
        if ((object as any).updateLabel) {
          (object as any).updateLabel();
        }
      });

      renderer.render(scene, camera);
    };

    camera.position.set(0, 200, 800);
    camera.lookAt(scene.position);
    animate();

    // Cleanup function
    return () => {
      labelContainer.remove();
    };
  },
};

export default IglooWorkshop;