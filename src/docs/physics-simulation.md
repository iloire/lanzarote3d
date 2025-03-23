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

- `createRope()`: Creates a single rope connecting two bodies
- `createRopes()`: Creates multiple ropes with different attachment points

### `ui.ts`

UI components for interactive controls:

- `createPlatformButtons()`: Creates buttons for controlling the platform
- `createSphereButtons()`: Creates buttons for controlling the sphere
- `createAntiGravityButton()`: Creates an anti-gravity button with visual effects
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
- `updateVisuals()`: Updates visual representations to match physics state
- `PhysicsScene`: Interface for the basic physics scene setup

### `index.tsx`

Main entry point that brings everything together:

- Imports and uses all the modular components
- Sets up the main rendering loop
- Handles keyboard input and event listeners
- Manages the animation and physics steps
- Provides cleanup functionality

## Usage

To use the physics simulation, simply import and render the `PhysicsChain` component:

```jsx
import PhysicsChain from "./stories/physics";

const App = () => {
  return (
    <div id="container">
      {PhysicsChain.render({})}
    </div>
  );
};
```

## Extending the Simulation

To add new functionality:

1. Add utility functions and constants to `helpers.ts`
2. Add new visualization methods to `visualization.ts`
3. Create new physics objects in their appropriate files
4. Add UI controls in `ui.ts`
5. Add GUI parameters in `gui.ts`
6. Update the main loop in `index.tsx` as needed

## Performance Considerations

- The physics simulation runs at a high FPS (160) for smoother physics
- Visual updates are synchronized with the physics world updates
- Auto-rotation and camera controls are optimized for smooth movement 