import * as CANNON from "cannon-es";
import GUI from 'lil-gui';
import * as THREE from "three";
import { TrajectoryPoint, TrajectoryPointType } from "../../elements/trajectory";
import Weather from "../../elements/weather";
import { getTerrainHeightBelowPosition } from "../../utils/collision";
import Thermal from "../thermal";
import { ForceVisualization } from "./force-visualization";

const ANTI_CRASH_ENABLED = false;
const TICK_INTERVAL = 25; // 40 Hz update rate
const PHYSICS_TIMESTEP = 1 / 60; // 60 Hz physics simulation

// Physics constants
const AIR_DENSITY = 1.225; // kg/m³
const DRAG_COEFFICIENT = 0.5;
const LIFT_COEFFICIENT = 1.2;
const WING_AREA = 25; // m²

export type ParaglierPart = {
  mesh: THREE.Object3D;
  weight: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
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
  pilotMesh: THREE.Object3D;
  wingMesh: THREE.Object3D;
  pilotWeight: number; // in kg
  wingWeight: number; // in kg
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

class PhysicsFlier extends THREE.EventDispatcher {
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
  gliderLinesConstraint: CANNON.DistanceConstraint;

  // Replace force visualization properties with single property
  private forceVisualization: ForceVisualization;

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
    const wingShape = new CANNON.Box(new CANNON.Vec3(20, 1, 20));
    this.gliderBody = new CANNON.Body({
      mass: this.options.wingWeight,
      shape: wingShape,
      material: new CANNON.Material('wing')
    });
    this.glider.mesh.position.copy(this.glider.position as any);
    this.gliderBody.position.copy(this.glider.position as any);
    this.gliderBody.quaternion.copy(this.glider.rotation as any);

    // Set initial velocity for stable flight
    this.gliderBody.velocity.set(0, 0, -10); // Initial forward speed of 10 m/s

    // Create pilot body
    const pilotShape = new CANNON.Sphere(2);
    this.pilotBody = new CANNON.Body({
      mass: this.options.pilotWeight,
      shape: pilotShape,
      material: new CANNON.Material('pilot')
    });

    // Position pilot 
    this.pilot.mesh.position.copy(this.pilot.position as any);
    this.pilotBody.position.copy(this.pilot.position as any);
    this.pilotBody.quaternion.copy(this.pilot.rotation as any);

    // Create constraint between wing and pilot with reduced rotation
    this.gliderLinesConstraint = new CANNON.DistanceConstraint(
      this.gliderBody,
      this.pilotBody,
      this.options.distanceWingPilot
    );

    // Add bodies and constraints to world
    this.world.addBody(this.gliderBody);
    this.world.addBody(this.pilotBody);
    this.world.addConstraint(this.gliderLinesConstraint);

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
    this.forceVisualization = new ForceVisualization(this.options.wingMesh.parent);
  }

  private updateForceVisualization() {
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

    // Calculate forces
    const liftForce = this.calculateLiftForce(this.gliderBody.velocity.length());
    const dragForce = this.calculateDragForce(this.gliderBody.velocity.length());
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
    const velocity = this.gliderBody.velocity;
    const speed = velocity.length();

    // Calculate lift force with reduced magnitude
    const liftForce = this.calculateLiftForce(speed);
    // Apply lift at the center of the wing

    this.gliderBody.applyForce(liftForce, new CANNON.Vec3(0, 0, 0));

    // Calculate drag force with increased magnitude
    const dragForce = this.calculateDragForce(speed);
    // Apply drag at the center of the wing
    this.gliderBody.applyForce(dragForce, new CANNON.Vec3(0, 0, 0));

    // Apply wind force with reduced magnitude
    const windVelocity = this.weather.getWindVelocity();
    const windForce = new CANNON.Vec3(
      windVelocity.x * this.options.wingWeight * 0.3,
      windVelocity.y * this.options.wingWeight * 0.3,
      windVelocity.z * this.options.wingWeight * 0.3
    );

    this.gliderBody.applyForce(windForce, new CANNON.Vec3(0, 0, 0));

    // Apply thermal forces if inside thermal with reduced magnitude
    if (this.isInsideAnyThermal()) {
      const thermalForce = new CANNON.Vec3(0, this.options.wingWeight * 0.5, 0);
      // Apply thermal force at the center of the wing
      this.gliderBody.applyForce(thermalForce, new CANNON.Vec3(0, 0, 0));
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
    this.gliderBody.quaternion.vmult(wingNormal, wingNormal);

    return wingNormal.scale(liftMagnitude);
  }

  private calculateDragForce(speed: number): CANNON.Vec3 {
    // Basic drag equation: D = 1/2 * ρ * v² * S * Cd
    const dragMagnitude = 0.5 * AIR_DENSITY * speed * speed * WING_AREA * DRAG_COEFFICIENT * 1.2; // Slightly reduced drag coefficient

    // Apply drag in the opposite direction of velocity
    const dragDirection = this.gliderBody.velocity.clone();
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
    return this.glider.position;
  }

  private getLiftValue(): number {
    // Calculate lift based on wing orientation and velocity
    const velocity = this.gliderBody.velocity;
    const speed = velocity.length();
    const wingNormal = new THREE.Vector3(0, 1, 0);
    wingNormal.applyQuaternion(this.glider.rotation);

    // Calculate angle of attack
    const velocityNormalized = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
    const angleOfAttack = Math.acos(velocityNormalized.dot(wingNormal));

    // Lift increases with speed and angle of attack up to a point
    const liftValue = Math.min(speed * 0.1 * Math.sin(angleOfAttack), 1);

    return liftValue;
  }

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

    // Add position and rotation information for glider and pilot
    const positionFolder = folder.addFolder('Positions & Meshes');

    // Physics body positions
    const physicsFolder = positionFolder.addFolder('Physics Bodies');

    // Glider position display
    const gliderPosition = {
      x: 0, y: 0, z: 0,
      update: () => {
        gliderPosition.x = parseFloat(this.gliderBody.position.x.toFixed(2));
        gliderPosition.y = parseFloat(this.gliderBody.position.y.toFixed(2));
        gliderPosition.z = parseFloat(this.gliderBody.position.z.toFixed(2));
      }
    };

    const gliderRotation = {
      x: 0, y: 0, z: 0, w: 0,
      update: () => {
        gliderRotation.x = parseFloat(this.gliderBody.quaternion.x.toFixed(2));
        gliderRotation.y = parseFloat(this.gliderBody.quaternion.y.toFixed(2));
        gliderRotation.z = parseFloat(this.gliderBody.quaternion.z.toFixed(2));
        gliderRotation.w = parseFloat(this.gliderBody.quaternion.w.toFixed(2));
      }
    };

    // Pilot position display
    const pilotPosition = {
      x: 0, y: 0, z: 0,
      update: () => {
        pilotPosition.x = parseFloat(this.pilotBody.position.x.toFixed(2));
        pilotPosition.y = parseFloat(this.pilotBody.position.y.toFixed(2));
        pilotPosition.z = parseFloat(this.pilotBody.position.z.toFixed(2));
      }
    };

    // Add glider position controls
    const gliderFolder = physicsFolder.addFolder('Glider Physics Body');
    gliderFolder.add(gliderPosition, 'x').name('X Position').listen();
    gliderFolder.add(gliderPosition, 'y').name('Y Position').listen();
    gliderFolder.add(gliderPosition, 'z').name('Z Position').listen();
    gliderFolder.add(gliderRotation, 'x').name('X Rotation').listen();
    gliderFolder.add(gliderRotation, 'y').name('Y Rotation').listen();
    gliderFolder.add(gliderRotation, 'z').name('Z Rotation').listen();

    // Add pilot position controls
    const pilotFolder = physicsFolder.addFolder('Pilot Physics Body');
    pilotFolder.add(pilotPosition, 'x').name('X Position').listen();
    pilotFolder.add(pilotPosition, 'y').name('Y Position').listen();
    pilotFolder.add(pilotPosition, 'z').name('Z Position').listen();

    // Add visual mesh positions
    const meshFolder = positionFolder.addFolder('Visual Meshes');

    // Glider mesh position display
    const gliderMeshPosition = {
      x: 0, y: 0, z: 0,
      update: () => {
        gliderMeshPosition.x = parseFloat(this.glider.position.x.toFixed(2));
        gliderMeshPosition.y = parseFloat(this.glider.position.y.toFixed(2));
        gliderMeshPosition.z = parseFloat(this.glider.position.z.toFixed(2));
      }
    };

    // Pilot mesh position display
    const pilotMeshPosition = {
      x: 0, y: 0, z: 0,
      update: () => {
        pilotMeshPosition.x = parseFloat(this.pilot.position.x.toFixed(2));
        pilotMeshPosition.y = parseFloat(this.pilot.position.y.toFixed(2));
        pilotMeshPosition.z = parseFloat(this.pilot.position.z.toFixed(2));
      }
    };

    // Add glider mesh position controls
    const gliderMeshFolder = meshFolder.addFolder('Glider Mesh');
    gliderMeshFolder.add(gliderMeshPosition, 'x').name('X Position').listen();
    gliderMeshFolder.add(gliderMeshPosition, 'y').name('Y Position').listen();
    gliderMeshFolder.add(gliderMeshPosition, 'z').name('Z Position').listen();

    // Add pilot mesh position controls
    const pilotMeshFolder = meshFolder.addFolder('Pilot Mesh');
    pilotMeshFolder.add(pilotMeshPosition, 'x').name('X Position').listen();
    pilotMeshFolder.add(pilotMeshPosition, 'y').name('Y Position').listen();
    pilotMeshFolder.add(pilotMeshPosition, 'z').name('Z Position').listen();

    // Position differences (to detect sync issues)
    const diffFolder = positionFolder.addFolder('Physics vs. Mesh Differences');

    const positionDifferences = {
      gliderX: 0, gliderY: 0, gliderZ: 0,
      pilotX: 0, pilotY: 0, pilotZ: 0,
      update: () => {
        positionDifferences.gliderX = parseFloat((this.gliderBody.position.x - this.glider.position.x).toFixed(2));
        positionDifferences.gliderY = parseFloat((this.gliderBody.position.y - this.glider.position.y).toFixed(2));
        positionDifferences.gliderZ = parseFloat((this.gliderBody.position.z - this.glider.position.z).toFixed(2));

        positionDifferences.pilotX = parseFloat((this.pilotBody.position.x - this.pilot.position.x).toFixed(2));
        positionDifferences.pilotY = parseFloat((this.pilotBody.position.y - this.pilot.position.y).toFixed(2));
        positionDifferences.pilotZ = parseFloat((this.pilotBody.position.z - this.pilot.position.z).toFixed(2));
      }
    };

    diffFolder.add(positionDifferences, 'gliderX').name('Glider X Diff').listen();
    diffFolder.add(positionDifferences, 'gliderY').name('Glider Y Diff').listen();
    diffFolder.add(positionDifferences, 'gliderZ').name('Glider Z Diff').listen();
    diffFolder.add(positionDifferences, 'pilotX').name('Pilot X Diff').listen();
    diffFolder.add(positionDifferences, 'pilotY').name('Pilot Y Diff').listen();
    diffFolder.add(positionDifferences, 'pilotZ').name('Pilot Z Diff').listen();

    // Distance between wing and pilot
    const distances = {
      current: 0,
      target: this.options.distanceWingPilot,
      update: () => {
        const dx = this.gliderBody.position.x - this.pilotBody.position.x;
        const dy = this.gliderBody.position.y - this.pilotBody.position.y;
        const dz = this.gliderBody.position.z - this.pilotBody.position.z;
        distances.current = parseFloat(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2));
      }
    };

    positionFolder.add(distances, 'current').name('Current Distance').listen();
    positionFolder.add(distances, 'target').name('Target Distance').listen();

    // Physics metrics
    const metricsFolder = folder.addFolder('Physics Metrics');

    const velocities = {
      gliderSpeed: 0,
      pilotSpeed: 0,
      update: () => {
        velocities.gliderSpeed = parseFloat(this.gliderBody.velocity.length().toFixed(2));
        velocities.pilotSpeed = parseFloat(this.pilotBody.velocity.length().toFixed(2));
      }
    };

    metricsFolder.add(velocities, 'gliderSpeed').name('Glider Speed').listen();
    metricsFolder.add(velocities, 'pilotSpeed').name('Pilot Speed').listen();

    // Update the GUI values on each frame
    const updateGUI = () => {
      gliderPosition.update();
      gliderRotation.update();
      pilotPosition.update();
      gliderMeshPosition.update();
      pilotMeshPosition.update();
      positionDifferences.update();
      distances.update();
      velocities.update();

      requestAnimationFrame(updateGUI);
    };

    updateGUI();

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
    this.glider.position.copy(this.gliderBody.position as any);
    this.glider.rotation.copy(this.gliderBody.quaternion as any);
    this.pilot.position.copy(this.pilotBody.position as any);
    this.pilot.rotation.copy(this.pilotBody.quaternion as any);

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
    this.gliderBody.applyTorque(rotationForce);

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

