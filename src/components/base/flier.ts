import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Weather from "../../elements/weather";
import Thermal from "../../components/thermal";
import GuiHelper from "../../utils/gui";
import { TrajectoryPoint, TrajectoryPointType } from "../../elements/trajectory";
import { getTerrainHeightBelowPosition } from "../../utils/collision";
import {
  FORWARD_DIRECTION,
  UP_DIRECTION,
  DOWN_DIRECTION,
} from "./../common";
import IFlyable from './IFlyable';

const ANTI_CRASH_ENABLED = false;
const TICK_INTERVAL = 25;

const getRotationValue = (wrapSpeed: number): number => {
  const multiplier = THREE.MathUtils.smoothstep(wrapSpeed, 1, 10);
  return Math.PI / (60 - 50 * multiplier);
};

export interface FlierConstructor {
  glidingRatio: number;
  trimSpeed: number;
  fullSpeedBarSpeed: number;
  bigEarsSpeed: number;
  flyable: IFlyable;
}

export interface EnvOptions {
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  perfStats?: any; //stats
}

class Flier extends THREE.EventDispatcher {
  options: FlierConstructor;
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  speedBar: boolean;
  ears: boolean;
  interval: number = null;
  mesh: THREE.Object3D;
  flyable: IFlyable;
  wrapSpeed: number = 1;
  flyingTime: number = 0;
  metersFlown: number = 0;
  isLeftInput: boolean;
  isRightInput: boolean;
  trajectory: TrajectoryPoint[] = [];
  tickCounter: number = 0;
  __rollAngleRadians: number = 0;
  __lift: number = 0;
  __gradient: number = 0;
  __directionInput: number = 0;
  lift: number = 0;
  rotationInertia = 0;
  debug: boolean;
  numberGroundTouches: number = 0;
  perfStats: any; // stats

  constructor(
    options: FlierConstructor,
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
    this.perfStats = envOptions.perfStats;
    this.mesh = options.flyable.getMesh();
    this.flyable = options.flyable;
  }

  isInsideThermal = (thermal: Thermal): boolean => {
    const pgBB = new THREE.Box3().setFromObject(this.mesh);
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

  getMesh(): THREE.Object3D {
    return this.mesh;
  }

  tick(multiplier: number) {
    this.tickCounter++;

    this.perfStats && this.perfStats.startTick("move");
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
          console.log("touched ground");
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
      if (this.isLeftInput) {
        this.rotationInertia -=
          turnMultiplier * keyBreakMultiplier * rotationSmoother;
      } else if (this.isRightInput) {
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
    this.perfStats && this.perfStats.endTick("move");
  }

  rotate(yRotationIncrement: number = 0, zAngle: number) {
    const maxAngle = 75;

    const yRotation =
      this.mesh.rotation.y +
      -1 * yRotationIncrement * getRotationValue(this.wrapSpeed);

    const validZAngle = THREE.MathUtils.clamp(zAngle, -1 * maxAngle, maxAngle);
    const zRotation = -1 * Math.abs(THREE.MathUtils.degToRad(validZAngle));

    const endRotation = new THREE.Euler(0, yRotation, zRotation);

    this.__rollAngleRadians = zRotation;

    this.mesh.rotation.copy(endRotation);
  }

  getMetersFlown(): number {
    return this.metersFlown;
  }

  getGroundSpeed(): number {
    const pgVelocity = this.direction().multiplyScalar(this.airSpeed());
    const windVelocity = this.weather.getWindVelocity();
    return pgVelocity.add(windVelocity).length();
  }

  private move(multiplier: number) {
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
    if (inHowManyThermals > 0) {
      console.log(inHowManyThermals, 'thermals')
    }
    const liftThermal = 2 * inHowManyThermals;
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

    const combinedMoveVector = new THREE.Vector3(0, 0, 0)
      .add(downVector)
      .add(liftVector)
      .add(liftThermalVector)
      .add(velocityVector)
      .add(windVector);

    const startPosition = this.position();
    const nextPosition = this.position().add(combinedMoveVector);
    const tween = new TWEEN.Tween(startPosition)
      .to(nextPosition, TICK_INTERVAL) // Set the duration of the animation to 1000 milliseconds (1 second)
      // .easing(TWEEN.Easing.Quadratic.InOut) // Set the easing function for the animation
      .onUpdate(() => {
        // Update the position of the object on each frame of the animation
        this.mesh.position.copy(startPosition);
      })
      .start(); // Start the animation

    this.dispatchEvent({ type: "position", position: this.mesh.position });

    const delta = combinedMoveVector.y / multiplier;
    this.dispatchEvent({
      type: "delta",
      delta,
    });
  }

  addGui(gui) {
    const pg = this.mesh;
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
    if (direction > 0) {
      this.flyable.right();
    } else if (direction < 0) {
      this.flyable.left();
    } else {
      this.flyable.rightRelease();
      this.flyable.leftRelease();
    }
  }

  leftInput() {
    console.log('left input');
    this.isLeftInput = true;
    this.flyable.left();
  }

  leftRelease() {
    console.log('leftrelease');
    this.isLeftInput = false;
    this.flyable.leftRelease();
  }

  rightInput() {
    console.log('right');
    this.isRightInput = true;
    this.flyable.right();
  }

  rightRelease() {
    console.log('rightrelease');
    this.isRightInput = false;
    this.flyable.rightRelease();
  }

  hasTouchedGround(terrain: THREE.Mesh, water: THREE.Mesh): boolean {
    const pos = this.mesh.position;
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
    const quaternion = this.mesh.getWorldQuaternion(new THREE.Quaternion());
    return localVector.clone().applyQuaternion(quaternion);
  }

  rotation(): THREE.Quaternion {
    return this.mesh.getWorldQuaternion(new THREE.Quaternion()).clone();
  }

  position(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  setPosition(pos: THREE.Vector3) {
    this.mesh.position.copy(pos);
  }

  altitude(): number {
    return this.mesh.position.y;
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
      console.log("speed bar off");
    } else {
      this.speedBar = true;
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

export default Flier;
