import * as CANNON from "cannon-es";
import * as THREE from "three";
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { FlightHUD } from "../components/FlightHUD";
import Helpers from "../utils/helpers";
import { VectorVisualizater } from "../utils/vector-visualizer";
import { StoryOptions } from "./types";

/**
 * Interface defining all the flight control parameters that can be adjusted
 * during the simulation. These are exposed in the GUI.
 */
interface AirplaneControlSettings {
  thrust: number;               // Engine power (newtons)
  liftCoefficient: number;      // How efficiently wings generate lift
  dragCoefficient: number;      // Air resistance factor
  pitchSensitivity: number;     // How responsive elevator controls are
  rollSensitivity: number;      // How responsive aileron controls are
  yawSensitivity: number;       // How responsive rudder controls are
  showForceVectors: boolean;    // Whether to display force visualization
  resetScene: () => void;       // Function to reset airplane position
}

/**
 * Interface tracking the current state of all keyboard inputs.
 * This is used to determine which controls are active at any moment.
 */
interface KeyboardState {
  up: boolean;      // Pitch down (elevator forward)
  down: boolean;    // Pitch up (elevator backward)
  left: boolean;    // Roll left (left aileron up, right down)
  right: boolean;   // Roll right (right aileron up, left down)
  w: boolean;       // Increase thrust
  s: boolean;       // Decrease thrust
  a: boolean;       // Yaw left (rudder left)
  d: boolean;       // Yaw right (rudder right)
  r: boolean;       // Reset position
}

/**
 * Main component for the CANNON.js physics workshop
 * This simulation demonstrates flight physics using CANNON.js for physics and THREE.js for visualization
 */
const CannonWorkshop = {
  load: async (options: StoryOptions) => {
    // Extract all the options provided by the story framework
    const { camera, scene, renderer, terrain, water, sky, controls, gui } = options;

    // Show the GUI for adjusting flight parameters
    gui.show();

    // Configure scene elements
    terrain.visible = true;     // Show the terrain for visual reference
    water.visible = false;      // Hide water
    Helpers.createHelpers(scene); // Add helper elements like grid and axes
    sky.updateSunPosition(12);  // Set sky to midday lighting

    // Create the CANNON.js physics world
    // This is the main container for all physics objects and simulation
    const world = new CANNON.World();
    world.gravity.set(0, -1.82, 0); // Set gravity (meters/sec²) - Earth's gravity

    // Create vector visualizer for displaying forces
    // This helps understand the physics by showing arrows for each force
    const vectorVisualizer = new VectorVisualizater(scene);
    vectorVisualizer.setScale(3.0); // Make vectors larger for better visibility

    // Initialize keyboard state with all keys set to not pressed
    const keyboardState: KeyboardState = {
      up: false,
      down: false,
      left: false,
      right: false,
      w: false,
      s: false,
      a: false,
      d: false,
      r: false
    };

    // Create the physical airplane body with appropriate shapes and properties
    const airplaneBody = createAirplaneBody();
    world.addBody(airplaneBody); // Add the airplane to the physics world

    // Create the visual representation of the airplane
    const airplaneMesh = createAirplaneModel();
    scene.add(airplaneMesh); // Add the airplane visuals to the scene

    // Store initial position and orientation for the reset function
    const initialPosition = airplaneBody.position.clone();
    const initialQuaternion = airplaneBody.quaternion.clone();

    // Set up airplane controls in the GUI
    const airplaneControls = setupAirplaneControls(
      gui,
      airplaneBody,
      vectorVisualizer,
      initialPosition,
      initialQuaternion
    );

    // Set up keyboard event listeners
    const cleanupKeyboardControls = setupKeyboardControls(keyboardState);

    // Position camera for a good initial view of the airplane
    camera.position.set(0, 15, 30);
    controls.update();

    // Initialize the HUD
    const hud = new FlightHUD({ scene, camera });

    // Animation and physics timestep variables
    let lastTime = 0;

    /**
     * Main animation loop function
     * This runs approximately 60 times per second
     * @param time Current time from requestAnimationFrame
     */
    const animate = (time: number) => {
      // Calculate time step - either since last frame or use a default
      const deltaTime = lastTime ? (time - lastTime) / 1000 : 1 / 60;
      lastTime = time;

      // Step the physics simulation forward
      // This updates all physics bodies based on forces and constraints
      world.step(1 / 60); // Fixed timestep of 60Hz for stability

      // Calculate and apply all flight forces
      applyAirplanePhysics(
        airplaneBody,
        airplaneControls,
        keyboardState,
        deltaTime,
        vectorVisualizer
      );

      // Update the visual model to match the physics body
      // This transfers position and rotation from the physics world to visual world
      airplaneMesh.position.copy(airplaneBody.position as any);
      airplaneMesh.quaternion.copy(airplaneBody.quaternion as any);

      // Update camera to follow the airplane
      updateCamera(camera, airplaneBody, controls);

      // Update HUD with current flight data
      hud.update(
        new THREE.Vector3(
          airplaneBody.velocity.x,
          airplaneBody.velocity.y,
          airplaneBody.velocity.z
        ),
        airplaneBody.position.y,
        new THREE.Euler().setFromQuaternion(airplaneMesh.quaternion)
      );

      // Render the scene and HUD
      hud.render(renderer);

      // Schedule the next frame
      requestAnimationFrame(animate);
    };

    // Start the animation loop
    animate(0);

    /**
     * Creates the airplane physics body using CANNON.js compound shapes
     * The airplane is composed of multiple boxes for the fuselage, wings, and tail
     * @returns CANNON.Body representing the complete airplane
     */
    function createAirplaneBody(): CANNON.Body {
      // Main body (fuselage) shape
      // Parameters are half-extents (half of width, height, depth)
      const fuselageShape = new CANNON.Box(new CANNON.Vec3(4, 0.8, 0.8));

      // Wings shape - make wings wider and flatter for better lift
      const wingsShape = new CANNON.Box(new CANNON.Vec3(1.5, 0.08, 4));

      // Tail shape
      const tailShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.1));

      // Create the main physics body with mass and damping properties
      const body = new CANNON.Body({
        mass: 100,                       // Mass in kg
        position: new CANNON.Vec3(0, 20, 0), // Start in the air
        angularDamping: 0.5,             // Rotational drag (reduces spin)
        linearDamping: 0.1               // Linear drag (reduces velocity)
      });

      // Add all shape components to the body
      // First parameter is the shape, second is the offset position (if any)
      body.addShape(fuselageShape);                      // Centered fuselage
      body.addShape(wingsShape, new CANNON.Vec3(0, 0, 0)); // Centered wings
      body.addShape(tailShape, new CANNON.Vec3(-3.5, 0.5, 0)); // Tail at back of fuselage

      // Set initial velocity for a moving start - faster speed to generate sufficient lift
      body.velocity.set(0, 0, -2); // 20 m/s initial forward speed

      return body;
    }

    /**
     * Creates the visual THREE.js model of the airplane
     * This is purely visual and doesn't affect the physics simulation
     * @returns THREE.Group containing all the airplane parts
     */
    function createAirplaneModel(): THREE.Group {
      // Create a group to hold all airplane parts
      const airplane = new THREE.Group();

      // Define materials with different colors for each part
      const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff }); // Blue
      const wingsMaterial = new THREE.MeshPhongMaterial({ color: 0x2255cc });    // Darker blue
      const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });     // Red

      // Create fuselage (main body) - needs to match physics shape dimensions
      const fuselageGeometry = new THREE.BoxGeometry(8, 1.6, 1.6); // Width, height, depth
      const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
      airplane.add(fuselage);

      // Create wings
      const wingsGeometry = new THREE.BoxGeometry(3, 0.2, 6); // Width, height, depth
      const wings = new THREE.Mesh(wingsGeometry, wingsMaterial);
      airplane.add(wings);

      // Create horizontal tail (stabilizer)
      const tailGeometry = new THREE.BoxGeometry(1, 1, 0.2); // Width, height, depth
      const tail = new THREE.Mesh(tailGeometry, tailMaterial);
      tail.position.set(-3.5, 0.5, 0); // Position at back of fuselage
      airplane.add(tail);

      // Create vertical stabilizer (vertical tail)
      const vStabilizerGeometry = new THREE.BoxGeometry(1, 1, 0.2);
      const vStabilizer = new THREE.Mesh(vStabilizerGeometry, tailMaterial);
      vStabilizer.position.set(-3.5, 1, 0); // Position on top of horizontal stabilizer
      vStabilizer.rotation.x = Math.PI / 2; // Rotate to vertical position
      airplane.add(vStabilizer);

      // Create propeller
      const propellerGeometry = new THREE.BoxGeometry(0.2, 0.1, 2);
      const propeller = new THREE.Mesh(
        propellerGeometry,
        new THREE.MeshPhongMaterial({ color: 0x333333 })
      );
      propeller.position.set(4.1, 0, 0); // Position at front of fuselage
      propeller.rotation.z = Math.PI / 2; // Proper orientation
      airplane.add(propeller);

      // Enable shadows for all airplane parts
      airplane.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      return airplane;
    }

    /**
     * Sets up keyboard event listeners for flight controls
     * @param state Reference to the KeyboardState object to update
     * @returns Cleanup function to remove event listeners
     */
    function setupKeyboardControls(state: KeyboardState) {
      // Handler for keydown events (key pressed)
      const keyDownHandler = (e: KeyboardEvent) => {
        // Update the corresponding state property based on which key was pressed
        switch (e.code) {
          case 'ArrowDown': state.up = true; break;
          case 'ArrowUp': state.down = true; break;
          case 'ArrowLeft': state.left = true; break;
          case 'ArrowRight': state.right = true; break;
          case 'KeyW': state.w = true; break;
          case 'KeyS': state.s = true; break;
          case 'KeyA': state.a = true; break;
          case 'KeyD': state.d = true; break;
          case 'KeyR': state.r = true; break;
        }
      };

      // Handler for keyup events (key released)
      const keyUpHandler = (e: KeyboardEvent) => {
        // Update the corresponding state property based on which key was released
        switch (e.code) {
          case 'ArrowDown': state.up = false; break;
          case 'ArrowUp': state.down = false; break;
          case 'ArrowLeft': state.left = false; break;
          case 'ArrowRight': state.right = false; break;
          case 'KeyW': state.w = false; break;
          case 'KeyS': state.s = false; break;
          case 'KeyA': state.a = false; break;
          case 'KeyD': state.d = false; break;
          case 'KeyR': state.r = false; break;
        }
      };

      // Add the event listeners to the window
      window.addEventListener('keydown', keyDownHandler);
      window.addEventListener('keyup', keyUpHandler);

      // Return a cleanup function to remove the listeners when done
      return () => {
        window.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener('keyup', keyUpHandler);
      };
    }

    /**
     * Sets up GUI controls for adjusting flight parameters in real-time
     * @param gui The GUI instance to add controls to
     * @param airplaneBody The physics body to affect
     * @param vectorVisualizer The vector visualizer for showing/hiding forces
     * @param initialPosition Initial position for reset
     * @param initialQuaternion Initial orientation for reset
     * @returns Object containing all control settings
     */
    function setupAirplaneControls(
      gui: GUI,
      airplaneBody: CANNON.Body,
      vectorVisualizer: VectorVisualizater,
      initialPosition: CANNON.Vec3,
      initialQuaternion: CANNON.Quaternion
    ): AirplaneControlSettings {
      // Default control settings
      const controls: AirplaneControlSettings = {
        thrust: 1000,           // Higher default thrust (Newtons) to maintain flight
        liftCoefficient: 1.0,   // Increased lift coefficient for better stability
        dragCoefficient: 0.1,   // Default drag coefficient
        pitchSensitivity: 0.5,  // Default pitch control sensitivity
        rollSensitivity: 0.8,   // Default roll control sensitivity
        yawSensitivity: 0.3,    // Default yaw control sensitivity
        showForceVectors: true, // Show force vectors by default
        resetScene: () => {
          // Reset function - restores initial state
          airplaneBody.position.copy(initialPosition);
          airplaneBody.quaternion.copy(initialQuaternion);
          airplaneBody.velocity.set(0, 0, -20); // Higher initial velocity
          airplaneBody.angularVelocity.set(0, 0, 0); // Stop all rotation
        }
      };

      // Create folder for flight controls in the GUI
      const flightControls = gui.addFolder('Flight Controls');
      // Add thrust slider (0-1500 Newtons)
      flightControls.add(controls, 'thrust', 0, 1500).name('Thrust');
      // Add lift coefficient slider (0-2)
      flightControls.add(controls, 'liftCoefficient', 0, 2).name('Lift Coefficient');
      // Add drag coefficient slider (0-1)
      flightControls.add(controls, 'dragCoefficient', 0, 1).name('Drag Coefficient');

      // Create folder for control sensitivity adjustments
      const sensitivityControls = gui.addFolder('Control Sensitivity');
      // Add pitch sensitivity slider (0-2)
      sensitivityControls.add(controls, 'pitchSensitivity', 0, 2).name('Pitch');
      // Add roll sensitivity slider (0-2)
      sensitivityControls.add(controls, 'rollSensitivity', 0, 2).name('Roll');
      // Add yaw sensitivity slider (0-2)
      sensitivityControls.add(controls, 'yawSensitivity', 0, 2).name('Yaw');

      // Create folder for visualization options
      const visualControls = gui.addFolder('Visualization');
      // Add checkbox for showing/hiding force vectors
      visualControls.add(controls, 'showForceVectors').name('Show Forces')
        .onChange((value: boolean) => {
          vectorVisualizer.setVisible(value);
        });

      // Add folder for keyboard controls info
      const keyboardInfo = gui.addFolder('Keyboard Controls');
      // Create dummy object just to display text
      const keyInfo = {
        thrust: 'W/S - Increase/Decrease thrust',
        pitch: 'Up/Down - Pitch down/up',
        roll: 'Left/Right - Roll left/right',
        yaw: 'A/D - Yaw left/right',
        reset: 'R - Reset airplane position'
      };
      // Add items as read-only text fields
      keyboardInfo.add(keyInfo, 'thrust').name('Thrust Controls').listen();
      keyboardInfo.add(keyInfo, 'pitch').name('Pitch Controls').listen();
      keyboardInfo.add(keyInfo, 'roll').name('Roll Controls').listen();
      keyboardInfo.add(keyInfo, 'yaw').name('Yaw Controls').listen();
      keyboardInfo.add(keyInfo, 'reset').name('Reset').listen();

      // Add reset button directly to main GUI
      gui.add(controls, 'resetScene').name('Reset Airplane');

      // Open all folders by default for easy access
      flightControls.open();
      sensitivityControls.open();
      visualControls.open();
      keyboardInfo.open();

      return controls;
    }

    /**
     * The heart of the flight physics - calculates and applies all forces
     * acting on the airplane based on its state and control inputs
     * @param body The airplane physics body
     * @param controls The current control settings
     * @param keyboard The current keyboard input state
     * @param _deltaTime Time since last frame
     * @param vectorVisualizer The vector visualizer for showing forces
     */
    function applyAirplanePhysics(
      body: CANNON.Body,
      controls: AirplaneControlSettings,
      keyboard: KeyboardState,
      _deltaTime: number,
      vectorVisualizer: VectorVisualizater
    ) {
      // Reset all accumulated forces and torques
      // This is important as we'll calculate and apply new ones each frame
      // body.force.set(0, 0, 0);
      // body.torque.set(0, 0, 0);

      // Handle reset key (R) - restores airplane to starting position
      if (keyboard.r) {
        controls.resetScene();
        return;
      }

      // Get airplane orientation vectors in local coordinates
      // These will be transformed to world space
      const forwardVector = new CANNON.Vec3(1, 0, 0);  // Points along fuselage
      const upVector = new CANNON.Vec3(0, 1, 0);       // Points upward from airplane
      const rightVector = new CANNON.Vec3(0, 0, 1);    // Points to the right wing

      // Transform the local vectors to world space based on airplane orientation
      // This is essential as forces need to be applied in world coordinates
      // body.vectorToWorldFrame(forwardVector, forwardVector);
      // body.vectorToWorldFrame(upVector, upVector);
      // body.vectorToWorldFrame(rightVector, rightVector);

      // Calculate velocity magnitude (airspeed)
      const velocityMag = body.velocity.length();

      // Calculate relative wind direction (opposite of velocity)
      // This is what the airplane "feels" as airflow
      // Handle velocity vector safely with proper types
      const velocityNorm = body.velocity.length();
      // If velocity is too small, use a default direction
      let relativeWind: CANNON.Vec3;
      if (velocityNorm < 0.001) {
        // Default to "forward" relative wind if nearly stationary
        relativeWind = forwardVector.clone().negate();
      } else {
        // Create a new Vec3 from velocity components to ensure proper typing
        relativeWind = new CANNON.Vec3(
          -body.velocity.x / velocityNorm,
          -body.velocity.y / velocityNorm,
          -body.velocity.z / velocityNorm
        );
      }

      // Calculate angle of attack (angle between forward vector and relative wind)
      // This is crucial for lift calculation - too high leads to stall
      const dotProduct = forwardVector.dot(relativeWind);
      let angleOfAttack = Math.acos(Math.min(Math.max(dotProduct, -1), 1));

      // Apply thrust force based on current throttle setting
      // Thrust is applied in the forward direction of the airplane
      let thrustMultiplier = 1;
      if (keyboard.w) thrustMultiplier = 1.5;  // W key increases thrust by 50%
      if (keyboard.s) thrustMultiplier = 0.5;  // S key decreases thrust by 50%

      // Calculate final thrust vector and apply it
      const thrustForce = forwardVector.clone().scale(controls.thrust * thrustMultiplier);
      console.log(thrustForce);

      body.applyLocalForce(thrustForce, new CANNON.Vec3(0, 0, 0));

      // Calculate lift direction perpendicular to airflow
      // In simple terms, this is "up" from the airplane's perspective
      const liftDirection = upVector;

      // Determine lift coefficient based on angle of attack
      // This simulates how wings generate more lift up to a point (stall angle)
      let liftCoefficient = controls.liftCoefficient;

      // Implement a simple stall model - lift drops off after ~15 degrees (0.25 radians)
      // This replicates how wings lose lift when the angle gets too steep
      if (angleOfAttack > 0.25) {
        // Reduce lift coefficient as angle increases beyond stall point
        liftCoefficient *= Math.max(0, 1 - (angleOfAttack - 0.25) * 3);
      }

      // Calculate lift force - proportional to velocity squared and lift coefficient
      // This follows real aerodynamic principles where faster airflow = more lift
      // Use a higher constant multiplier (0.015 instead of 0.01) for better lift
      const liftMagnitude = liftCoefficient * velocityMag * velocityMag * 0.015;
      const liftForce = liftDirection.clone().scale(liftMagnitude);
      // body.applyLocalForce(liftForce);

      // Add a small constant lift force to help prevent stalling
      // This helps maintain altitude even at lower speeds
      const stabilizingLift = liftDirection.clone().scale(100);
      // body.applyLocalForce(stabilizingLift);

      // Calculate drag force - opposite to velocity and proportional to velocity squared
      // This simulates air resistance that increases with speed
      const dragMagnitude = controls.dragCoefficient * velocityMag * velocityMag * 0.01;
      const dragForce = relativeWind.clone().scale(dragMagnitude);
      // body.applyForce(dragForce, body.position);

      // Apply control inputs as torques
      // These rotate the airplane around its different axes

      // Pitch (elevator) - rotate around right axis (wing axis)
      if (keyboard.up) {
        // Push nose down - positive pitch torque
        console.log('up');
        console.log(rightVector.clone().scale(controls.pitchSensitivity * 500));
        body.applyTorque(rightVector.clone().scale(controls.pitchSensitivity * 500));
      } else if (keyboard.down) {
        // Pull nose up - negative pitch torque
        console.log('down');
        console.log(rightVector.clone().scale(-controls.pitchSensitivity * 500));
        body.applyTorque(rightVector.clone().scale(-controls.pitchSensitivity * 500));
      }

      // Roll (ailerons) - rotate around forward axis (fuselage)
      if (keyboard.left) {
        // Roll left - negative roll torque
        body.applyTorque(forwardVector.clone().scale(-controls.rollSensitivity * 500));
      } else if (keyboard.right) {
        // Roll right - positive roll torque
        body.applyTorque(forwardVector.clone().scale(controls.rollSensitivity * 500));
      }

      // Yaw (rudder) - rotate around up axis
      if (keyboard.a) {
        // Yaw left - negative yaw torque
        body.applyTorque(upVector.clone().scale(-controls.yawSensitivity * 500));
      } else if (keyboard.d) {
        // Yaw right - positive yaw torque
        body.applyTorque(upVector.clone().scale(controls.yawSensitivity * 500));
      }

      // Visualize forces if enabled
      if (controls.showForceVectors) {
        // Get the current position for drawing vectors from
        const position = new THREE.Vector3().copy(body.position as any);

        // Create THREE.js vectors for visualization
        // (These are just for display, not for physics calculation)
        const thrustVecThree = new THREE.Vector3(thrustForce.x, thrustForce.y, thrustForce.z);
        const liftVecThree = new THREE.Vector3(liftForce.x, liftForce.y, liftForce.z);
        const dragVecThree = new THREE.Vector3(dragForce.x, dragForce.y, dragForce.z);
        const weightVecThree = new THREE.Vector3(0, -9.82 * body.mass, 0);
        const glideDirectionThree = new THREE.Vector3(forwardVector.x, forwardVector.y, forwardVector.z);

        // Create CANNON.js vectors for the vector visualizer
        const liftVecCannon = new CANNON.Vec3(liftForce.x, liftForce.y, liftForce.z);
        const dragVecCannon = new CANNON.Vec3(dragForce.x, dragForce.y, dragForce.z);
        const weightVecCannon = new CANNON.Vec3(0, -9.82 * body.mass, 0);
        const glideDirectionCannon = new CANNON.Vec3(forwardVector.x, forwardVector.y, forwardVector.z);

        // Update the vector visualizer with all current forces
        vectorVisualizer.update(
          position,                 // Wing position for drawing vectors from
          position.clone().add(new THREE.Vector3(0, 5, 0)), // Offset position for clarity
          liftVecCannon,            // Lift force (green arrow)
          dragVecCannon,            // Drag force (red arrow)
          weightVecCannon,          // Weight force (yellow arrow)
          glideDirectionCannon,     // Direction of travel (blue arrow)
          null,                     // No left break force in this model
          null                      // No right break force in this model
        );
      }
    }

    /**
     * Updates the camera position to follow the airplane if auto-rotation is enabled
     * @param camera THREE.js camera to update
     * @param body Airplane physics body to follow
     * @param controls OrbitControls instance
     */
    function updateCamera(camera: THREE.Camera, body: CANNON.Body, controls: any) {
      // Get the airplane's forward direction in world space
      const forwardVector = new CANNON.Vec3(1, 0, 0);
      body.vectorToWorldFrame(forwardVector, forwardVector);

      // Get the airplane's up direction in world space
      const upVector = new CANNON.Vec3(0, 1, 0);
      body.vectorToWorldFrame(upVector, upVector);

      // Position the camera slightly above and behind the cockpit
      const cockpitOffset = new CANNON.Vec3(-0.5, 1, 0); // Slightly behind and above the nose
      body.vectorToWorldFrame(cockpitOffset, cockpitOffset);

      // Set camera position to cockpit position
      camera.position.set(
        body.position.x + cockpitOffset.x,
        body.position.y + cockpitOffset.y,
        body.position.z + cockpitOffset.z
      );

      // Calculate look target - point slightly ahead of the airplane
      const lookAheadDistance = 10;
      const targetPosition = new THREE.Vector3(
        body.position.x + forwardVector.x * lookAheadDistance,
        body.position.y + forwardVector.y * lookAheadDistance,
        body.position.z + forwardVector.z * lookAheadDistance
      );

      // Make the camera look at the target point
      camera.lookAt(targetPosition);

      // Disable orbit controls since we're handling camera movement
      controls.enabled = false;
    }

    // Return cleanup function for when the story is unloaded
    return () => {
      // Clean up event listeners to prevent memory leaks
      if (cleanupKeyboardControls) cleanupKeyboardControls();
      hud.dispose();
    };
  },
};

export default CannonWorkshop;
