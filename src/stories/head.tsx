import * as THREE from "three";
import Controls from "../utils/controls";
import Sky from "../components/sky";
import PilotHead, { GlassesType, PilotHeadType, PilotHeadOptions } from "../components/parts/pilot-head";
import Helpers from "../utils/helpers";
import { HelmetOptions, HelmetType } from "../components/parts/helmets/types";

const toHexColor = (num: number): string => {
  const hex = num.toString(16);
  return '#' + '0'.repeat(6 - hex.length) + hex;
};

const HeadStory = {
  load: async (
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui
  ) => {
    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    const controls = Controls.createControls(camera, renderer);
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

    const heads = Object.keys(PilotHeadType)
      .filter(key => isNaN(Number(key)))
      .reduce((acc, headKey) => {

        // For each head type
        Object.keys(HelmetType)
          .filter(key => isNaN(Number(key)))
          .forEach(helmetKey => {

            // Add head with helmet and each glasses type
            Object.keys(GlassesType)
              .filter(key => isNaN(Number(key)))
              .forEach(glassesKey => {
                // helmet options with random colors
                const baseHelmetOptions: HelmetOptions = {
                  color: toHexColor(Math.floor(Math.random() * 16777215)),
                  color2: toHexColor(Math.floor(Math.random() * 16777215)),
                  color3: toHexColor(Math.floor(Math.random() * 16777215))
                };

                acc.push({
                  headType: PilotHeadType[headKey],
                  helmetType: HelmetType[helmetKey],
                  helmetOptions: baseHelmetOptions,
                  glassesType: GlassesType[glassesKey]
                });
              });
          });

        return acc;
      }, [] as PilotHeadOptions[]);

    let x = -2000;
    let z = 0;
    const ITEMS_PER_ROW = 5;

    heads.forEach((headOptions, index) => {
      const head = new PilotHead(headOptions);
      const mesh = head.load();

      // Calculate grid position
      const row = Math.floor(index / ITEMS_PER_ROW);
      const col = index % ITEMS_PER_ROW;
      mesh.position.set(x + (col * 800), -100, z + (row * 1000));

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

      // Fix the enum value display
      const headTypeName = Object.keys(PilotHeadType).find(key =>
        PilotHeadType[key] === headOptions.headType
      );
      const helmetTypeName = Object.keys(HelmetType).find(key =>
        HelmetType[key] === headOptions.helmetType
      );
      const glassesTypeName = headOptions.glassesType ? Object.keys(GlassesType).find(key =>
        GlassesType[key] === headOptions.glassesType
      ) : null;

      label.innerHTML = `<strong>${headTypeName}</strong><br>helmet:${helmetTypeName}${glassesTypeName ? '<br> glasses:' + glassesTypeName : ''
        }`;

      labelContainer.appendChild(label);

      // Update label position in animation loop
      const updateLabelPosition = () => {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(mesh.matrixWorld);
        vector.y += 200; // Position above the head

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

    camera.position.set(0, 1000, 8000);
    camera.lookAt(scene.position);
    animate();

    // Cleanup function
    return () => {
      labelContainer.remove();
    };
  },
};

export default HeadStory;
