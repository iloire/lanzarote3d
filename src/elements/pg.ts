import * as THREE from "three";
import model from "../models/pubg_green_parachute2.glb";
import Models from "../utils/models";
import MathUtils from "../utils/math.js";

const settings = { SHOW_ARROWS: true };
const ORIGIN = new THREE.Vector3(0, 0, 0);

function getAttackAngleRadians(glidingRatio) {
  return Math.atan(1 / glidingRatio);
}

const createLiftArrow = (
  glidingRatio: number,
  len: number,
  color
): THREE.ArrowHelper => {
  const dir = new THREE.Vector3(0, 1, 0);
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, color);
  const axis = new THREE.Vector3(1, 0, 0);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const createTrajectoryArrow = (
  glidingRatio: number,
  len: number,
  color
): THREE.ArrowHelper => {
  const dir = new THREE.Vector3(0, 0, -1);
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, color);
  const axis = new THREE.Vector3(1, 0, 0);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const getTerrainHeightBelowPosition = (
  pos: THREE.Vector3,
  terrain: THREE.Mesh
) => {
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

export interface ParagliderConstructor {
  glidingRatio: number;
  trimSpeed: number;
  halfSpeedBarSpeed: number;
  fullSpeedBarSpeed: number;
  smallEarsSpeed: number;
  bigEarsSpeed: number;
}

class Paraglider extends THREE.EventDispatcher {
  options: ParagliderConstructor;
  model: THREE.Mesh;
  gravityDirection = new THREE.Vector3(0, -1, 0);

  constructor(options: ParagliderConstructor) {
    super();
    if (!options.glidingRatio) {
      throw new Error("missing glading ratio");
    }
    this.options = options;
  }

  async loadModel(scale: number, initialPosition: THREE.Vector3) {
    const pg = await Models.load(model, scale, initialPosition);
    if (settings.SHOW_ARROWS) {
      const arrowLen = 700;
      pg.add(
        createTrajectoryArrow(this.options.glidingRatio, arrowLen, 0xff00ff)
      );
      pg.add(createLiftArrow(this.options.glidingRatio, arrowLen, 0xffffff));
      pg.add(this.getGravityHelper(arrowLen));
    }
    this.model = pg;
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

  rotateLeft(rotationSensitivity: number) {
    this.model.rotation.y += Math.PI * rotationSensitivity;
  }

  rotateRight(rotationSensitivity: number) {
    this.model.rotation.y -= Math.PI * rotationSensitivity;
  }

  jump(terrain: THREE.Mesh) {
    if (this.hasTouchedGround(terrain)) {
      this.model.position.y += 0.5;
    }
  }

  hasTouchedGround(terrain: THREE.Mesh): boolean {
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

  getTerrainGradientAgainstWindDirection(
    terrain: THREE.Mesh,
    windDirection: THREE.Vector3
  ): number {
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

  getLiftValue(terrain: THREE.Mesh, weather): number {
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
    const windSpeed = weather.windSpeed;
    const heightLiftComponent = height * 0.001;
    const l = heightLiftComponent * gradient;
    console.log("----------------------------");
    console.log("windspeed", windSpeed);
    console.log("heightLiftComponent", heightLiftComponent);
    console.log("gradient", gradient);
    console.log("height above ground for pos", height);
    console.log("l", l);
    console.log("----------------------------");
    return l;
  }

  getGravityHelper(len: number) {
    const arrow = new THREE.ArrowHelper(
      this.gravityDirection,
      ORIGIN,
      len,
      0xff0000
    );
    // arrow.up.set(0, 0, -1);
    return arrow;
  }

  direction(): THREE.Vector3 {
    const rotation = this.model.quaternion.clone();
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(rotation);
    return direction;
  }

  position(): THREE.Vector3 {
    return this.model.position;
  }

  altitude(): number {
    return this.model.position.y;
  }

  trimSpeed(): number {
    return this.options.trimSpeed;
  }

  glidingRatio(): number {
    return this.options.glidingRatio;
  }

  move(velocity: THREE.Vector3) {
    this.model.position.add(velocity);
    this.dispatchEvent({ type: "position", position: this.model.position });
  }
}

export default Paraglider;
