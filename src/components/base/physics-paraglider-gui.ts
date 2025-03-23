import * as CANNON from "cannon-es";
import GUI from 'lil-gui';
import PhysicsFlier from "./physics-paraglider";

// Physics constants - these are needed for the GUI
const DRAG_COEFFICIENT = 0.5;
const LIFT_COEFFICIENT = 1.2;

/**
 * Adds GUI controls for the physics paraglider
 * @param flier The PhysicsFlier instance to control
 * @param gui The lil-gui instance to add controls to
 */
export function addParagliderGui(flier: PhysicsFlier, gui: GUI) {
  const folder = gui.addFolder('Physics Flier');

  // Add controls for physics parameters
  folder.add({ liftCoefficient: LIFT_COEFFICIENT }, 'liftCoefficient', 0, 2, 0.1)
    .onChange((value: number) => {
      flier.__lift = value;
    });

  folder.add({ dragCoefficient: DRAG_COEFFICIENT }, 'dragCoefficient', 0, 1, 0.1)
    .onChange((value: number) => {
      flier.__gradient = value;
    });

  // Add force visualization toggle with default to true
  const forceVisController = {
    showForces: true,  // Set default to true to make forces visible
    setShowForces: (value: boolean) => {
      flier.forceVisualization.setVisible(value);
      console.log("Force visualization visibility set to:", value);
    }
  };
  folder.add(forceVisController, 'showForces')
    .onChange((value: boolean) => forceVisController.setShowForces(value))
    .name('Show Forces');

  // Ensure forces are visible by default
  forceVisController.setShowForces(true);

  // Force scale control
  const forceScaleController = {
    forceScale: 1.0,
    update: (value: number) => {
      if (flier.forceVisualization.setScale) {
        flier.forceVisualization.setScale(value);
      }
    }
  };

  // Add force scale control if method exists
  try {
    folder.add(forceScaleController, 'forceScale', 0.1, 5.0, 0.1)
      .onChange((value: number) => forceScaleController.update(value))
      .name('Force Scale');
  } catch (e) {
    console.log("Force scale control not available:", e);
  }

  // Add force magnitude information section
  const forceMagFolder = folder.addFolder('Force Magnitudes');
  const forceMagnitudes = {
    lift: 0,
    drag: 0,
    wind: 0,
    thermal: 0,
    gravity: 0,
    speed: 0,
    update: () => {
      try {
        // Get current velocity
        const velocity = flier.gliderBody.velocity;
        const speed = velocity.length();
        forceMagnitudes.speed = parseFloat(speed.toFixed(2));

        // Calculate forces (without actually applying them)
        const liftForce = flier.calculateLiftForce(speed);
        const dragForce = flier.calculateDragForce(speed);

        // Get the wind velocity
        const windVelocity = flier.weather.getWindVelocity();
        const windForce = new CANNON.Vec3(
          windVelocity.x * flier.options.glider.weight * 0.3,
          windVelocity.y * flier.options.glider.weight * 0.3,
          windVelocity.z * flier.options.glider.weight * 0.3
        );

        // Calculate thermal force
        const thermalForce = flier.isInsideAnyThermal()
          ? new CANNON.Vec3(0, flier.options.glider.weight * 0.5, 0)
          : new CANNON.Vec3(0, 0, 0);

        // Calculate gravity force
        const gravityForce = new CANNON.Vec3(0, -flier.options.pilot.weight * 9.81, 0);

        // Update the displayed values
        forceMagnitudes.lift = parseFloat(isNaN(liftForce.length()) ? "0" : liftForce.length().toFixed(2));
        forceMagnitudes.drag = parseFloat(isNaN(dragForce.length()) ? "0" : dragForce.length().toFixed(2));
        forceMagnitudes.wind = parseFloat(windForce.length().toFixed(2));
        forceMagnitudes.thermal = parseFloat(thermalForce.length().toFixed(2));
        forceMagnitudes.gravity = parseFloat(gravityForce.length().toFixed(2));
      } catch (e) {
        console.error("Error updating force magnitudes:", e);
      }
    }
  };

  // Add force magnitude displays
  forceMagFolder.add(forceMagnitudes, 'speed').name('Current Speed (m/s)').listen();
  forceMagFolder.add(forceMagnitudes, 'lift').name('Lift Force (N)').listen();
  forceMagFolder.add(forceMagnitudes, 'drag').name('Drag Force (N)').listen();
  forceMagFolder.add(forceMagnitudes, 'wind').name('Wind Force (N)').listen();
  forceMagFolder.add(forceMagnitudes, 'thermal').name('Thermal Force (N)').listen();
  forceMagFolder.add(forceMagnitudes, 'gravity').name('Gravity Force (N)').listen();

  // Add position and rotation information for glider and pilot
  const positionFolder = folder.addFolder('Positions & Meshes');

  // Physics body positions
  const physicsFolder = positionFolder.addFolder('Physics Bodies');

  // Glider position display
  const gliderPosition = {
    x: 0, y: 0, z: 0,
    update: () => {
      gliderPosition.x = parseFloat(flier.gliderBody.position.x.toFixed(2));
      gliderPosition.y = parseFloat(flier.gliderBody.position.y.toFixed(2));
      gliderPosition.z = parseFloat(flier.gliderBody.position.z.toFixed(2));
    }
  };

  const gliderRotation = {
    x: 0, y: 0, z: 0, w: 0,
    update: () => {
      gliderRotation.x = parseFloat(flier.gliderBody.quaternion.x.toFixed(2));
      gliderRotation.y = parseFloat(flier.gliderBody.quaternion.y.toFixed(2));
      gliderRotation.z = parseFloat(flier.gliderBody.quaternion.z.toFixed(2));
      gliderRotation.w = parseFloat(flier.gliderBody.quaternion.w.toFixed(2));
    }
  };

  // Pilot position display
  const pilotPosition = {
    x: 0, y: 0, z: 0,
    update: () => {
      pilotPosition.x = parseFloat(flier.pilotBody.position.x.toFixed(2));
      pilotPosition.y = parseFloat(flier.pilotBody.position.y.toFixed(2));
      pilotPosition.z = parseFloat(flier.pilotBody.position.z.toFixed(2));
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
      gliderMeshPosition.x = parseFloat(flier.glider.mesh.position.x.toFixed(2));
      gliderMeshPosition.y = parseFloat(flier.glider.mesh.position.y.toFixed(2));
      gliderMeshPosition.z = parseFloat(flier.glider.mesh.position.z.toFixed(2));
    }
  };

  // Pilot mesh position display
  const pilotMeshPosition = {
    x: 0, y: 0, z: 0,
    update: () => {
      pilotMeshPosition.x = parseFloat(flier.pilot.mesh.position.x.toFixed(2));
      pilotMeshPosition.y = parseFloat(flier.pilot.mesh.position.y.toFixed(2));
      pilotMeshPosition.z = parseFloat(flier.pilot.mesh.position.z.toFixed(2));
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

  // Position differences
  const positionDifferences = {
    x: 0, y: 0, z: 0,
    update: () => {
      positionDifferences.x = parseFloat((flier.glider.mesh.position.x - flier.pilot.mesh.position.x).toFixed(2));
      positionDifferences.y = parseFloat((flier.glider.mesh.position.y - flier.pilot.mesh.position.y).toFixed(2));
      positionDifferences.z = parseFloat((flier.glider.mesh.position.z - flier.pilot.mesh.position.z).toFixed(2));
    }
  };

  // Distance between wing and pilot
  const distances = {
    current: 0,
    target: flier.options.distanceWingPilot,
    update: () => {
      const dx = flier.gliderBody.position.x - flier.pilotBody.position.x;
      const dy = flier.gliderBody.position.y - flier.pilotBody.position.y;
      const dz = flier.gliderBody.position.z - flier.pilotBody.position.z;
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
      velocities.gliderSpeed = parseFloat(flier.gliderBody.velocity.length().toFixed(2));
      velocities.pilotSpeed = parseFloat(flier.pilotBody.velocity.length().toFixed(2));
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
    forceMagnitudes.update(); // Add update for force magnitudes

    requestAnimationFrame(updateGUI);
  };

  updateGUI();

  // Add debug controls
  if (flier.debug) {
    folder.add(flier, 'speedBar').name('Speed Bar');
    folder.add(flier, 'ears').name('Big Ears');
    folder.add(flier, 'rotationInertia', -25, 25).name('Rotation Inertia');
  }
} 