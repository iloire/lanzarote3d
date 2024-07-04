import * as THREE from "three";
import Camera from "../components/camera";

const createVideo = (url) => {
  const video = document.createElement('video');
  video.src = url;
  video.loop = true;
  video.muted = true;
  video.autoplay = true;
  video.style.display = 'none'; // Hide the video element
  return video;
}

type VideoFrameOptions = {
  imgUrl: string;
  videoUrl: string;
  camera: Camera;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export default class VideoFrame {
  options: VideoFrameOptions;
  constructor(options: VideoFrameOptions) {
    this.options = options;

  }

  async load(gui?: any): Promise<THREE.Object3D> {
    const options = this.options;
    const video = createVideo(options.videoUrl);
    document.body.appendChild(video);

    const imageTexture = new THREE.TextureLoader().load(options.imgUrl);
    const videoTexture = new THREE.VideoTexture(video);

    // Create a basic material with the video texture
    const material = new THREE.MeshBasicMaterial({
      map: imageTexture,
      side: THREE.DoubleSide
    });

    // Create a plane geometry and apply the material
    const geometry = new THREE.PlaneGeometry(4, 3); // Adjust size as needed
    const plane = new THREE.Mesh(geometry, material);

    function onClick(event: MouseEvent) {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the raycaster with the camera and mouse position
      raycaster.setFromCamera(mouse, options.camera);

      // Calculate objects intersected by the ray
      const intersects = raycaster.intersectObject(plane);

      if (intersects.length > 0) {
        // Switch the texture to video and play the video
        material.map = videoTexture;
        video.play();
      }
    }

    window.addEventListener('click', onClick, false);
    return plane;
  }
}

