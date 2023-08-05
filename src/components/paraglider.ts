import * as THREE from "three";
import * as CANNON from "cannon-es";
import { IWorldEntity } from "../interfaces/IWorldEntity";
import World from "./world";
import Glider from "../models/threejs/parts/glider";
import Helpers from "../utils/helpers";
import { G } from "../utils/math";
import { threeQuat } from "../utils/conversions";

class Paraglider extends THREE.Object3D implements IWorldEntity {
  wingBody: CANNON.Body;
  pilotBody: CANNON.Body;
  modelContainer: THREE.Group;
  isLeftBreakEngaged: boolean;
  isRightBreakEngaged: boolean;

  constructor() {
    super();

    this.modelContainer = new THREE.Group();
    this.add(this.modelContainer);

    // wing
    const glider = new Glider();
    const wing = glider.createWing();
    wing.visible = false;
    this.modelContainer.add(wing);

    // Create a box for the wing
    const wingShape = new CANNON.Box(new CANNON.Vec3(1000, 100, 100));
    this.wingBody = new CANNON.Body({ mass: 20, shape: wingShape });
    this.wingBody.fixedRotation = true;
    this.wingBody.linearDamping = 0.1;
    this.wingBody.updateMassProperties();
    this.wingBody.position.set(0, 2400, 0);

    // Create a box for the pilot
    const pilotShape = new CANNON.Box(new CANNON.Vec3(20, 20, 20));
    this.pilotBody = new CANNON.Body({ mass: 80, shape: pilotShape });
    this.pilotBody.fixedRotation = true;
    this.pilotBody.linearDamping = 0.1;
    this.pilotBody.updateMassProperties();
    this.pilotBody.position.set(0, 2000, 0);

    document.addEventListener("keydown", this.onKeyDown, false);
    document.addEventListener("keyup", this.onKeyUp, false);
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "KeyA") {
      this.isLeftBreakEngaged = true;
    }
  };

  onKeyUp = (event: KeyboardEvent) => {
    if (event.code === "KeyA") {
      this.isLeftBreakEngaged = false;
    }
  };

  addToWorld(world: World) {
    world.addBody(this.wingBody);
    world.addBody(this.pilotBody);
    const constraint = new CANNON.DistanceConstraint(
      this.pilotBody,
      this.wingBody,
      900
    );
    world.addConstraint(constraint);
    world.addUpdatableEntity(this);
    // world.addGraphicsObject(this.modelContainer);
  }

  applyLift() {
    const quat = threeQuat(this.wingBody.quaternion);
    // const up = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);

    const weight = -G * (this.pilotBody.mass + this.wingBody.mass);
    const lift = weight / 1;
    const liftForce = new CANNON.Vec3(0, weight, 0);
    const liftForcePoint = this.wingBody.position;
    this.wingBody.applyForce(liftForce, liftForcePoint);
  }

  applyForces() {
    this.applyLift();

    // breaks
    if (this.isLeftBreakEngaged) {
      // const force = new CANNON.Vec3(1200, 10, 1000);
      // this.wingBody.angularVelocity.set(Math.PI / 20, 0, 0); // Rotate around Y axis at 360 degrees per second
      // const forcePoint = this.wingBody.position.clone();
      // this.wingBody.applyForce(force, forcePoint);
      const torque = new CANNON.Vec3(1000, 100, 1000); // Apply torque around the Y-axis
      this.wingBody.applyTorque(torque);
    }
  }

  update(): void {
    this.applyForces();
  }
}

export default Paraglider;
