import * as THREE from "three";
import model from "../models/pubg_green_parachute2.glb";
import Models from "../utils/models";

const PG = {
  load: async (scale, pos, speed) => {
    return Models.load(model, scale, pos);
  },
};

function getAttackAngleRadians(glidingRatio) {
  return Math.atan(1 / glidingRatio);
}

const createLiftArrow = (glidingRatio, len, color) => {
  const dir = new THREE.Vector3(0, 1, 0);
  const arrow = new THREE.ArrowHelper(
    dir,
    { x: 0, y: 0, z: 0 },
    len || 2,
    color || 0xffffff
  );
  const axis = new THREE.Vector3(1, 0, 0);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const createTrajectoryArrow = (glidingRatio, len, color) => {
  const dir = new THREE.Vector3(0, 0, -1);
  const arrow = new THREE.ArrowHelper(
    dir,
    { x: 0, y: 0, z: 0 },
    len || 2,
    color || 0xffffff
  );
  const axis = new THREE.Vector3(1, 0, 0);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

class Paraglider {
  gravityDirection = new THREE.Vector3(0, -1, 0);

  constructor(options) {
    if (!options.glidingRatio) {
      throw new Error("missing glading ratio");
    }
    this.options = options;
  }

  async loadModel(scale, initialPosition) {
    const pg = await PG.load(scale, initialPosition);

    pg.add(createTrajectoryArrow(this.options.glidingRatio, 30));
    pg.add(createLiftArrow(this.options.glidingRatio, 300));
    pg.add(this.getGravityHelper(300));
    this.model = pg;
    this.scale = scale;
  }

  addGui(gui) {
    const pg = this.model;
    const pgGui = gui.addFolder("Paraglider");
    pgGui.add(pg.rotation, "x", -Math.PI, Math.PI).name("rotation.x");
    pgGui.add(pg.rotation, "y", -Math.PI, Math.PI).name("rotation.y");
    pgGui.add(pg.rotation, "z", -Math.PI, Math.PI).name("rotation.z");

    pgGui.add(pg.position, "x", -100, 100).name("position.x");
    pgGui.add(pg.position, "y", 0, 100).name("position.y");
    pgGui.add(pg.position, "z", -100, 100).name("position.z");

    pgGui.add(this.options, "kg", -100, 100).name("kg");
    pgGui.add(this.options, "area", -100, 100).name("area");
    return pgGui;
  }

  rotateLeft(rotationSensitivity) {
    this.model.rotation.y += Math.PI * rotationSensitivity;
  }

  rotateRight(rotationSensitivity) {
    this.model.rotation.y -= Math.PI * rotationSensitivity;
  }

  getGravityHelper(len, color) {
    const arrow = new THREE.ArrowHelper(
      this.gravityDirection,
      { x: 0, y: 0, z: 0 },
      len,
      color || 0xff0000
    );
    // arrow.up.set(0, 0, -1);
    return arrow;
  }

  position() {
    return this.model.position;
  }

  move() {
    const weightForceValue = settings.pgKg * G;
    const weightForce = this.gravityDirection.multiplyScalar(weightForceValue);
  }
}

export default Paraglider;
