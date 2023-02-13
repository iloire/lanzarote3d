import HG from "../elements/hg";
import PG from "../elements/pg";
import Balloon from "../elements/balloon";
import Navigation from "../utils/navigation";
import Controls from "../utils/controls.js";

const Balloons = {
  load: async (camera, scene, renderer) => {
    const controls = Controls.createControls(camera, renderer);
    const navigator = Navigation(camera, controls);

    // hang glider
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

    balloons;
    const balloonScale = 0.0005;
    const balloons = [
      {
        scale: balloonScale,
        location: { x: 0, y: 5, z: 10 },
        speed: { x: 0.0001, y: 0.0002, z: 0.00005 },
      },
      {
        scale: balloonScale * 1.2,
        location: { x: 10, y: 22, z: 5 },
        speed: { x: 0.0003, y: 0.0003, z: 0.0001 },
      },
      {
        scale: balloonScale * 1.4,
        location: { x: 7, y: 14, z: 10 },
        speed: { x: 0.0001, y: 0.0002, z: 0.0001 },
      },
      {
        scale: balloonScale * 1.8,
        location: { x: 12, y: 44, z: 14 },
        speed: { x: 0.0001, y: 0.0002, z: 0.0001 },
      },
      {
        scale: balloonScale * 2.2,
        location: { x: 17, y: 19, z: 20 },
        speed: { x: 0.0001, y: 0.0002, z: 0.0001 },
      },
    ];
    balloons.forEach(async (b) => {
      const balloon = await Balloon.load(b.scale, b.location, b.speed);
      scene.add(balloon);
    });
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      const timer = Date.now() * 0.0005;
      camera && (camera.position.y += Math.sin(timer) * 0.0003);
      renderer.render(scene, camera);
    };
    animate();
  },
};

export default Balloons;
