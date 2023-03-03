import * as THREE from "three";
import Models from "../utils/models";
import model from "../models/birds.glb";

class Bird {
  mesh: THREE.Mesh;
  async loadModel(scale: number): Promise<THREE.Mesh> {
    const mesh = await Models.load(model, scale);
    const animate = (mesh) => {
      const timer = (Date.now() + Math.random() * 1000) * 0.001;
      mesh.position.y = mesh.position.y + Math.sin(timer) * 1;
      mesh.position.x += 2;
      requestAnimationFrame(() => animate(mesh));
    };
    animate(mesh);
    this.mesh = mesh;
    return mesh;
  }
}

export default Bird;
