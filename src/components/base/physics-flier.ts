import * as CANNON from "cannon-es";
import * as THREE from "three";
import Thermal from "../../components/thermal";
import { TrajectoryPoint, TrajectoryPointType } from "../../elements/trajectory";
import Weather from "../../elements/weather";
import { getTerrainHeightBelowPosition } from "../../utils/collision";
import IFlyable from './IFlyable';

const ANTI_CRASH_ENABLED = false;
const TICK_INTERVAL = 25; // 40 Hz update rate
const PHYSICS_TIMESTEP = 1 / 60; // 60 Hz physics simulation

// Physics constants
const AIR_DENSITY = 1.225; // kg/m³
const DRAG_COEFFICIENT = 0.5;
const LIFT_COEFFICIENT = 1.2;
const WING_AREA = 25; // m²
const MASS = 80; // kg (pilot + equipment)

// Force visualization constants
const FORCE_SCALE = 0.1; // Scale factor for force visualization

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
  perfStats: any;

  // Physics bodies
  body: CANNON.Body;
  wingBody: CANNON.Body;
  pilotBody: CANNON.Body;
  wingConstraint: CANNON.HingeConstraint;
  pilotConstraint: CANNON.LockConstraint;

  // Force visualization lines
  private liftLine: THREE.Line;
  private dragLine: THREE.Line;
  private windLine: THREE.Line;
  private thermalLine: THREE.Line;
  private liftLine2: THREE.Line;
  private dragLine2: THREE.Line;
  private windLine2: THREE.Line;
  private thermalLine2: THREE.Line;
  private forceGroup: THREE.Group;

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
    this.mesh = options.flyable.getMesh();
    this.flyable = options.flyable;

    this.setupPhysics();
    this.setupForceVisualization();
  }

  private setupPhysics() {
    // Create wing body (main paraglider wing)
    const wingShape = new CANNON.Box(new CANNON.Vec3(2, 0.1, 2));
    this.wingBody = new CANNON.Body({
      mass: MASS * 0.7,
      shape: wingShape,
      material: new CANNON.Material('wing')
    });
    this.wingBody.position.copy(this.mesh.position as any);
    this.wingBody.quaternion.copy(this.mesh.quaternion as any);

    // Set initial velocity for stable flight
    this.wingBody.velocity.set(0, 0, -10); // Initial forward speed of 10 m/s

    // Create pilot body
    const pilotShape = new CANNON.Sphere(0.5);
    this.pilotBody = new CANNON.Body({
      mass: MASS * 0.3,
      shape: pilotShape,
      material: new CANNON.Material('pilot')
    });
    // Position pilot closer to wing initially
    this.pilotBody.position.copy(this.mesh.position.clone().add(new THREE.Vector3(0, -1, 0)) as any);

    // Create hinge constraint between wing and pilot with reduced rotation
    this.wingConstraint = new CANNON.HingeConstraint(
      this.wingBody,
      this.pilotBody,
      {
        pivotA: new CANNON.Vec3(0, 0, 0),
        pivotB: new CANNON.Vec3(0, 1, 0),
        axisA: new CANNON.Vec3(1, 0, 0),
        axisB: new CANNON.Vec3(1, 0, 0),
        maxForce: 1e6
      }
    );

    // Add bodies and constraints to world
    this.world.addBody(this.wingBody);
    this.world.addBody(this.pilotBody);
    this.world.addConstraint(this.wingConstraint);

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
    // Create a group to hold all force visualization lines
    this.forceGroup = new THREE.Group();
    this.mesh.parent?.add(this.forceGroup);

    // Create materials for different forces with increased line width and opacity
    const liftMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 5,
      opacity: 0.8,
      transparent: true
    });
    const dragMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 5,
      opacity: 0.8,
      transparent: true
    });
    const windMaterial = new THREE.LineBasicMaterial({
      color: 0x0000ff,
      linewidth: 5,
      opacity: 0.8,
      transparent: true
    });
    const thermalMaterial = new THREE.LineBasicMaterial({
      color: 0xff00ff,
      linewidth: 5,
      opacity: 0.8,
      transparent: true
    });

    // Create geometries for force lines with initial positions
    const initialPositions = new Float32Array([
      0, 0, 0,  // Start point
      0, 1, 0   // End point
    ]);

    // Create main lines
    const liftGeometry = new THREE.BufferGeometry();
    const dragGeometry = new THREE.BufferGeometry();
    const windGeometry = new THREE.BufferGeometry();
    const thermalGeometry = new THREE.BufferGeometry();

    // Set initial positions for all geometries
    liftGeometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    dragGeometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    windGeometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    thermalGeometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));

    // Create main lines
    this.liftLine = new THREE.Line(liftGeometry, liftMaterial);
    this.dragLine = new THREE.Line(dragGeometry, dragMaterial);
    this.windLine = new THREE.Line(windGeometry, windMaterial);
    this.thermalLine = new THREE.Line(thermalGeometry, thermalMaterial);

    // Create offset lines for thickness
    const offset = 0.1; // Offset for the second line
    const liftGeometry2 = new THREE.BufferGeometry();
    const dragGeometry2 = new THREE.BufferGeometry();
    const windGeometry2 = new THREE.BufferGeometry();
    const thermalGeometry2 = new THREE.BufferGeometry();

    const initialPositions2 = new Float32Array([
      offset, 0, 0,  // Start point with offset
      offset, 1, 0   // End point with offset
    ]);

    liftGeometry2.setAttribute('position', new THREE.BufferAttribute(initialPositions2, 3));
    dragGeometry2.setAttribute('position', new THREE.BufferAttribute(initialPositions2, 3));
    windGeometry2.setAttribute('position', new THREE.BufferAttribute(initialPositions2, 3));
    thermalGeometry2.setAttribute('position', new THREE.BufferAttribute(initialPositions2, 3));

    // Create offset lines
    this.liftLine2 = new THREE.Line(liftGeometry2, liftMaterial);
    this.dragLine2 = new THREE.Line(dragGeometry2, dragMaterial);
    this.windLine2 = new THREE.Line(windGeometry2, windMaterial);
    this.thermalLine2 = new THREE.Line(thermalGeometry2, thermalMaterial);

    // Add all lines to group
    this.forceGroup.add(this.liftLine);
    this.forceGroup.add(this.liftLine2);
    this.forceGroup.add(this.dragLine);
    this.forceGroup.add(this.dragLine2);
    this.forceGroup.add(this.windLine);
    this.forceGroup.add(this.windLine2);
    this.forceGroup.add(this.thermalLine);
    this.forceGroup.add(this.thermalLine2);

    // Set initial visibility to true by default
    this.forceGroup.visible = true;
  }

  private updateForceVisualization() {
    const position = this.mesh.position;
    const wingPos = new THREE.Vector3(position.x, position.y, position.z);
    const offset = 0.1; // Offset for the second line

    // Update lift force visualization with increased scale
    const liftForce = this.calculateLiftForce(this.wingBody.velocity.length());
    const liftEnd = new THREE.Vector3(
      wingPos.x + liftForce.x * FORCE_SCALE * 2,
      wingPos.y + liftForce.y * FORCE_SCALE * 2,
      wingPos.z + liftForce.z * FORCE_SCALE * 2
    );
    const liftEnd2 = new THREE.Vector3(
      wingPos.x + liftForce.x * FORCE_SCALE * 2 + offset,
      wingPos.y + liftForce.y * FORCE_SCALE * 2,
      wingPos.z + liftForce.z * FORCE_SCALE * 2
    );

    const liftPositions = new Float32Array([
      wingPos.x, wingPos.y, wingPos.z,
      liftEnd.x, liftEnd.y, liftEnd.z
    ]);
    const liftPositions2 = new Float32Array([
      wingPos.x + offset, wingPos.y, wingPos.z,
      liftEnd2.x, liftEnd2.y, liftEnd2.z
    ]);

    this.liftLine.geometry.setAttribute('position', new THREE.BufferAttribute(liftPositions, 3));
    this.liftLine2.geometry.setAttribute('position', new THREE.BufferAttribute(liftPositions2, 3));

    // Update drag force visualization
    const dragForce = this.calculateDragForce(this.wingBody.velocity.length());
    const dragEnd = new THREE.Vector3(
      wingPos.x + dragForce.x * FORCE_SCALE * 2,
      wingPos.y + dragForce.y * FORCE_SCALE * 2,
      wingPos.z + dragForce.z * FORCE_SCALE * 2
    );
    const dragEnd2 = new THREE.Vector3(
      wingPos.x + dragForce.x * FORCE_SCALE * 2 + offset,
      wingPos.y + dragForce.y * FORCE_SCALE * 2,
      wingPos.z + dragForce.z * FORCE_SCALE * 2
    );

    const dragPositions = new Float32Array([
      wingPos.x, wingPos.y, wingPos.z,
      dragEnd.x, dragEnd.y, dragEnd.z
    ]);
    const dragPositions2 = new Float32Array([
      wingPos.x + offset, wingPos.y, wingPos.z,
      dragEnd2.x, dragEnd2.y, dragEnd2.z
    ]);

    this.dragLine.geometry.setAttribute('position', new THREE.BufferAttribute(dragPositions, 3));
    this.dragLine2.geometry.setAttribute('position', new THREE.BufferAttribute(dragPositions2, 3));

    // Update wind force visualization
    const windVelocity = this.weather.getWindVelocity();
    const windForce = new CANNON.Vec3(
      windVelocity.x * MASS * 0.3,
      windVelocity.y * MASS * 0.3,
      windVelocity.z * MASS * 0.3
    );
    const windEnd = new THREE.Vector3(
      wingPos.x + windForce.x * FORCE_SCALE * 2,
      wingPos.y + windForce.y * FORCE_SCALE * 2,
      wingPos.z + windForce.z * FORCE_SCALE * 2
    );
    const windEnd2 = new THREE.Vector3(
      wingPos.x + windForce.x * FORCE_SCALE * 2 + offset,
      wingPos.y + windForce.y * FORCE_SCALE * 2,
      wingPos.z + windForce.z * FORCE_SCALE * 2
    );

    const windPositions = new Float32Array([
      wingPos.x, wingPos.y, wingPos.z,
      windEnd.x, windEnd.y, windEnd.z
    ]);
    const windPositions2 = new Float32Array([
      wingPos.x + offset, wingPos.y, wingPos.z,
      windEnd2.x, windEnd2.y, windEnd2.z
    ]);

    this.windLine.geometry.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    this.windLine2.geometry.setAttribute('position', new THREE.BufferAttribute(windPositions2, 3));

    // Update thermal force visualization
    if (this.isInsideAnyThermal()) {
      const thermalForce = new CANNON.Vec3(0, MASS * 0.5, 0);
      const thermalEnd = new THREE.Vector3(
        wingPos.x + thermalForce.x * FORCE_SCALE * 2,
        wingPos.y + thermalForce.y * FORCE_SCALE * 2,
        wingPos.z + thermalForce.z * FORCE_SCALE * 2
      );
      const thermalEnd2 = new THREE.Vector3(
        wingPos.x + thermalForce.x * FORCE_SCALE * 2 + offset,
        wingPos.y + thermalForce.y * FORCE_SCALE * 2,
        wingPos.z + thermalForce.z * FORCE_SCALE * 2
      );

      const thermalPositions = new Float32Array([
        wingPos.x, wingPos.y, wingPos.z,
        thermalEnd.x, thermalEnd.y, thermalEnd.z
      ]);
      const thermalPositions2 = new Float32Array([
        wingPos.x + offset, wingPos.y, wingPos.z,
        thermalEnd2.x, thermalEnd2.y, thermalEnd2.z
      ]);

      this.thermalLine.geometry.setAttribute('position', new THREE.BufferAttribute(thermalPositions, 3));
      this.thermalLine2.geometry.setAttribute('position', new THREE.BufferAttribute(thermalPositions2, 3));
      this.thermalLine.visible = true;
      this.thermalLine2.visible = true;
    } else {
      this.thermalLine.visible = false;
      this.thermalLine2.visible = false;
    }

    // Update all geometries
    this.liftLine.geometry.attributes.position.needsUpdate = true;
    this.liftLine2.geometry.attributes.position.needsUpdate = true;
    this.dragLine.geometry.attributes.position.needsUpdate = true;
    this.dragLine2.geometry.attributes.position.needsUpdate = true;
    this.windLine.geometry.attributes.position.needsUpdate = true;
    this.windLine2.geometry.attributes.position.needsUpdate = true;
    this.thermalLine.geometry.attributes.position.needsUpdate = true;
    this.thermalLine2.geometry.attributes.position.needsUpdate = true;
  }

  private applyForces() {
    // Get current velocity
    const velocity = this.wingBody.velocity;
    const speed = velocity.length();

    // Calculate lift force with reduced magnitude
    const liftForce = this.calculateLiftForce(speed);
    // Apply lift at the center of the wing
    this.wingBody.applyForce(liftForce, new CANNON.Vec3(0, 0, 0));

    // Calculate drag force with increased magnitude
    const dragForce = this.calculateDragForce(speed);
    // Apply drag at the center of the wing
    this.wingBody.applyForce(dragForce, new CANNON.Vec3(0, 0, 0));

    // Apply wind force with reduced magnitude
    const windVelocity = this.weather.getWindVelocity();
    const windForce = new CANNON.Vec3(
      windVelocity.x * MASS * 0.3, // Reduced wind influence
      windVelocity.y * MASS * 0.3,
      windVelocity.z * MASS * 0.3
    );
    this.wingBody.applyForce(windForce, new CANNON.Vec3(0, 0, 0));

    // Apply thermal forces if inside thermal with reduced magnitude
    if (this.isInsideAnyThermal()) {
      const thermalForce = new CANNON.Vec3(0, MASS * 0.5, 0); // Reduced thermal force
      this.wingBody.applyForce(thermalForce, new CANNON.Vec3(0, 0, 0));
    }
  }

  private calculateLiftForce(speed: number): CANNON.Vec3 {
    // Basic lift equation: L = 1/2 * ρ * v² * S * Cl
    const liftMagnitude = 0.5 * AIR_DENSITY * speed * speed * WING_AREA * LIFT_COEFFICIENT * 0.3; // Further reduced lift coefficient

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
    return this.mesh.position;
  }

  private getLiftValue(): number {
    // Calculate lift based on wing orientation and velocity
    const velocity = this.wingBody.velocity;
    const speed = velocity.length();
    const wingNormal = new THREE.Vector3(0, 1, 0);
    wingNormal.applyQuaternion(this.mesh.quaternion);

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

  addGui(gui: any) {
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
    folder.add(this.forceGroup, 'visible').name('Show Forces');

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

    // Update visual mesh position and rotation
    this.mesh.position.copy(this.wingBody.position as any);
    this.mesh.quaternion.copy(this.wingBody.quaternion as any);

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
    const rotationSmoother = 0.04;
    const keyBreakMultiplier = 8;
    const passiveRecoveryMultiplier = 3;
    const turnMultiplier = THREE.MathUtils.clamp(multiplier * this.turnStrength, 0, 0.035);

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

    this.rotationInertia = THREE.MathUtils.clamp(this.rotationInertia, -25, 25);

    // Apply rotation to physics body with reduced force
    const rotationForce = new CANNON.Vec3(0, this.rotationInertia * rotationSmoother * 0.5, 0);
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

