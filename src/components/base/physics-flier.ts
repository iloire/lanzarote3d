import * as CANNON from "cannon-es";
import GUI from 'lil-gui';
import * as THREE from "three";
import Thermal from "../../components/thermal";
import { TrajectoryPoint, TrajectoryPointType } from "../../elements/trajectory";
import Weather from "../../elements/weather";
import { getTerrainHeightBelowPosition } from "../../utils/collision";
import IFlyable from './IFlyable';
import { ForceVisualization } from './force-visualization';

const ANTI_CRASH_ENABLED = false;
const TICK_INTERVAL = 25; // 40 Hz update rate
const PHYSICS_TIMESTEP = 1 / 60; // 60 Hz physics simulation

// Physics constants
const AIR_DENSITY = 1.225; // kg/m³
const DRAG_COEFFICIENT = 0.5;
const LIFT_COEFFICIENT = 1.2;
const WING_AREA = 25; // m²

// Force visualization constants

interface FlierConstructor {
  flyable: IFlyable;
  world: CANNON.World;
  glidingRatio: number;
  trimSpeed: number;
  fullSpeedBarSpeed: number;
  bigEarsSpeed: number;
}

interface EnvOptions {
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  perfStats?: any;
  world: CANNON.World;
}

export interface PhysicsFlierConstructor extends FlierConstructor {
  world: CANNON.World;
  pilotMesh: THREE.Object3D;
  wingMesh: THREE.Object3D;
  pilotWeight: number; // in kg
  wingWeight: number; // in kg
}

export interface PhysicsEnvOptions extends EnvOptions {
  world: CANNON.World;
}

class PhysicsFlier extends THREE.EventDispatcher {
  options: PhysicsFlierConstructor;
  weather: Weather;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  thermals: Thermal[];
  world: CANNON.World;
  speedBar: boolean;
  ears: boolean;
  interval: number = null;
  pilotMesh: THREE.Object3D;
  wingMesh: THREE.Object3D;
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
  perfStats: any;

  // Physics bodies
  wingBody: CANNON.Body;
  pilotBody: CANNON.Body;
  wingConstraint: CANNON.DistanceConstraint;

  // Replace force visualization properties with single property
  private forceVisualization: ForceVisualization;

  // Turn control properties
  private turnStrength: number = 0.5; // 0 to 1, controls how sharp the turns are
  private isTurningLeft: boolean = false;
  private isTurningRight: boolean = false;

  constructor(
    options: PhysicsFlierConstructor,
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
    this.pilotMesh = options.pilotMesh;
    this.wingMesh = options.wingMesh;
    this.flyable = options.flyable;

    this.setupPhysics();
    this.setupForceVisualization();
  }

  private setupPhysics() {
    // Create wing body (main paraglider wing)
    const wingShape = new CANNON.Box(new CANNON.Vec3(20, 1, 20));
    this.wingBody = new CANNON.Body({
      mass: this.options.wingWeight,
      shape: wingShape,
      material: new CANNON.Material('wing')
    });
    this.wingBody.position.copy(this.wingMesh.position as any);
    this.wingBody.quaternion.copy(this.wingMesh.quaternion as any);

    // Set initial velocity for stable flight
    this.wingBody.velocity.set(0, 0, -10); // Initial forward speed of 10 m/s

    // Create pilot body
    const pilotShape = new CANNON.Sphere(2);
    this.pilotBody = new CANNON.Body({
      mass: this.options.pilotWeight,
      shape: pilotShape,
      material: new CANNON.Material('pilot')
    });

    // Position pilot 
    this.pilotBody.position.copy(this.pilotMesh.position as any);

    // Create constraint between wing and pilot with reduced rotation
    this.wingConstraint = new CANNON.DistanceConstraint(
      this.wingBody,
      this.pilotBody,
      6
    );

    // Add bodies and constraints to world
    this.world.addBody(this.wingBody);
    // this.world.addBody(this.pilotBody);
    // this.world.addConstraint(this.wingConstraint);

    // Set up collision materials
    const wingMaterial = new CANNON.Material('wing');
    const pilotMaterial = new CANNON.Material('pilot');
    const groundMaterial = new CANNON.Material('ground');

    // Add contact materials with adjusted friction and restitution
    const wingGroundContact = new CANNON.ContactMaterial(
      wingMaterial,
      groundMaterial,
      {
        friction: 0.5,
        restitution: 0.1
      }
    );

    const pilotGroundContact = new CANNON.ContactMaterial(
      pilotMaterial,
      groundMaterial,
      {
        friction: 0.7,
        restitution: 0.05
      }
    );

    this.world.addContactMaterial(wingGroundContact);
    this.world.addContactMaterial(pilotGroundContact);
  }

  private setupForceVisualization() {
    // Create force visualization with wing mesh as parent
    if (this.wingMesh.parent) {
      this.forceVisualization = new ForceVisualization(this.wingMesh.parent);
    } else {
      console.warn('Wing mesh has no parent, force visualization may not be visible');
    }
  }

  private updateForceVisualization() {
    const wingPos = new THREE.Vector3(
      this.wingBody.position.x,
      this.wingBody.position.y,
      this.wingBody.position.z
    );
    const pilotPos = new THREE.Vector3(
      this.pilotBody.position.x,
      this.pilotBody.position.y,
      this.pilotBody.position.z
    );

    // Calculate forces
    const liftForce = this.calculateLiftForce(this.wingBody.velocity.length());
    const dragForce = this.calculateDragForce(this.wingBody.velocity.length());
    const windVelocity = this.weather.getWindVelocity();
    const windForce = new CANNON.Vec3(
      windVelocity.x * this.options.wingWeight * 0.3,
      windVelocity.y * this.options.wingWeight * 0.3,
      windVelocity.z * this.options.wingWeight * 0.3
    );
    const thermalForce = this.isInsideAnyThermal() ? new CANNON.Vec3(0, this.options.wingWeight * 0.5, 0) : null;
    const gravityForce = new CANNON.Vec3(0, -this.options.pilotWeight * 9.81, 0);

    // Update force visualization
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
    const velocity = this.wingBody.velocity;
    const speed = velocity.length();

    // Calculate lift force with reduced magnitude
    const liftForce = this.calculateLiftForce(speed);
    // Apply lift at the center of the wing

    console.log("liftForce", liftForce);

    this.wingBody.applyForce(liftForce, new CANNON.Vec3(0, 0, 0));

    // Calculate drag force with increased magnitude
    const dragForce = this.calculateDragForce(speed);
    // Apply drag at the center of the wing
    this.wingBody.applyForce(dragForce, new CANNON.Vec3(0, 0, 0));

    // Apply wind force with reduced magnitude
    const windVelocity = this.weather.getWindVelocity();
    const windForce = new CANNON.Vec3(
      windVelocity.x * this.options.wingWeight * 0.3,
      windVelocity.y * this.options.wingWeight * 0.3,
      windVelocity.z * this.options.wingWeight * 0.3
    );
    // Apply wind force at the center of the wing
    console.log("windForce", windForce);

    this.wingBody.applyForce(windForce, new CANNON.Vec3(0, 0, 0));

    // Apply thermal forces if inside thermal with reduced magnitude
    if (this.isInsideAnyThermal()) {
      const thermalForce = new CANNON.Vec3(0, this.options.wingWeight * 0.5, 0);
      // Apply thermal force at the center of the wing
      this.wingBody.applyForce(thermalForce, new CANNON.Vec3(0, 0, 0));
    }

    // Apply gravity at the pilot's position (center of mass)
    const gravityForce = new CANNON.Vec3(0, -this.options.pilotWeight * 9.81, 0);
    this.pilotBody.applyForce(gravityForce, new CANNON.Vec3(0, 0, 0));
  }

  private calculateLiftForce(speed: number): CANNON.Vec3 {
    // Basic lift equation: L = 1/2 * ρ * v² * S * Cl
    const liftMagnitude = 0.5 * AIR_DENSITY * speed * speed * WING_AREA * LIFT_COEFFICIENT * 0.3; // Further reduced lift coefficient

    console.log("liftMagnitude", liftMagnitude);

    // Apply lift in the direction perpendicular to the wing's orientation
    const wingNormal = new CANNON.Vec3(0, 1, 0);
    this.wingBody.quaternion.vmult(wingNormal, wingNormal);

    return wingNormal.scale(liftMagnitude);
  }

  private calculateDragForce(speed: number): CANNON.Vec3 {
    // Basic drag equation: D = 1/2 * ρ * v² * S * Cd
    const dragMagnitude = 0.5 * AIR_DENSITY * speed * speed * WING_AREA * DRAG_COEFFICIENT * 1.2; // Slightly reduced drag coefficient

    // Apply drag in the opposite direction of velocity
    const dragDirection = this.wingBody.velocity.clone();
    dragDirection.normalize();
    dragDirection.scale(-1, dragDirection);

    const dragForce = new CANNON.Vec3();
    dragDirection.scale(dragMagnitude, dragForce);

    return dragForce;
  }

  private isInsideAnyThermal(): boolean {
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

  private hasTouchedGround(terrain: THREE.Mesh, water: THREE.Mesh): boolean {
    const position = this.position();
    const terrainHeight = getTerrainHeightBelowPosition(position, terrain, water);
    return position.y <= terrainHeight;
  }

  position(): THREE.Vector3 {
    return this.wingMesh.position;
  }

  private getLiftValue(): number {
    // Calculate lift based on wing orientation and velocity
    const velocity = this.wingBody.velocity;
    const speed = velocity.length();
    const wingNormal = new THREE.Vector3(0, 1, 0);
    wingNormal.applyQuaternion(this.wingMesh.quaternion);

    // Calculate angle of attack
    const velocityNormalized = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
    const angleOfAttack = Math.acos(velocityNormalized.dot(wingNormal));

    // Lift increases with speed and angle of attack up to a point
    const liftValue = Math.min(speed * 0.1 * Math.sin(angleOfAttack), 1);

    return liftValue;
  }

  private getGroundSpeed(): number {
    // Calculate ground speed by projecting velocity onto the ground plane
    const velocity = this.wingBody.velocity;
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
    const folder = gui.addFolder('Physics Flier');

    // Add controls for physics parameters
    folder.add({ liftCoefficient: LIFT_COEFFICIENT }, 'liftCoefficient', 0, 2, 0.1)
      .onChange((value: number) => {
        this.__lift = value;
      });

    folder.add({ dragCoefficient: DRAG_COEFFICIENT }, 'dragCoefficient', 0, 1, 0.1)
      .onChange((value: number) => {
        this.__gradient = value;
      });

    // Add force visualization toggle
    const forceVisController = {
      showForces: this.forceVisualization.isVisible(),
      setShowForces: (value: boolean) => {
        this.forceVisualization.setVisible(value);
      }
    };
    folder.add(forceVisController, 'showForces')
      .onChange((value: boolean) => forceVisController.setShowForces(value))
      .name('Show Forces');

    // Add debug controls
    if (this.debug) {
      folder.add(this, 'speedBar').name('Speed Bar');
      folder.add(this, 'ears').name('Big Ears');
      folder.add(this, 'rotationInertia', -25, 25).name('Rotation Inertia');
    }
  }

  tick(multiplier: number) {
    this.tickCounter++;

    this.perfStats && this.perfStats.startTick("move");

    // Apply forces
    this.applyForces();

    // Update physics world
    this.world.step(PHYSICS_TIMESTEP * multiplier);

    // Update visual meshes position and rotation
    this.wingMesh.position.copy(this.wingBody.position as any);
    this.wingMesh.quaternion.copy(this.wingBody.quaternion as any);
    this.pilotMesh.position.copy(this.pilotBody.position as any);
    this.pilotMesh.quaternion.copy(this.pilotBody.quaternion as any);

    // Update force visualization
    this.updateForceVisualization();

    if (this.tickCounter % 5 === 0) {
      if (this.hasTouchedGround(this.terrain, this.water)) {
        this.numberGroundTouches++;
        this.dispatchEvent({
          type: "touchedGround",
          groundTouches: this.numberGroundTouches,
        });
        this.trajectory.push({
          type: TrajectoryPointType.TouchGround,
          vector: this.position(),
        });
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
    const rotationForce = new CANNON.Vec3(0, this.rotationInertia * rotationSmoother * 0.25, 0); // Reduced from 0.5
    this.wingBody.applyTorque(rotationForce);

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

export default PhysicsFlier;

