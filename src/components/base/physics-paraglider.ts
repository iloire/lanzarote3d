import * as CANNON from "cannon-es";
import GUI from 'lil-gui';
import * as THREE from "three";
import { TrajectoryPoint, TrajectoryPointType } from "../../elements/trajectory";
import Weather from "../../elements/weather";
import Thermal from "../thermal";
import { ForceVisualization } from "./physics-force-visualization";
import { addParagliderGui } from './physics-paraglider-gui';

const TICK_INTERVAL = 222; // 40 Hz update rate
const PHYSICS_TIMESTEP = 1 / 1600; // 60 Hz physics simulation

// Physics constants
const AIR_DENSITY = 1.225; // kg/m³
const DRAG_COEFFICIENT = 0.5;
const LIFT_COEFFICIENT = 1.2;
const WING_AREA = 25; // m²


// clamp values
const MAX_SPEED = 40;

export type ParaglierPart = {
  mesh: THREE.Object3D;
  weight: number;
  initialPosition: THREE.Vector3;
}

interface EnvOptions {
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  perfStats?: any;
  world: CANNON.World;
}

export interface PhysicsParagliderConstructor {
  world: CANNON.World;
  distanceWingPilot: number; // in meters

  glider: ParaglierPart;
  pilot: ParaglierPart;

  glidingRatio: number;
  trimSpeed: number;
  fullSpeedBarSpeed: number;
  bigEarsSpeed: number;
}

export interface PhysicsEnvOptions extends EnvOptions {
  world: CANNON.World;
}

export default class PhysicsFlier extends THREE.EventDispatcher {
  options: PhysicsParagliderConstructor;
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  world: CANNON.World;
  speedBar: boolean;
  ears: boolean;
  interval: number = null;
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
  perfStats: any;

  glider: ParaglierPart;
  pilot: ParaglierPart;

  // Physics bodies
  gliderBody: CANNON.Body;
  pilotBody: CANNON.Body;

  leftLineConstraint: CANNON.PointToPointConstraint;
  rightLineConstraint: CANNON.PointToPointConstraint;

  // Replace force visualization properties with single property
  public forceVisualization: ForceVisualization;

  // Turn control properties
  private turnStrength: number = 0.5; // 0 to 1, controls how sharp the turns are
  private isTurningLeft: boolean = false;
  private isTurningRight: boolean = false;

  constructor(
    options: PhysicsParagliderConstructor,
    envOptions: PhysicsEnvOptions,
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
    this.world = envOptions.world;

    this.glider = options.glider;
    this.pilot = options.pilot;

    this.setupPhysics();
    this.setupForceVisualization();
  }

  private setupPhysics() {
    // Create wing body (main paraglider wing)
    const wingShape = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
    this.gliderBody = new CANNON.Body({
      mass: this.options.glider.weight,
      shape: wingShape,
      material: new CANNON.Material('wing')
    });
    const gliderPos = this.glider.initialPosition;
    this.glider.mesh.position.copy(gliderPos);
    this.gliderBody.position.copy(gliderPos as any);

    // Create pilot body
    const pilotShape = new CANNON.Sphere(2);
    this.pilotBody = new CANNON.Body({
      mass: this.options.pilot.weight,
      shape: pilotShape,
      material: new CANNON.Material('pilot')
    });
    // Position pilot 
    this.pilot.mesh.position.copy(this.pilot.initialPosition as any);
    this.pilotBody.position.copy(this.pilot.initialPosition as any);

    // add bodies to world
    this.world.addBody(this.gliderBody);
    this.world.addBody(this.pilotBody);

    // Set initial velocity for stable flight
    this.gliderBody.velocity.set(-10, 0, -10); // Initial forward speed of 10 m/s
    this.pilotBody.velocity.set(-10, 0, -10); // Initial forward speed of 10 m/s

    // Create constraint between wing and pilot with reduced rotation
    const localLeftWingPoint = new CANNON.Vec3(-5, 0, 10);
    const localPilotPoint = new CANNON.Vec3(0, this.options.distanceWingPilot, 0);
    this.leftLineConstraint = new CANNON.PointToPointConstraint(
      this.gliderBody,
      localLeftWingPoint,
      this.pilotBody,
      localPilotPoint
    );

    // Create constraint between wing and pilot with reduced rotation
    const localRightWingPoint = new CANNON.Vec3(5, 0, 0);
    this.rightLineConstraint = new CANNON.PointToPointConstraint(
      this.gliderBody,
      localRightWingPoint,
      this.pilotBody,
      localPilotPoint
    );

    this.world.addConstraint(this.leftLineConstraint);
    this.world.addConstraint(this.rightLineConstraint);
    // Set up collision materials
    // const wingMaterial = new CANNON.Material('wing');
    // const pilotMaterial = new CANNON.Material('pilot');
    // const groundMaterial = new CANNON.Material('ground');

    // // Add contact materials with adjusted friction and restitution
    // const wingGroundContact = new CANNON.ContactMaterial(
    //   wingMaterial,
    //   groundMaterial,
    //   {
    //     friction: 0.5,
    //     restitution: 0.1
    //   }
    // );

    // const pilotGroundContact = new CANNON.ContactMaterial(
    //   pilotMaterial,
    //   groundMaterial,
    //   {
    //     friction: 0.7,
    //     restitution: 0.05
    //   }
    // );

    // this.world.addContactMaterial(wingGroundContact);
    // this.world.addContactMaterial(pilotGroundContact);
  }

  private setupForceVisualization() {
    this.forceVisualization = new ForceVisualization(this.options.glider.mesh.parent);

    // Ensure force visualization is visible by default
    this.forceVisualization.setVisible(true);

    // Log to confirm setup
    console.log("Force visualization setup complete");
  }

  private updateForceVisualization() {
    // Get positions for visualization
    const wingPos = new THREE.Vector3(
      this.gliderBody.position.x,
      this.gliderBody.position.y,
      this.gliderBody.position.z
    );
    const pilotPos = new THREE.Vector3(
      this.pilotBody.position.x,
      this.pilotBody.position.y,
      this.pilotBody.position.z
    );

    // Calculate forces with safety checks
    const velocity = this.gliderBody.velocity;
    const speed = velocity.length();

    // Get forces with error handling
    let liftForce, dragForce;
    try {
      liftForce = this.calculateLiftForce(speed);
      dragForce = this.calculateDragForce(speed);
    } catch (e) {
      console.error("Error calculating forces:", e);
      // Provide fallback forces
      liftForce = new CANNON.Vec3(0, 0.1, 0);
      dragForce = new CANNON.Vec3(0, 0, -0.1);
    }

    const windVelocity = this.weather.getWindVelocity();
    const windForce = new CANNON.Vec3(
      windVelocity.x * this.options.glider.weight * 0.3,
      windVelocity.y * this.options.glider.weight * 0.3,
      windVelocity.z * this.options.glider.weight * 0.3
    );

    // Create thermal force or null if not in thermal
    const thermalForce = this.isInsideAnyThermal()
      ? new CANNON.Vec3(0, this.options.glider.weight * 0.5, 0)
      : null;

    // Create gravity force
    const gravityForce = new CANNON.Vec3(0, -this.options.pilot.weight * 9.81, 0);

    // Log forces for debugging (with safety checks)
    console.log("Forces for visualization:", {
      lift: isNaN(liftForce.length()) ? "ERROR" : liftForce.length().toFixed(2),
      drag: isNaN(dragForce.length()) ? "ERROR" : dragForce.length().toFixed(2),
      wind: windForce.length().toFixed(2),
      thermal: thermalForce ? thermalForce.length().toFixed(2) : "null",
      gravity: gravityForce.length().toFixed(2),
      speed: speed.toFixed(2)
    });

    // Update visualization with current positions and forces
    this.forceVisualization.update(
      wingPos,
      pilotPos,
      liftForce,
      dragForce,
      windForce,
      thermalForce,
      gravityForce
    );
  }

  private applyForces() {
    // Get current velocity
    const velocity = this.gliderBody.velocity;
    const speed = velocity.length();

    console.log("velocity", velocity);
    console.log("speed", speed);

    // Calculate lift force with reduced magnitude
    const liftForce = this.calculateLiftForce(speed);
    console.log("liftForce", liftForce);

    // Apply lift at the center of the wing
    this.gliderBody.applyForce(liftForce, new CANNON.Vec3(0, 0, 0));

    // Calculate drag force with increased magnitude
    const dragForce = this.calculateDragForce(speed);
    console.log("dragForce", dragForce);
    // Apply drag at the center of the wing
    // this.gliderBody.applyForce(dragForce, new CANNON.Vec3(0, 0, 0));

    // Apply wind force with reduced magnitude


    // this.gliderBody.applyForce(windForce, new CANNON.Vec3(0, 0, 0));

    // Apply thermal forces if inside thermal with reduced magnitude
    if (this.isInsideAnyThermal()) {
      // Apply thermal force at the center of the wing
      // this.gliderBody.applyForce(thermalForce, new CANNON.Vec3(0, 0, 0));
    }

    // Apply gravity at the pilot's position (center of mass)
    const gravityForce = new CANNON.Vec3(0, -this.options.pilot.weight * 9.81, 0);
    this.pilotBody.applyForce(gravityForce, new CANNON.Vec3(0, 0, 0));
  }

  public calculateLiftForce(speed: number): CANNON.Vec3 {
    // Basic lift equation: L = 1/2 * ρ * v² * S * Cl
    // Check for valid speed to avoid NaN
    if (speed < 0.001) {
      // Return zero lift for very small speeds
      console.log("------> liftForce", 0);
      return new CANNON.Vec3(0, 0, 0);
    }

    const liftMagnitude = 0.04 * AIR_DENSITY * speed * speed * WING_AREA * LIFT_COEFFICIENT * 0.3; // Further reduced lift coefficient

    console.log("liftMagnitude", liftMagnitude, speed, LIFT_COEFFICIENT);

    // Apply lift in the direction perpendicular to the wing's orientation
    const wingNormal = new CANNON.Vec3(0, 1, 0);
    this.gliderBody.quaternion.vmult(wingNormal, wingNormal);

    // Check if wingNormal is valid (not zero length) to avoid NaN
    if (wingNormal.length() < 0.001) {
      console.log("------> wingNormal", wingNormal);
      return new CANNON.Vec3(0, 0.1, 0); // Default small lift if normal is invalid
    }

    return wingNormal.scale(liftMagnitude);
  }

  public calculateDragForce(speed: number): CANNON.Vec3 {
    // Basic drag equation: D = 1/2 * ρ * v² * S * Cd
    // Check for valid speed to avoid NaN
    if (speed < 0.001) {
      // Return zero drag for very small speeds
      return new CANNON.Vec3(0, 0, 0);
    }

    const dragMagnitude = 0.00005 * AIR_DENSITY * speed * speed * WING_AREA * DRAG_COEFFICIENT * 1.2; // Slightly reduced drag coefficient

    // Apply drag in the opposite direction of velocity
    const dragDirection = this.gliderBody.velocity.clone();

    // Check if velocity is valid (not zero length) to avoid NaN
    if (dragDirection.length() < 0.001) {
      return new CANNON.Vec3(0, 0, 0); // Zero drag if velocity is near zero
    }

    dragDirection.normalize();
    dragDirection.scale(-1, dragDirection);

    const dragForce = new CANNON.Vec3();
    dragDirection.scale(dragMagnitude, dragForce);

    // console.log("dragForce", dragForce);

    return dragForce;
  }

  public isInsideAnyThermal(): boolean {
    return this.thermals.some(thermal => {
      const thermalPos = thermal.getPosition();
      const thermalDims = thermal.getDimensions();
      const pgPos = this.position();

      // Check if point is within thermal cylinder
      const dx = pgPos.x - thermalPos.x;
      const dz = pgPos.z - thermalPos.z;
      const distFromCenter = Math.sqrt(dx * dx + dz * dz);

      // Interpolate radius based on height
      const heightRatio = (pgPos.y - thermalPos.y) / thermalDims.height;
      const radius = thermalDims.bottomRadius + (thermalDims.topRadius - thermalDims.bottomRadius) * heightRatio;

      return distFromCenter <= radius && pgPos.y >= thermalPos.y && pgPos.y <= thermalPos.y + thermalDims.height;
    });
  }


  position(): THREE.Vector3 {
    return new THREE.Vector3(this.gliderBody.position.x, this.gliderBody.position.y, this.gliderBody.position.z);
  }

  // private getLiftValue(): number {
  //   // Calculate lift based on wing orientation and velocity
  //   const velocity = this.gliderBody.velocity;
  //   const speed = velocity.length();
  //   const wingNormal = new THREE.Vector3(0, 1, 0);
  //   wingNormal.applyQuaternion(this.glider.rotation);

  //   // Calculate angle of attack
  //   const velocityNormalized = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
  //   const angleOfAttack = Math.acos(velocityNormalized.dot(wingNormal));

  //   // Lift increases with speed and angle of attack up to a point
  //   const liftValue = Math.min(speed * 0.1 * Math.sin(angleOfAttack), 1);
  //   console.log("liftValue", liftValue, speed, angleOfAttack);

  //   return liftValue;
  // }

  private getGroundSpeed(): number {
    // Calculate ground speed by projecting velocity onto the ground plane
    const velocity = this.gliderBody.velocity;
    const groundVelocity = new CANNON.Vec3(velocity.x, 0, velocity.z);
    return groundVelocity.length();
  }

  init() {
    // Start the physics simulation loop
    this.interval = window.setInterval(() => {
      this.tick(1);
    }, TICK_INTERVAL);
  }

  addGui(gui: GUI) {
    addParagliderGui(this, gui);
  }

  tick(multiplier: number) {
    this.tickCounter++;

    this.perfStats && this.perfStats.startTick("move");

    // Apply forces
    this.applyForces();

    // Update physics world
    this.world.step(PHYSICS_TIMESTEP * multiplier);

    // Update visual meshes position and rotation
    this.glider.mesh.position.copy(this.gliderBody.position as any);
    this.pilot.mesh.position.copy(this.pilotBody.position as any);

    // clamp speed
    const speed = this.gliderBody.velocity.length();
    if (speed > MAX_SPEED) {
      this.gliderBody.velocity.scale(MAX_SPEED / speed, this.gliderBody.velocity);
    }

    // Update force visualization
    this.updateForceVisualization();

    // if (this.tickCounter % 5 === 0) {
    //   if (this.hasTouchedGround(this.terrain, this.water)) {
    //     this.numberGroundTouches++;
    //     this.dispatchEvent({
    //       type: "touchedGround",
    //       groundTouches: this.numberGroundTouches,
    //     });
    //     this.trajectory.push({
    //       type: TrajectoryPointType.TouchGround,
    //       vector: this.position(),
    //     });
    //     if (ANTI_CRASH_ENABLED) {
    //       console.log("touched ground");
    //     } else {
    //       this.dispatchEvent({
    //         type: "crashed",
    //       });
    //     }
    //   } else {
    //     // this.lift = this.getLiftValue();
    //   }
    // }

    this.flyingTime += multiplier;
    this.metersFlown += multiplier * this.getGroundSpeed();

    // Handle rotation input with reduced sensitivity and turn strength
    const rotationSmoother = 0.02; // Reduced from 0.04
    const keyBreakMultiplier = 4; // Reduced from 8
    const passiveRecoveryMultiplier = 2; // Reduced from 3
    const turnMultiplier = THREE.MathUtils.clamp(multiplier * this.turnStrength, 0, 0.015); // Reduced from 0.035

    if (this.__directionInput === 0) {
      if (this.isTurningLeft) {
        this.rotationInertia -= turnMultiplier * keyBreakMultiplier * rotationSmoother;
      } else if (this.isTurningRight) {
        this.rotationInertia += turnMultiplier * keyBreakMultiplier * rotationSmoother;
      } else if (Math.abs(this.rotationInertia) > 0) {
        this.rotationInertia -= passiveRecoveryMultiplier * turnMultiplier * (this.rotationInertia * rotationSmoother);
      }
    } else {
      if (Math.sign(this.__directionInput) !== Math.sign(this.rotationInertia)) {
        this.rotationInertia += turnMultiplier * this.__directionInput * rotationSmoother;
      } else {
        this.rotationInertia += turnMultiplier * this.__directionInput * rotationSmoother;
      }
    }

    this.rotationInertia = THREE.MathUtils.clamp(this.rotationInertia, -15, 15); // Reduced from -25, 25

    // Apply rotation to physics body with reduced force
    // const rotationForce = new CANNON.Vec3(0, this.rotationInertia * rotationSmoother * 0.25, 0); // Reduced from 0.5
    // this.gliderBody.applyTorque(rotationForce);

    if (this.tickCounter % 10 === 0) {
      this.trajectory.push({
        type: this.speedBar ? TrajectoryPointType.SpeedBar : TrajectoryPointType.Normal,
        vector: this.position(),
      });
    }

    this.perfStats && this.perfStats.endTick("move");
  }

  /**
   * Apply a left turn to the paraglider
   * @param strength Optional strength of the turn (0 to 1)
   */
  turnLeft(strength: number = 0.5) {
    this.isTurningLeft = true;
    this.isTurningRight = false;
    this.turnStrength = THREE.MathUtils.clamp(strength, 0, 1);
    this.__directionInput = -1;
  }

  /**
   * Apply a right turn to the paraglider
   * @param strength Optional strength of the turn (0 to 1)
   */
  turnRight(strength: number = 0.5) {
    this.isTurningLeft = false;
    this.isTurningRight = true;
    this.turnStrength = THREE.MathUtils.clamp(strength, 0, 1);
    this.__directionInput = 1;
  }

  /**
   * Stop turning and level out the paraglider
   */
  stopTurn() {
    this.isTurningLeft = false;
    this.isTurningRight = false;
    this.turnStrength = 0;
    this.__directionInput = 0;
  }

  /**
   * Get the current turn state
   * @returns Object containing turn state information
   */
  getTurnState() {
    return {
      isTurningLeft: this.isTurningLeft,
      isTurningRight: this.isTurningRight,
      turnStrength: this.turnStrength,
      rotationInertia: this.rotationInertia
    };
  }
}

