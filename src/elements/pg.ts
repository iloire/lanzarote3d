import * as THREE from "three";
import model from "../models/paraglider2.glb";
import Models from "../utils/models";
import Weather from "../elements/weather";
import Thermal from "../elements/thermal";

const settings = { SHOW_ARROWS: false };
const ORIGIN = new THREE.Vector3(0, 0, 0);

function getAttackAngleRadians(glidingRatio: number) {
  return Math.atan(1 / glidingRatio);
}

const getRotationValue = (wrapSpeed: number): number => {
  const multiplier = THREE.MathUtils.smoothstep(wrapSpeed, 1, 10);
  return Math.PI / (60 - 50 * multiplier);
};

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
  terrain: THREE.Mesh,
  water: THREE.Mesh
): number => {
  const rayVertical = new THREE.Raycaster(
    new THREE.Vector3(pos.x, 100000, pos.z), // big enough value for Y
    new THREE.Vector3(0, -1, 0) // vertical
  );
  const intersectsFloor = rayVertical.intersectObjects([terrain, water]);
  if (intersectsFloor.length === 2) {
    const yValues = intersectsFloor.map((obj) => obj.point.y);
    const max = Math.max(...yValues);
    if (max >= pos.y) {
      // terrain above pg, crash
      return NaN;
    } else {
      return max;
    }
  } else if (intersectsFloor.length === 1) {
    return intersectsFloor[0].point.y; // return water high
  } else {
    return NaN;
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
  water: THREE.Mesh;
  thermals: Thermal[];
  speedBar: boolean;
  currentSpeed: number;
  interval: number = null;
  model: THREE.Mesh;
  gravityDirection = new THREE.Vector3(0, -1, 0);
  wrapSpeed: number = 1;
  flyingTime: number = 0;
  metersFlown: number = 0;
  isLeftBreaking: boolean;
  isRightBreaking: boolean;
  trajectory: THREE.Vector3[] = [];
  tickCounter: number = 0;
  __rollAngle: number = 0;
  __lift: number = 0;
  __gradient: number = 0;
  __directionInput: number = 0;
  rotationInertia = 0;

  constructor(
    options: ParagliderConstructor,
    weather: Weather,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    thermals: Thermal[]
  ) {
    super();
    this.speedBar = false;
    this.currentSpeed = options.trimSpeed;
    this.options = options;
    this.weather = weather;
    this.terrain = terrain;
    this.water = water;
    this.thermals = thermals;
  }

  isInsideThermal = (thermal: Thermal): boolean => {
    const pgBB = new THREE.Box3().setFromObject(this.model);
    const thermalBB = new THREE.Box3().setFromObject(thermal.getMesh());
    const inTheTermal = thermalBB.containsBox(pgBB);
    return inTheTermal;
  };

  countInsideHowManyThermals(): number {
    return this.thermals.filter(this.isInsideThermal).length;
  }

  isInsideAnyThermal(): boolean {
    return this.thermals.some(this.isInsideThermal);
  }

  updateWrapSpeed(value: number) {
    this.wrapSpeed = value;
  }

  async loadModel(scale: number): Promise<THREE.Mesh> {
    const mesh = await Models.loadSimple(model);
    mesh.scale.set(scale, scale, scale);
    const mat001 = new THREE.MeshPhysicalMaterial();
    mat001.color = new THREE.Color("red");
    mat001.reflectivity = 1.0;
    mat001.roughness = 0.0;
    mat001.envMapIntensity = 1.0;
    mesh.material = mat001;
    if (settings.SHOW_ARROWS) {
      const arrowLen = 700;
      mesh.add(createTrajectoryArrow(this.glidingRatio(), arrowLen, 0xff00ff));
      mesh.add(createLiftArrow(this.glidingRatio(), arrowLen, 0xffffff));
      mesh.add(this.getGravityHelper(arrowLen));
    }
    this.model = mesh;
    return mesh;
  }

  init() {
    const interval = 25;
    if (this.interval === null) {
      this.interval = setInterval(
        () => this.tick((interval / 1000) * this.wrapSpeed),
        interval
      );
    }
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
  }

  isRunning() {
    return !!this.interval;
  }

  getMesh(): THREE.Mesh {
    return this.model;
  }

  tick(multiplier: number) {
    this.tickCounter++;
    if (!this.hasTouchedGround(this.terrain, this.water)) {
      this.moveForward(multiplier);
      this.moveVertical(multiplier);
    } else {
      this.trajectory.push(this.position()); // last point saved
      this.dispatchEvent({
        type: "touchedGround",
      });
    }
    this.flyingTime += multiplier;
    this.metersFlown += multiplier * this.getGroundSpeed();

    const smoother = 0.1;
    const keyBreakMultiplier = 15;
    const passiveRecoveryMultiplier = 4;

    const turnMultiplier = THREE.MathUtils.clamp(multiplier, 0, 0.07);
    if (this.__directionInput === 0) {
      if (this.isLeftBreaking) {
        this.rotationInertia -= turnMultiplier * keyBreakMultiplier * smoother;
      } else if (this.isRightBreaking) {
        this.rotationInertia += turnMultiplier * keyBreakMultiplier * smoother;
      } else if (Math.abs(this.rotationInertia) > 0) {
        // passive recovery of momentum
        this.rotationInertia -=
          passiveRecoveryMultiplier *
          turnMultiplier *
          (this.rotationInertia * smoother);
      }
    } else {
      // apply analogic input
      if (
        Math.sign(this.__directionInput) !== Math.sign(this.rotationInertia)
      ) {
        // break input against inertia. We may it a bit stronger input
        this.rotationInertia +=
          2 * turnMultiplier * this.__directionInput * smoother;
      } else {
        this.rotationInertia +=
          turnMultiplier * this.__directionInput * smoother;
      }
    }

    this.rotationInertia = THREE.MathUtils.clamp(this.rotationInertia, -50, 50);

    if (Math.abs(this.rotationInertia) > 0) {
      this.setRoll(this.rotationInertia * 1.3);
      this.rotate(this.rotationInertia * smoother);
    } else {
      this.setRoll(0);
    }

    if (this.tickCounter % 10 === 0) {
      //save point
      this.trajectory.push(this.position());
    }
  }

  setRoll(angle: number) {
    const maxAngle = 75;
    const validAngle = THREE.MathUtils.clamp(angle, -1 * maxAngle, maxAngle);
    const angleRadians = THREE.MathUtils.degToRad(validAngle);
    this.__rollAngle = angleRadians;
    this.model.rotation.z = -1 * angleRadians;
  }

  getMetersFlown(): number {
    return this.metersFlown;
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
    const drop = this.speed() / this.glidingRatio();
    const downVector = gravityDirection.multiplyScalar(multiplier * drop);
    this.move(downVector);
    this.dispatchEvent({
      type: "drop",
      drop,
    });
    const lift = this.getLiftValue();
    const liftDirection = new THREE.Vector3(0, 1, 0);
    const liftVector = liftDirection.multiplyScalar(multiplier * lift);
    this.dispatchEvent({
      type: "dynamicLift",
      lift,
    });
    this.move(liftVector);

    // roll sink
    if (this.__rollAngle !== 0) {
      const rollDrop = this.__rollAngle * 7;
      const sinkDirection = new THREE.Vector3(0, -1, 0);
      const sinkVector = sinkDirection.multiplyScalar(
        multiplier * Math.abs(rollDrop)
      );
      this.dispatchEvent({
        type: "rollDrop",
        drop: rollDrop,
      });
      this.move(sinkVector);
    }

    const inHowManyThermals = this.countInsideHowManyThermals();
    const liftThermal = 2 * inHowManyThermals; // this.isInsideAnyThermal() ? 2 : 0;

    const liftThermalDirection = new THREE.Vector3(0, 1, 0);
    const liftThermalVector = liftThermalDirection.multiplyScalar(
      multiplier * liftThermal
    );
    this.dispatchEvent({
      type: "thermalLift",
      lift: liftThermal,
    });
    this.move(liftThermalVector);

    this.dispatchEvent({
      type: "delta",
      delta: lift + liftThermal - drop,
    });
  }

  addGui(gui) {
    const pg = this.model;
    const pgGui = gui.addFolder("Paraglider position");
    pgGui.add(pg.position, "x", -22000, 22000).name("position.x").listen();
    pgGui.add(pg.position, "y", 0, 2800).name("position.y").listen();
    pgGui.add(pg.position, "z", -22000, 22000).name("position.z").listen();
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

    const pgEnv = gui.addFolder("Paraglider env");
    pgEnv.add(this, "__lift").name("lift").listen();
    pgEnv.add(this, "__gradient").name("gradient").listen();
  }

  directionInput(direction: number) {
    this.__directionInput = direction;
  }

  leftBreakInput() {
    this.isLeftBreaking = true;
  }

  leftBreakRelease() {
    this.isLeftBreaking = false;
  }

  rotate(value: number = 0) {
    this.model.rotation.y += -1 * value * getRotationValue(this.wrapSpeed);
  }

  // rotateLeft(strength: number = 1) {
  //   this.model.rotation.y += strength * getRotationValue(this.wrapSpeed);
  // }

  rightBreakInput() {
    this.isRightBreaking = true;
  }

  rightBreakRelease() {
    this.isRightBreaking = false;
  }

  // rotateRight(strength: number = 1) {
  //   this.model.rotation.y -= strength * getRotationValue(this.wrapSpeed);
  // }

  hasTouchedGround(terrain: THREE.Mesh, water: THREE.Mesh): boolean {
    const pos = this.model.position;
    const terrainBelowHeight = getTerrainHeightBelowPosition(
      pos,
      terrain,
      water
    );
    return isNaN(terrainBelowHeight);
  }

  getTerrainGradientAgainstWindDirection(
    terrain: THREE.Mesh,
    water: THREE.Mesh,
    windDirection: THREE.Vector3
  ): number {
    // TODO use barlovento
    const delta = 50;
    const pos = this.position();
    const heightPos = getTerrainHeightBelowPosition(pos, terrain, water);
    if (isNaN(heightPos)) {
      return 0;
    }
    const heightAboveGround = pos.y - heightPos;
    this.dispatchEvent({
      type: "heightAboveGround",
      height: heightAboveGround,
    });
    const posBarlovento = pos.clone().addScaledVector(windDirection, -delta);
    const heightPosBarlovento = getTerrainHeightBelowPosition(
      posBarlovento,
      terrain,
      water
    );
    const gradient = (heightPos - heightPosBarlovento) / delta;
    return gradient > 0 ? gradient : 0; // TODO
  }

  getLiftValue(): number {
    const pos = this.position().clone();
    const height = getTerrainHeightBelowPosition(pos, this.terrain, this.water);
    if (isNaN(height)) {
      return 0;
    }
    const gradient = this.getTerrainGradientAgainstWindDirection(
      this.terrain,
      this.water,
      this.weather.getWindDirection()
    );
    this.dispatchEvent({ type: "gradient", gradient });
    this.__gradient = gradient;

    const paragliderHeight = pos.y;
    const pgHeightToTerrainHeightRatio =
      (paragliderHeight - height) / paragliderHeight;
    // console.log("ratio:", pgHeightToTerrainHeightRatio);
    // console.log("height", height);
    // console.log("paragliderHeight", paragliderHeight);
    const heightLiftComponent =
      (1 - pgHeightToTerrainHeightRatio) * height * 0.001;
    // console.log("h:", heightLiftComponent);
    const lift = heightLiftComponent * gradient;
    this.dispatchEvent({ type: "lift", lift });
    this.__lift = lift;
    return lift;
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
    return direction.clone();
  }

  position(): THREE.Vector3 {
    return this.model.position.clone();
  }

  setPosition(pos: THREE.Vector3) {
    this.model.position.copy(pos);
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

  airSpeed(): number {
    return this.currentSpeed;
  }

  // deprecated, use airSpeed
  speed(): number {
    return this.currentSpeed;
  }

  trimSpeed(): number {
    return this.options.trimSpeed;
  }

  glidingRatio(): number {
    if (this.isOnSpeedBar()) {
      return this.options.glidingRatio * 0.8;
    } else {
      return this.options.glidingRatio;
    }
  }

  getFlyingTime(): number {
    return this.flyingTime;
  }

  move(velocity: THREE.Vector3) {
    this.model.position.add(velocity);
    this.dispatchEvent({ type: "position", position: this.model.position });
  }

  getTrajectory(): THREE.Vector3[] {
    return this.trajectory;
  }
}

export default Paraglider;
