import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Models from "../utils/models";
import Weather from "../elements/weather";
import Thermal from "../components/thermal";
import ParagliderModel from "../components/paraglider";
import GuiHelper from "../utils/gui";
import { TrajectoryPoint, TrajectoryPointType } from "../elements/trajectory";

const ORIGIN = new THREE.Vector3(0, 0, 0);
const DOWN_DIRECTION = new THREE.Vector3(0, -1, 0);
const UP_DIRECTION = new THREE.Vector3(0, 1, 0);
const FORWARD_DIRECTION = new THREE.Vector3(1, 0, 0);
const ANTI_CRASH_ENABLED = true;

const TICK_INTERVAL = 25;

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
  const arrow = new THREE.ArrowHelper(UP_DIRECTION.clone(), ORIGIN, len, color);
  const axis = new THREE.Vector3(0, 0, 1);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const createTrajectoryArrow = (
  glidingRatio: number,
  len: number,
  color
): THREE.ArrowHelper => {
  const dir = new THREE.Vector3(1, 0, 0);
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, color);
  const axis = new THREE.Vector3(0, 0, 1);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const createGravityArrow = (mesh: THREE.Mesh, len: number) => {
  const dir = DOWN_DIRECTION.clone();
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, 0xff0000);
  return arrow;
};

const createDirectionArrow = (
  dir: THREE.Vector3,
  len: number,
  color
): THREE.ArrowHelper => {
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, color);
  return arrow;
};

const createCentripetalArrow = (
  mesh: THREE.Mesh,
  len: number,
  color
): THREE.ArrowHelper => {
  const dir = new THREE.Vector3(0, -1, 0);
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, color);
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
  rayVertical.firstHitOnly = true;
  if (pos.y < 0) {
    return NaN; // below water
  }
  const intersectsFloor = rayVertical.intersectObjects([terrain]);
  if (intersectsFloor.length === 1) {
    const height = intersectsFloor[0].point.y;
    if (height >= pos.y) {
      // terrain above pg, crash
      return NaN;
    } else {
      return height;
    }
  } else {
    return NaN;
  }
};

export interface ParagliderConstructor {
  glidingRatio: number;
  trimSpeed: number;
  fullSpeedBarSpeed: number;
  bigEarsSpeed: number;
}

export interface EnvOptions {
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  rs?: any; //stats
}

class Paraglider extends THREE.EventDispatcher {
  paragliderModel: ParagliderModel;
  options: ParagliderConstructor;
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  speedBar: boolean;
  ears: boolean;
  interval: number = null;
  model: THREE.Mesh;
  wrapSpeed: number = 1;
  flyingTime: number = 0;
  metersFlown: number = 0;
  isLeftBreaking: boolean;
  isRightBreaking: boolean;
  trajectory: TrajectoryPoint[] = [];
  tickCounter: number = 0;
  __rollAngle: number = 0;
  __lift: number = 0;
  __gradient: number = 0;
  __directionInput: number = 0;
  lift: number = 0;
  rotationInertia = 0;
  debug: boolean;
  numberGroundTouches: number = 0;
  rs: any; // stats

  constructor(
    options: ParagliderConstructor,
    envOptions: EnvOptions,
    debug?: boolean
  ) {
    super();
    this.debug = debug;
    this.speedBar = false;
    this.options = options;
    this.weather = envOptions.weather;
    this.terrain = envOptions.terrain;
    this.water = envOptions.water;
    this.thermals = envOptions.thermals;
    this.rs = envOptions.rs;
  }

  isInsideThermal = (thermal: Thermal): boolean => {
    const pgBB = new THREE.Box3().setFromObject(this.model);
    const thermalBB = new THREE.Box3().setFromObject(thermal.getMesh());
    const inTheTermal = thermalBB.containsBox(pgBB);
    return inTheTermal;
  };

  setFirstPersonView(isFirstPersonView: boolean) {
    this.paragliderModel.setFirstPersonView(isFirstPersonView);
  }

  countInsideHowManyThermals(): number {
    return this.thermals.filter(this.isInsideThermal).length;
  }

  isInsideAnyThermal(): boolean {
    return this.thermals.some(this.isInsideThermal);
  }

  updateWrapSpeed(value: number) {
    this.wrapSpeed = value;
  }

  async loadModel(scale: number, gui?: any): Promise<THREE.Object3D> {
    this.paragliderModel = new ParagliderModel();
    const mesh = await this.paragliderModel.load(gui);
    mesh.scale.set(scale, scale, scale);
    this.model = mesh;
    if (this.debug) {
      const arrowLen = 50;
      mesh.add(createCentripetalArrow(mesh, arrowLen, 0x0000ff));
      mesh.add(createDirectionArrow(this.direction(), arrowLen, 0x0000ff));
      mesh.add(createTrajectoryArrow(this.glidingRatio(), arrowLen, 0xff00ff));
      mesh.add(createLiftArrow(this.glidingRatio(), arrowLen, 0xffffff));
      mesh.add(createGravityArrow(mesh, arrowLen));
    }
    return mesh;
  }

  init() {
    if (this.interval === null) {
      this.interval = setInterval(
        () => this.tick((TICK_INTERVAL / 1000) * this.wrapSpeed),
        TICK_INTERVAL
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

    this.rs && this.rs("move").start();
    this.move(multiplier);

    if (this.tickCounter % 5 === 0) {
      // perf
      if (this.hasTouchedGround(this.terrain, this.water)) {
        this.numberGroundTouches++;
        this.dispatchEvent({
          type: "touchedGround",
          groundTouches: this.numberGroundTouches,
        });
        this.trajectory.push({
          type: TrajectoryPointType.TouchGround,
          vector: this.position(),
        }); // last point saved
        if (ANTI_CRASH_ENABLED) {
          this.model.position.y += 10;
        } else {
          this.dispatchEvent({
            type: "crashed",
          });
        }
      } else {
        this.lift = this.getLiftValue();
      }
    }
    this.flyingTime += multiplier;
    this.metersFlown += multiplier * this.getGroundSpeed();

    const rotationSmoother = 0.08;

    const keyBreakMultiplier = 15; // for A/D keys
    const passiveRecoveryMultiplier = 5;

    const turnMultiplier = THREE.MathUtils.clamp(multiplier, 0, 0.07);
    if (this.__directionInput === 0) {
      if (this.isLeftBreaking) {
        this.rotationInertia -=
          turnMultiplier * keyBreakMultiplier * rotationSmoother;
      } else if (this.isRightBreaking) {
        this.rotationInertia +=
          turnMultiplier * keyBreakMultiplier * rotationSmoother;
      } else if (Math.abs(this.rotationInertia) > 0) {
        // passive recovery of momentum
        this.rotationInertia -=
          passiveRecoveryMultiplier *
          turnMultiplier *
          (this.rotationInertia * rotationSmoother);
      }
    } else {
      // apply analogic input
      if (
        Math.sign(this.__directionInput) !== Math.sign(this.rotationInertia)
      ) {
        // break input against inertia. We may it a bit stronger input
        this.rotationInertia +=
          2 * turnMultiplier * this.__directionInput * rotationSmoother;
      } else {
        this.rotationInertia +=
          turnMultiplier * this.__directionInput * rotationSmoother;
      }
    }

    if (this.__directionInput > 0 || this.isRightBreaking) {
      this.paragliderModel.breakRight();
    } else if (this.__directionInput < 0 || this.isLeftBreaking) {
      this.paragliderModel.breakLeft();
    } else {
      this.paragliderModel.handsUp();
    }

    this.rotationInertia = THREE.MathUtils.clamp(this.rotationInertia, -50, 50);

    this.rotate(
      this.rotationInertia * rotationSmoother,
      this.rotationInertia * 1.3
    );

    if (this.tickCounter % 10 === 0) {
      //save point
      this.trajectory.push({
        type: this.speedBar
          ? TrajectoryPointType.SpeedBar
          : TrajectoryPointType.Normal,
        vector: this.position(),
      });
    }
    this.rs && this.rs("move").end();
  }

  rotate(yRotationIncrement: number = 0, zAngle: number) {
    const maxAngle = 75;
    const startRotation = this.model.rotation;

    const yRotation = (this.model.rotation.y +=
      -1 * yRotationIncrement * getRotationValue(this.wrapSpeed));

    const validZAngle = THREE.MathUtils.clamp(zAngle, -1 * maxAngle, maxAngle);
    const zRotation = -1 * Math.abs(THREE.MathUtils.degToRad(validZAngle));

    const endRotation = new THREE.Euler(0, yRotation, zRotation);
    this.__rollAngle = zRotation;

    this.model.rotation.copy(endRotation);
  }

  getMetersFlown(): number {
    return this.metersFlown;
  }

  getGroundSpeed(): number {
    const pgVelocity = this.direction().multiplyScalar(this.airSpeed());
    const windVelocity = this.weather.getWindVelocity();
    return pgVelocity.add(windVelocity).length();
  }

  move(multiplier: number) {
    const drop = this.airSpeed() / this.glidingRatio();
    const downVector = DOWN_DIRECTION.clone().multiplyScalar(multiplier * drop);
    this.dispatchEvent({
      type: "drop",
      drop,
    });

    const lift = this.lift;
    const liftVector = this.direction(UP_DIRECTION).multiplyScalar(
      multiplier * lift
    );
    this.dispatchEvent({
      type: "dynamicLift",
      lift,
    });

    const inHowManyThermals = this.countInsideHowManyThermals();
    const liftThermal = 2 * inHowManyThermals; // this.isInsideAnyThermal() ? 2 : 0;
    const liftThermalVector = UP_DIRECTION.clone().multiplyScalar(
      multiplier * liftThermal
    );
    this.dispatchEvent({
      type: "thermalLift",
      lift: liftThermal,
    });

    const velocityVector = this.direction().multiplyScalar(
      multiplier * this.airSpeed()
    );
    const windVector = this.weather.getWindVelocity(multiplier);

    // bit of randomness
    const timer = (Date.now() + Math.random() * 1000) * 0.001;
    const randomY = Math.sin(timer) * 0.1;
    const randomVector = new THREE.Vector3(0, randomY, 0);

    const combinedMoveVector = new THREE.Vector3(0, 0, 0)
      .add(downVector)
      .add(liftVector)
      .add(liftThermalVector)
      .add(velocityVector)
      .add(windVector);
    // .add(randomVector);

    const startPosition = this.position();
    const nextPosition = this.position().add(combinedMoveVector);
    const tween = new TWEEN.Tween(startPosition)
      .to(nextPosition, TICK_INTERVAL) // Set the duration of the animation to 1000 milliseconds (1 second)
      // .easing(TWEEN.Easing.Quadratic.InOut) // Set the easing function for the animation
      .onUpdate(() => {
        // Update the position of the object on each frame of the animation
        this.model.position.copy(startPosition);
      })
      .start(); // Start the animation

    this.dispatchEvent({ type: "position", position: this.model.position });

    const delta = combinedMoveVector.y / multiplier;
    this.dispatchEvent({
      type: "delta",
      delta,
    });
  }

  addGui(gui) {
    const pg = this.model;
    GuiHelper.addLocationGui(gui, "Paraglider", pg, {
      min: -20000,
      max: 20000,
    });

    const pgWindGui = gui.addFolder("Paraglider wing");
    pgWindGui
      .add(this.options, "trimSpeed", 20 / 3.6, 70 / 3.6)
      .name("trim speed")
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

    const pgPhysics = gui.addFolder("Paraglider physics");
    pgPhysics.add(this, "rotationInertia", -10, 10).name("inertia").listen();
    pgPhysics
      .add(this, "__directionInput", -50, 50)
      .name("directionInput")
      .listen();
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

  rightBreakInput() {
    this.isRightBreaking = true;
  }

  rightBreakRelease() {
    this.isRightBreaking = false;
  }

  hasTouchedGround(terrain: THREE.Mesh, water: THREE.Mesh): boolean {
    const pos = this.model.position;
    const terrainBelowHeight = getTerrainHeightBelowPosition(
      pos,
      terrain,
      water
    );
    const paragliderIsCloseEnoughToTerrain = pos.y - terrainBelowHeight < 20;
    return isNaN(terrainBelowHeight) || paragliderIsCloseEnoughToTerrain;
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
    const pos = this.position();
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

    const paragliderHeight = height;
    const pgHeightToTerrainHeightRatio =
      (paragliderHeight - height) / paragliderHeight;
    const heightLiftComponent =
      (1 - pgHeightToTerrainHeightRatio) * height * 0.002;
    const lift = heightLiftComponent * gradient;
    this.dispatchEvent({ type: "lift", lift });
    this.__lift = lift;
    return lift;
  }

  direction(localVector: THREE.Vector3 = FORWARD_DIRECTION): THREE.Vector3 {
    const quaternion = this.model.getWorldQuaternion(new THREE.Quaternion());
    return localVector.clone().applyQuaternion(quaternion);
  }

  rotation(): THREE.Quaternion {
    return this.model.getWorldQuaternion(new THREE.Quaternion()).clone();
  }

  position(): THREE.Vector3 {
    return this.model.position.clone();
  }

  getPilotPosition(): THREE.Vector3 {
    return this.position().add(this.paragliderModel.getPilotPosition());
  }

  setPosition(pos: THREE.Vector3) {
    this.model.position.copy(pos);
  }

  altitude(): number {
    return this.model.position.y;
  }

  toggleEars() {
    if (this.ears) {
      this.ears = false;
      console.log("ears off");
    } else {
      this.ears = true;
      console.log("ears on");
    }
  }

  toggleSpeedBar() {
    if (this.speedBar) {
      this.speedBar = false;
      this.paragliderModel.releaseSpeedBar();
      console.log("speed bar off");
    } else {
      this.speedBar = true;
      this.paragliderModel.speedBar();
      console.log("speed bar on");
    }
  }

  isOnSpeedBar(): boolean {
    return this.speedBar;
  }

  isOnEars(): boolean {
    return this.ears;
  }

  airSpeed(): number {
    let speed = this.options.trimSpeed;
    if (this.ears) {
      speed = speed * 0.8;
    }
    if (this.speedBar) {
      speed = speed * 1.2;
    }
    return speed;
  }

  trimSpeed(): number {
    return this.options.trimSpeed;
  }

  glidingRatio(): number {
    let ratio = this.options.glidingRatio;
    if (this.isOnSpeedBar()) {
      ratio = ratio * 0.8;
    }
    if (this.isOnEars()) {
      ratio = ratio * 0.8;
    }
    return ratio;
  }

  getFlyingTime(): number {
    return this.flyingTime;
  }

  getTrajectory(): TrajectoryPoint[] {
    return this.trajectory;
  }
}

export default Paraglider;