import HG from "../elements/hg";
import PG from "../elements/pg";
import * as THREE from "three";

const HGStory = {
  load: async (camera, scene, renderer) => {
    const hg = await HG.load(0.008, { x: 0, y: 10, z: 10 });
    scene.add(hg);

    // paraglider
    const pgScale = 0.02;
    const pgs = [
      {
        scale: pgScale,
        location: { x: 45, y: 10, z: -40 },
        speed: { x: 0.0001, y: 0.0002, z: 0.00005 },
      },
      {
        scale: pgScale * 1.2,
        location: { x: 50, y: 16, z: -45 },
        speed: { x: 0.0003, y: 0.0003, z: 0.0001 },
      },
      {
        scale: pgScale * 1.4,
        location: { x: 55, y: 14, z: -57 },
        speed: { x: 0.0001, y: 0.0002, z: 0.0001 },
      },
      {
        scale: pgScale * 1.4,
        location: { x: 62, y: 13, z: -52 },
        speed: { x: 0.0001, y: 0.0002, z: 0.0001 },
      },
      {
        scale: pgScale * 1.4,
        location: { x: 55, y: 19, z: -53 },
        speed: { x: 0.0001, y: 0.0002, z: 0.0001 },
      },
    ];
    pgs.forEach(async (p) => {
      const pg = await PG.load(p.scale, p.location, p.speed);
      scene.add(pg);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      const cameraOffset = new THREE.Vector3(-4.0, 2, -4.0); // NOTE Constant offset between the camera and the target

      // NOTE Assuming the camera is direct child of the Scene
      const objectPosition = new THREE.Vector3();
      hg.getWorldPosition(objectPosition);

      camera.position.copy(objectPosition).add(cameraOffset);
      camera.lookAt(objectPosition);

      const timer = Date.now() * 0.0005;
      camera && (camera.position.y += Math.sin(timer) * 0.0003);
      renderer.render(scene, camera);
    };
    animate();
    console.log("Number of Triangles :", renderer.info.render.triangles);
  },
};

export default HGStory;
