# Physics Simulation Documentation

This document describes the refactored physics simulation code structure in the `src/stories/physics` directory.

## Overview

The physics simulation has been refactored into a modular architecture with clearly separated concerns. Each file focuses on a specific aspect of the simulation, making the code more maintainable, easier to understand, and more reusable.

## File Structure

```
src/stories/physics/
├── core.ts        - Core scene setup and physics initialization
├── gui.ts         - GUI controls for physics parameters
├── helpers.ts     - Utility functions and constants
├── index.tsx      - Main entry point that assembles everything
├── rope.ts        - Rope creation and physics functionality
├── ui.ts          - UI components (buttons and controls)
└── visualization.ts - Visual representation of physics objects
```

## Module Descriptions

### `helpers.ts`

Contains utility functions, constants, and common interfaces:

- `PUSH_FORCE_MAGNITUDE`: Base force magnitude for physics interactions
- `KEY_MAPPING`: Keyboard mapping for controls
- `arrayIncludes()`: Helper function for array checking
- `createPhysicsWorld()`: Function to create and configure a physics world
- `applyForceToBody()`: Helper for applying forces to physics bodies
- `PhysicsObjects`: Interface for the physics object container

### `visualization.ts`

Functions for creating and updating visual representations of physics objects:

- `createBoxVisualization()`: Creates a 3D box mesh for a physics body
- `createSphereVisualization()`: Creates a 3D sphere mesh for a physics body
- `createLineVisualization()`: Creates a line between two points
- `updateLineVisualization()`: Updates a line's position based on physics constraints

### `rope.ts`

Functions for creating rope physics with segments and constraints:

- `createRope()`: Creates a single rope connecting two bodies using local attachment points
- `createRopes()`: Creates multiple ropes with different attachment points on the platform

The rope system connects bodies using local attachment points, which ensures that:
1. Ropes are properly attached to specific points on the bodies
2. Rope attachments move with the bodies when they rotate or translate
3. Forces are properly transmitted through the attachment points

### `ui.ts`

UI components for interactive controls:

- `createPlatformButtons()`: Creates buttons for controlling the platform
- `createSphereButtons()`: Creates buttons for controlling the sphere
- `ButtonController`: Interface for button controllers

### `gui.ts`

GUI components for physics parameter controls:

- `setupPhysicsControls()`: Sets up the physics control panel in the GUI
- `storeInitialPositions()`: Stores initial positions for reset functionality
- `findControllerByProperty()`: Helper to find GUI controllers by property name
- `PhysicsControlSettings`: Interface for physics control settings

### `core.ts`

Core setup for the physics simulation:

- `setupScene()`: Sets up the Three.js scene, camera, and renderer
- `setupLighting()`: Configures scene lighting
- `createBasicPhysicsObjects()`: Creates the basic platform and sphere objects
- `updateVisuals()`: Updates visual representations to match physics state, properly handling constraint lines using world-space transformation of attachment points
- `PhysicsScene`: Interface for the basic physics scene setup

### `index.tsx`

Main entry point that brings everything together:

- `load`: Async function that initializes the physics simulation, sets up the animation loop, and handles physics updates
- `unload`: Cleans up resources and stops the animation loop when the simulation is unloaded
- Manages keyboard input, UI buttons, and physics updates
- Handles the internal animation loop using requestAnimationFrame

The simulation follows the standard story pattern:
1. It initializes resources in the `load` function
2. It sets up and runs its own animation loop internally
3. It cleans up resources in the `unload` function

## Physics Rope System

The rope system works by:

1. **Local Attachment Points**: Ropes are attached to specific local points on the platform and sphere
   - The platform has ropes attached at each of its four corners (bottom face)
   - Each rope has a unique color for visual distinction (red, green, blue, yellow)
   - The attachment points use local coordinates relative to each body's center
2. **Segment Chain**: Each rope consists of multiple small physics bodies connected by constraints
3. **Constraint Visualization**: Visual lines track the positions of constraints, updating in real-time as physics bodies move
4. **Force Transmission**: Forces applied to the platform or sphere are transmitted through the rope physics

## Usage

To use the physics simulation, simply import and load it with your story options:

```jsx
import PhysicsChain from "./stories/physics";

// In your application:
await PhysicsChain.load({
  scene,
  camera,
  renderer,
  gui,
  controls
});

// Later, when you want to unload the simulation:
await PhysicsChain.unload();
```

The simulation handles its own animation loop internally, so there's no need to integrate it with your application's main loop.

## Extending the Simulation

To add new functionality:

1. Add utility functions and constants to `helpers.ts`
2. Add new visualization methods to `visualization.ts`
3. Create new physics objects in their appropriate files
4. Add UI controls in `ui.ts`
5. Add GUI parameters in `gui.ts`
6. Update the main loop in `index.tsx` as needed

## Performance Considerations

- The physics simulation runs at an optimal frame rate for smoother physics
- Visual updates are synchronized with the physics world updates
- Auto-rotation and camera controls are optimized for smooth movement 
- Constraint visualization is optimized by using proper world-space transformation 