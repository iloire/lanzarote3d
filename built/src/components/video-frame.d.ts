import * as THREE from "three";
import Camera from "../components/camera";
type VideoFrameOptions = {
    imgUrl: string;
    videoUrl: string;
    camera: Camera;
};
export default class VideoFrame {
    options: VideoFrameOptions;
    constructor(options: VideoFrameOptions);
    load(gui?: any): Promise<THREE.Object3D>;
}
export {};
//# sourceMappingURL=video-frame.d.ts.map