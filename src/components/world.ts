import * as CANNON from "cannon-es";
import { IWorldEntity } from "../interfaces/IWorldEntity";
import CannonDebugger from "cannon-es-debugger";
import { G } from "../utils/math";

class World {
  physicsWorld: CANNON.World;
  graphicsWorld: THREE.Scene;
  updatableEntities: IWorldEntity[];
  cannonDebugger: any;
  renderer: THREE.WebGLRenderer;
  camera: any;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: any) {
    this.renderer = renderer;
    this.graphicsWorld = scene;
    this.camera = camera;
    this.physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, G, 0),
    });
    this.updatableEntities = [];
    this.cannonDebugger = CannonDebugger(scene, this.physicsWorld);
  }

  step() {
    this.physicsWorld.step(1 / 10);
    this.updatableEntities.forEach((entity) => {
      entity.update();
    });
    this.cannonDebugger.update();
    this.renderer.render(this.graphicsWorld, this.camera);
  }

  addConstraint(constraint: CANNON.Constraint) {
    this.physicsWorld.addConstraint(constraint);
  }

  addBody(body: CANNON.Body) {
    this.physicsWorld.addBody(body);
  }

  addGraphicsObject(object: THREE.Object3D) {
    this.graphicsWorld.add(object);
  }

  addUpdatableEntity(entity: IWorldEntity) {
    this.updatableEntities.push(entity);
  }
}

export default World;
