import * as THREE from "three";
import model from "../models/pubg_green_parachute2.glb";
import Models from "../utils/models";
import MathUtils from "../utils/math.js";

const settings = { SHOW_ARROWS: true };

const PG = {
  load: async (scale, pos, speed) => {
    return Models.load(model, scale, pos);
  },
};

function getAttackAngleRadians(glidingRatio) {
  return Math.atan(1 / glidingRatio);
}

const createLiftArrow = (glidingRatio, len, color) => {
  console.log("---- ");
  console.log(glidingRatio);
  const dir = new THREE.Vector3(0, 1, 0);
  const arrow = new THREE.ArrowHelper(dir, { x: 0, y: 0, z: 0 }, len, color);
  const axis = new THREE.Vector3(1, 0, 0);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const createTrajectoryArrow = (glidingRatio, len, color) => {
  const dir = new THREE.Vector3(0, 0, -1);
  const arrow = new THREE.ArrowHelper(dir, { x: 0, y: 0, z: 0 }, len, color);
  const axis = new THREE.Vector3(1, 0, 0);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const getTerrainHeightBelowPosition = (pos, terrain) => {
  const rayVertical = new THREE.Raycaster(
    pos,
    new THREE.Vector3(0, -1, 0) // vertical
  );
  const intersectsFloor = rayVertical.intersectObject(terrain);
  if (intersectsFloor.length) {
    const terrainBelowHeight = intersectsFloor[0].point.y;
    return terrainBelowHeight;
  } else {
    return 0;
  }
};

class Paraglider extends THREE.EventDispatcher {
  gravityDirection = new THREE.Vector3(0, -1, 0);

  constructor(options) {
    super();
    if (!options.glidingRatio) {
      throw new Error("missing glading ratio");
    }
    this.options = options;
  }

  async loadModel(scale, initialPosition) {
    const pg = await PG.load(scale, initialPosition);
    if (settings.SHOW_ARROWS) {
      const arrowLen = 700;
      pg.add(
        createTrajectoryArrow(this.options.glidingRatio, arrowLen, 0xff00ff)
      );
      pg.add(createLiftArrow(this.options.glidingRatio, arrowLen, 0xffffff));
      pg.add(this.getGravityHelper(arrowLen));
    }
    this.model = pg;
    this.scale = scale;
  }

  addGui(gui) {
    const pg = this.model;
    const pgGui = gui.addFolder("Paraglider position");
    pgGui.add(pg.position, "x", -12000, 12000).name("position.x").listen();
    pgGui.add(pg.position, "y", 0, 1200).name("position.y").listen();
    pgGui.add(pg.position, "z", -12000, 12000).name("position.z").listen();
    pgGui.add(settings, "SHOW_ARROWS", true).name("forces").listen();

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
      .add(this.options, "halfSpeedBarSpeed", 0, 70)
      .name("half speed bar speed")
      .listen();
    pgWindGui
      .add(this.options, "fullSpeedBarSpeed", 0, 70)
      .name("full speedbar speed")
      .listen();
    pgWindGui
      .add(this.options, "glidingRatio", 1, 30)
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
      this.model.position.y += 0.5;
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

  getTerrainGradientAgainstWindDirection(terrain, windDirection) {
    // TODO use barlovento
    const delta = 50;
    const pos = this.position().clone();
    const posSotavento = pos.clone().addScaledVector(windDirection, delta);

    const heightPos = getTerrainHeightBelowPosition(pos, terrain);
    const heightPosBarlovento = getTerrainHeightBelowPosition(
      posSotavento,
      terrain
    );
    const gradient = (heightPosBarlovento - heightPos) / delta;
    return gradient;
  }

  getLiftValue(terrain, weather) {
    const pos = this.position().clone();
    const windDirection = MathUtils.getWindDirectionVector(
      weather.windDirectionDegreesFromNorth
    );
    const height = getTerrainHeightBelowPosition(pos, terrain);
    // console.log("----------------------------");
    const gradient = this.getTerrainGradientAgainstWindDirection(
      terrain,
      windDirection
    );
    // console.log("gradient", gradient);
    // console.log("height above ground for pos", height);
    // console.log("----------------------------");
    return THREE.MathUtils.smoothstep(height, 100, 1290) * gradient;
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

  altitude() {
    return this.model.position.y;
  }

  move(velocity) {
    this.model.position.add(velocity);
    this.dispatchEvent({ type: "position", position: this.model.position });
  }
}

export default Paraglider;
