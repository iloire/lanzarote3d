import * as THREE from "three";
import model from "../models/pubg_green_parachute2.glb";
import Models from "../utils/models";

const SHOW_ARROWS = false;

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
    if (SHOW_ARROWS) {
      pg.add(createTrajectoryArrow(this.options.glidingRatio, 30));
      pg.add(createLiftArrow(this.options.glidingRatio, 300));
      pg.add(this.getGravityHelper(300));
    }
    this.model = pg;
    this.scale = scale;
  }

  addGui(gui) {
    const pg = this.model;
    const pgGui = gui.addFolder("Paraglider position");
    pgGui.add(pg.position, "x", -10, 10).name("position.x").listen();
    pgGui.add(pg.position, "y", 0, 10).name("position.y").listen();
    pgGui.add(pg.position, "z", -10, 10).name("position.z").listen();

    const pgRotationGui = gui.addFolder("Paraglider rotation");
    pgRotationGui
      .add(pg.rotation, "x", -Math.PI, Math.PI)
      .name("rotation.x")
      .listen();
    pgRotationGui
      .add(pg.rotation, "y", -Math.PI, Math.PI)
      .name("rotation.y")
      .listen();
    pgRotationGui
      .add(pg.rotation, "z", -Math.PI, Math.PI)
      .name("rotation.z")
      .listen();

    const pgWindGui = gui.addFolder("Paraglider wing");
    pgWindGui
      .add(this.options, "trimSpeed", 20, 70)
      .name("trim speed")
      .listen();
    pgWindGui
      .add(this.options, "glidingRatio", 0, 20)
      .name("gliding ratio")
      .listen();
  }

  rotateLeft(rotationSensitivity) {
    this.model.rotation.y += Math.PI * rotationSensitivity;
  }

  rotateRight(rotationSensitivity) {
    this.model.rotation.y -= Math.PI * rotationSensitivity;
  }

  jump(terrain) {
    if (this.hasTouchedGround(terrain)) {
      this.model.position.y += 0.01;
    }
  }

  hasTouchedGround(terrain) {
    const pos = this.model.position;
    const rayVertical = new THREE.Raycaster(
      pos,
      new THREE.Vector3(0, -1, 0) // vertical
    );

    const intersectsFloor = rayVertical.intersectObject(terrain);
    if (intersectsFloor.length) {
      const terrainBelowHeight = intersectsFloor[0].point.y;
      return terrainBelowHeight <= 0;
    }
    return true;
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
