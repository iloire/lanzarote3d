import * as THREE from "three";
import Models from "../utils/models";
import model from "../models/adrianav2.obj";
import mtl from "../models/adrianav2.mtl";

class AdriPilot {
  async load(manager?: THREE.LoadingManager): Promise<THREE.Object3D> {
    const obj: any = await Models.loadObj(model, mtl);
    const scale = 100;
    obj.scale.x = scale;
    obj.scale.y = scale;
    obj.scale.z = scale;
    return obj;
  }
}

export default AdriPilot;
