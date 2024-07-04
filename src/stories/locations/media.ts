import * as THREE from "three";
import { Media } from "./index";
import imageFile1 from "../../textures/h-map-lanzarote.png";
import videoFile1 from "../../video/video-devil1.mp4";

const media: Media[] = [
  {
    title: "Tenesar",
    position: new THREE.Vector3(-4827, 380, -855),
    imgUrl: imageFile1,
    videoUrl: videoFile1
  },
  {
    title: "Famara",
    position: new THREE.Vector3(6827, 880, -555), // pechos altos
    imgUrl: imageFile1,
    videoUrl: videoFile1
  },
  {
    title: "Mirador",
    position: new THREE.Vector3(15027, 580, -12555),
    imgUrl: imageFile1,
    videoUrl: videoFile1
  },
];

export default media;
