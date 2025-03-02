import * as THREE from "three";
import Helpers from "../utils/helpers";
import { HelmetOptions, HelmetType } from "../components/parts/helmets/types";
import { DefaultHelmet } from "../components/parts/helmets/DefaultHelmet";
import { FullFaceHelmet } from "../components/parts/helmets/FullFaceHelmet";
import { HelmetWithHorns } from "../components/parts/helmets/HelmetWithHorns";
import { StoryOptions } from "./types";

const toHexColor = (num: number): string => {
  const hex = num.toString(16);
  return '#' + '0'.repeat(6 - hex.length) + hex;
};

const HelmetWorkshop = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky } = options;
    
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

    // Create array of helmet configurations
    const helmets = Object.keys(HelmetType)
      .filter(key => isNaN(Number(key)))
      .map(helmetKey => {
        return {
          type: HelmetType[helmetKey],
          options: {
            color: toHexColor(Math.floor(Math.random()*16777215)),
            color2: toHexColor(Math.floor(Math.random()*16777215)),
            color3: toHexColor(Math.floor(Math.random()*16777215))
          } as HelmetOptions
        };
      });

    let x = -800;
    let z = 0;
    const ITEMS_PER_ROW = 3;
    
    helmets.forEach((helmetConfig, index) => {
      let helmet;
      console.log('Creating helmet:', helmetConfig.type); // Debug log
      
      switch (helmetConfig.type) {
        case HelmetType.Default:
          helmet = new DefaultHelmet(helmetConfig.options);
          break;
        case HelmetType.FullFace:
          helmet = new FullFaceHelmet(helmetConfig.options);
          break;
        case HelmetType.WithHorns:
          helmet = new HelmetWithHorns(helmetConfig.options);
          break;
        default:
          console.warn('Unknown helmet type:', helmetConfig.type); // Debug log
          return;
      }

      const mesh = helmet.load();
      console.log('Helmet mesh:', mesh); // Debug log
      
      // Calculate grid position
      const row = Math.floor(index / ITEMS_PER_ROW);
      const col = index % ITEMS_PER_ROW;
      mesh.position.set(x + (col * 800), 0, z + (row * 1000));
      
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
      
      const helmetTypeName = Object.keys(HelmetType).find(key => 
        HelmetType[key] === helmetConfig.type
      );

      label.innerHTML = `<strong>Helmet: ${helmetTypeName}</strong><br>
        <span style="font-size: 12px">
          color1: ${helmetConfig.options.color}<br>
          color2: ${helmetConfig.options.color2}<br>
          color3: ${helmetConfig.options.color3}
        </span>`;
      
      labelContainer.appendChild(label);

      // Update label position in animation loop
      const updateLabelPosition = () => {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(mesh.matrixWorld);
        vector.y += 200; // Position above the helmet

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
      scene.traverse((object) => {
        if ((object as any).updateLabel) {
          (object as any).updateLabel();
        }
      });
      
      renderer.render(scene, camera);
    };

    camera.position.set(0, 1000, 3000);
    camera.lookAt(scene.position);
    animate();

    // Cleanup function
    return () => {
      labelContainer.remove();
    };
  },
};

export default HelmetWorkshop; 