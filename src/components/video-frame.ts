import * as THREE from "three";
import videoFile from "../video/video-devil1.mp4";


const createVideo = () => {
  const video = document.createElement('video');
  video.src = videoFile;
  video.loop = true;
  // video.muted = true;
  video.autoplay = true;
  video.style.display = 'none'; // Hide the video element
  return video;
}

export default class VideoFrame {
  async load(gui?: any): Promise<THREE.Object3D> {
    const video = createVideo();
    document.body.appendChild(video);

    const videoTexture = new THREE.VideoTexture(video);

    // Create a basic material with the video texture
    const material = new THREE.MeshBasicMaterial({ map: videoTexture });

    // Create a plane geometry and apply the material
    const geometry = new THREE.PlaneGeometry(4, 3); // Adjust size as needed
    const plane = new THREE.Mesh(geometry, material);
    return plane;
  }
}

