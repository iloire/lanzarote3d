import * as THREE from "three";
import model from "../models/pubg_green_parachute2.glb";
import Models from "../utils/models";
import Weather from "../elements/weather";
import Thermal from "../elements/thermal";

const settings = { SHOW_ARROWS: true };
const ORIGIN = new THREE.Vector3(0, 0, 0);

function getAttackAngleRadians(glidingRatio: number) {
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
  weather: Weather;
  terrain: THREE.Mesh;
  thermals: Thermal[];
  speedBar: boolean;
  currentSpeed: number;
  interval: any;
  model: THREE.Mesh;
  gravityDirection = new THREE.Vector3(0, -1, 0);

  constructor(
    options: ParagliderConstructor,
    weather: Weather,
    terrain: THREE.Mesh,
    thermals: Thermal[]
  ) {
    super();
    if (!options.glidingRatio) {
      throw new Error("missing glading ratio");
    }
    this.speedBar = false;
    this.currentSpeed = options.trimSpeed;
    this.options = options;
    this.weather = weather;
    this.terrain = terrain;
    this.thermals = thermals;
  }

  isInsideThermal(thermal: Thermal): boolean {
    const pgBB = new THREE.Box3().setFromObject(this.model);
    const thermalBB = new THREE.Box3().setFromObject(thermal.getMesh());
    const inTheTermal = thermalBB.containsBox(pgBB);
    // if (inTheTermal) {
    //   console.log("inside thernak");
    // } else {
    //   console.log("not inside thermal");
    // }
    return inTheTermal;
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
    this.interval = setInterval(() => this.tick(0.1), 100);
  }

  getMesh(): THREE.Mesh {
    return this.model;
  }

  tick(multiplier: number) {
    if (!this.hasTouchedGround(this.terrain)) {
      this.moveForward(multiplier);
      this.moveVertical(multiplier);
    }
    if (this.isInsideThermal(this.thermals[0])) {
      const liftDirection = new THREE.Vector3(0, 1, 0);
      const liftVector = liftDirection.multiplyScalar(multiplier * 2);
      this.move(liftVector);
    }
  }

  getGroundSpeed(): number {
    const pgVelocity = this.direction().multiplyScalar(this.speed());
    const windVelocity = this.weather.getWindVelocity();
    return pgVelocity.add(windVelocity).length();
  }

  moveForward(multiplier: number) {
    const velocity = this.direction().multiplyScalar(multiplier * this.speed());
    this.move(velocity);
    this.move(this.weather.getWindVelocity(multiplier));
  }

  moveVertical(multiplier: number) {
    const gravityDirection = new THREE.Vector3(0, -1, 0);
    const downSpeed =
      (multiplier * (this.speed() - this.weather.getSpeedMetresPerSecond())) /
      this.glidingRatio();
    const downVector = gravityDirection.multiplyScalar(downSpeed);
    this.move(downVector);

    const lift = this.getLiftValue(this.terrain);
    const liftDirection = new THREE.Vector3(0, 1, 0);
    const liftVector = liftDirection.multiplyScalar(multiplier * lift);
    this.move(liftVector);
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
      .add(this.options, "trimSpeed", 20 / 3.6, 70 / 3.6)
      .name("trim speed")
      .listen();
    pgWindGui
      .add(this.options, "halfSpeedBarSpeed", 0, 70 / 3.6)
      .name("half speed bar speed")
      .listen();
    pgWindGui
      .add(this.options, "fullSpeedBarSpeed", 0, 70 / 3.6)
      .name("full speedbar speed")
      .listen();
    pgWindGui
      .add(this.options, "glidingRatio", 1, 30 / 3.6)
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
    const pos = this.position();
    const posBarlovento = pos.clone().addScaledVector(windDirection, -delta);

    const heightPos = getTerrainHeightBelowPosition(pos, terrain);
    const heightPosBarlovento = getTerrainHeightBelowPosition(
      posBarlovento,
      terrain
    );
    // console.log("height", heightPos);
    // console.log("height barlo", heightPosBarlovento);
    const gradient = (heightPos - heightPosBarlovento) / delta;
    return gradient > 0 ? gradient : 0; // TODO
  }

  getLiftValue(terrain: THREE.Mesh): number {
    const pos = this.position().clone();
    const windDirection = this.weather.getWindDirection();
    const height = getTerrainHeightBelowPosition(pos, terrain);
    const gradient = this.getTerrainGradientAgainstWindDirection(
      terrain,
      windDirection
    );
    const windSpeed = this.weather.getSpeedMetresPerSecond();
    const heightLiftComponent = height * 0.001;
    const l = heightLiftComponent * gradient;
    // console.log("windspeed", windSpeed);
    // console.log("heightLiftComponent", heightLiftComponent);
    // console.log("gradient", gradient);
    // console.log("height above ground for pos", height);
    // console.log("liftvalue", l);
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

  toggleSpeedBar() {
    if (this.speedBar) {
      this.speedBar = false;
      this.currentSpeed = this.options.trimSpeed;
      console.log("speed bar off");
    } else {
      this.speedBar = true;
      this.currentSpeed = this.options.halfSpeedBarSpeed;
      console.log("speed bar on");
    }
  }

  isOnSpeedBar(): boolean {
    return this.speedBar;
  }

  speed(): number {
    return this.currentSpeed;
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
