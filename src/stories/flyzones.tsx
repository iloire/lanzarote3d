import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import React from "react";
import { createRoot } from "react-dom/client";
import Camera, { CameraMode } from "../components/camera";
import locations from "./locations/lanzarote";
import media from "./locations/media";
import VideoFrame from "../components/video-frame";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Sky from "../components/sky";
const FlyZones = {
  load: async (
    camera: Camera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    sky: Sky,
    gui,
    controls: OrbitControls
  ) => {

    const navigateTo = (point: THREE.Vector3, lookAt: THREE.Vector3) => {
      camera.animateTo(point, lookAt, 1000, controls, () => {
        console.log("done");
      });
    };

    const rootElement = document.getElementById("legend-points");
    const root = createRoot(rootElement);
    const buttons = locations.map((location) => (
      <button key={location.title} onClick={() => navigateTo(location.lookFrom, location.lookAt)}>
        {location.title}
      </button>
    ));
    root.render(<div className="points">{buttons}</div>);

    const meshes = await Promise.all(media.map(async (media) => {
      const videoFrame = new VideoFrame({
        imgUrl: media.imgUrl,
        videoUrl: media.videoUrl,
        camera: camera
      });
      const mesh = await videoFrame.load();
      const scale = 300;
      mesh.scale.set(scale, scale, scale);
      mesh.position.copy(media.position);
      scene.add(mesh);
      return mesh;
    }));


    const initial = locations[0];
    navigateTo(initial.lookFrom, initial.lookAt);

    const animate = () => {
      TWEEN.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
      meshes.forEach((mesh) => {
        mesh.lookAt(camera.position)
      });
    };
    animate();
  },
};

export default FlyZones;
