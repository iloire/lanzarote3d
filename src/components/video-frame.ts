import * as THREE from "three";

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
}

export default class VideoFrame {
  options: VideoFrameOptions;
  constructor(options: VideoFrameOptions) {
    this.options = options;

  }
  async load(gui?: any): Promise<THREE.Object3D> {
    const video = createVideo(this.options.videoUrl);
    document.body.appendChild(video);

    const videoTexture = new THREE.VideoTexture(video);

    // Create a basic material with the video texture
    const material = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide
    });

    // Create a plane geometry and apply the material
    const geometry = new THREE.PlaneGeometry(4, 3); // Adjust size as needed
    const plane = new THREE.Mesh(geometry, material);
    return plane;
  }
}

