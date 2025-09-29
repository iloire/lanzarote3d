# FlyingBehavior System Documentation

The FlyingBehavior system provides autonomous 3D flight simulation with realistic physics, obstacle avoidance, and various flight patterns. It's designed for aircraft, drones, birds, and other flying objects in Three.js environments.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration Options](#configuration-options)
- [Flight Patterns](#flight-patterns)
- [Debug Features](#debug-features)
- [Advanced Usage](#advanced-usage)
- [Examples](#examples)
- [API Reference](#api-reference)

## Overview

FlyingBehavior creates natural, autonomous flight with:

- **Realistic Movement**: Physics-based flight with momentum and inertia
- **Obstacle Avoidance**: Automatic collision detection and avoidance
- **Multiple Patterns**: Circular, figure-8, and free-roam flight modes
- **Terrain Awareness**: Height constraints and terrain following
- **Visual Debugging**: Optional arrows showing velocity and orientation
- **Smooth Orientation**: Natural banking, pitching, and directional facing

## Quick Start

```typescript
import { FlyingBehavior, FlightPattern } from '../../foundation/systems/behaviors/FlyingBehavior';

// Create flying behavior
const flyingBehavior = new FlyingBehavior({
  pattern: FlightPattern.CIRCULAR,
  speed: 10.0,
  faceDirection: true,
  forwardAxis: 'x'
});

// Attach to your Three.js object
flyingBehavior.attachTo(yourMesh);

// Start flying
flyingBehavior.start();
```

## Configuration Options

### FlyingBehaviorOptions Interface

```typescript
interface FlyingBehaviorOptions {
  pattern?: FlightPattern;                    // Flight movement pattern
  speed?: number;                            // Movement speed (units/second)
  turnSpeed?: number;                        // Rotation responsiveness
  flightRadius?: number;                     // Radius for circular patterns
  minHeight?: number;                        // Minimum flight altitude
  maxHeight?: number;                        // Maximum flight altitude
  obstacleAvoidanceDistance?: number;        // Detection range for obstacles
  returnDistance?: number;                   // Distance to trigger return to center
  centerPoint?: THREE.Vector3;              // Center point for patterns
  autoStart?: boolean;                       // Start immediately when attached
  faceDirection?: boolean;                   // Orient object toward movement
  forwardAxis?: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';  // Object's forward direction
  debugVectors?: boolean;                    // Show visual debug arrows
}
```

### Option Details

#### Core Movement
- **`pattern`** (default: `FlightPattern.FREE_ROAM`)
  - Controls overall movement behavior
  - See [Flight Patterns](#flight-patterns) for details

- **`speed`** (default: `5.0`)
  - Movement speed in Three.js units per second
  - Higher values = faster movement
  - Typical range: 1.0 - 50.0

- **`turnSpeed`** (default: `2.0`)
  - How quickly the object rotates to face new directions
  - Higher values = more responsive turning
  - Typical range: 0.5 - 10.0

#### Spatial Constraints
- **`flightRadius`** (default: `50`)
  - Radius for circular and figure-8 patterns
  - Distance from center point for roaming patterns
  - Units in Three.js world space

- **`minHeight`** / **`maxHeight`** (default: `3` / `15`)
  - Vertical flight boundaries
  - Object will be constrained between these Y coordinates
  - Useful for keeping objects above ground or below ceiling

#### Avoidance & Navigation
- **`obstacleAvoidanceDistance`** (default: `5`)
  - How far ahead to scan for obstacles
  - Larger values = earlier avoidance reactions
  - Should be proportional to speed and object size

- **`returnDistance`** (default: `flightRadius * 1.5`)
  - Distance from center before returning to flight area
  - Prevents objects from wandering too far
  - Only applies to FREE_ROAM pattern

- **`centerPoint`** (default: `Vector3(0, 0, 0)`)
  - Reference point for patterns and boundaries
  - CIRCULAR and FIGURE_EIGHT patterns orbit around this point
  - FREE_ROAM uses this as the roaming area center

#### Behavior Control
- **`autoStart`** (default: `false`)
  - Whether to begin flying immediately when attached to object
  - If false, call `start()` manually

- **`faceDirection`** (default: `true`)
  - Whether object should rotate to face movement direction
  - Essential for realistic vehicle/creature movement
  - Disable for objects that shouldn't rotate (like floating debris)

- **`forwardAxis`** (default: `'z'`)
  - Which axis represents the object's "forward" direction
  - Used for orientation calculations when `faceDirection` is true
  - Common values: `'x'` for side-facing, `'z'` for front-facing objects

- **`debugVectors`** (default: `false`)
  - Shows visual debug arrows:
    - Red arrow: velocity direction (where moving)
    - Blue arrow: forward direction (where facing)
  - Useful for debugging orientation issues

## Flight Patterns

### FlightPattern.CIRCULAR
Flies in a perfect circle around the center point.

```typescript
const circularFlight = new FlyingBehavior({
  pattern: FlightPattern.CIRCULAR,
  flightRadius: 100,        // Circle radius
  speed: 8.0,               // Constant speed around circle
  centerPoint: new THREE.Vector3(0, 10, 0)
});
```

**Use Cases**: Surveillance drones, orbiting cameras, patrol routes

### FlightPattern.FIGURE_EIGHT
Creates a figure-8 (infinity symbol) flight path.

```typescript
const figureEightFlight = new FlyingBehavior({
  pattern: FlightPattern.FIGURE_EIGHT,
  flightRadius: 75,         // Width/height of figure-8
  speed: 12.0,
  centerPoint: new THREE.Vector3(0, 15, 0)
});
```

**Use Cases**: Aerobatic demonstrations, complex patrol routes, artistic flight paths

### FlightPattern.FREE_ROAM
Autonomous exploration with obstacle avoidance and boundary respect.

```typescript
const freeRoamFlight = new FlyingBehavior({
  pattern: FlightPattern.FREE_ROAM,
  flightRadius: 200,        // Roaming area radius
  returnDistance: 300,      // Max distance before returning
  speed: 15.0,
  obstacleAvoidanceDistance: 25,
  centerPoint: new THREE.Vector3(0, 20, 0)
});
```

**Use Cases**: Wildlife simulation, autonomous exploration, realistic AI behavior

## Debug Features

### Visual Debug Vectors

Enable debug vectors to visualize flight behavior:

```typescript
const debugFlight = new FlyingBehavior({
  debugVectors: true,       // Enable visual debug arrows
  faceDirection: true,
  // ... other options
});
```

**Debug Arrow Meanings**:
- **Red Arrow (VelocityVector)**: Shows current movement direction
- **Blue Arrow (ForwardVector)**: Shows where object is facing

**Debugging faceDirection Issues**:
- Arrows should align when `faceDirection: true` works correctly
- Misaligned arrows indicate orientation problems
- Check `forwardAxis` setting if arrows point in wrong directions

### Console Logging

The system provides automatic debug logging (1% of frames to avoid spam):

```
🔄 FlyingBehavior orientation: {
  direction: [0.5, 0, 0.866],      // Target movement direction
  currentRotation: [0, 0.52, 0],   // Current object rotation
  targetRotation: [0, 0.61, 0],    // Target rotation
  rotationSpeed: 0.12              // Applied rotation speed
}
```

## Advanced Usage

### Obstacle Avoidance

Add obstacles that the flying object will avoid:

```typescript
// Add individual obstacles
flyingBehavior.addObstacle(wallMesh);
flyingBehavior.addObstacle(buildingMesh);

// Add multiple obstacles
const obstacles = [wall1, wall2, tower];
flyingBehavior.addObstacles(obstacles);
```

### Terrain Following

Set terrain for height detection and ground avoidance:

```typescript
flyingBehavior.setTerrain(terrainMesh);
```

The object will maintain altitude above the terrain surface.

### Dynamic Control

Control flight behavior at runtime:

```typescript
// Start/stop flight
flyingBehavior.start();
flyingBehavior.stop();

// Check status
if (flyingBehavior.isFlying()) {
  console.log('Currently flying');
}

// Update center point dynamically
flyingBehavior.updateCenterPoint(new THREE.Vector3(100, 20, -50));

// Clean up
flyingBehavior.dispose();
```

### Orientation System

The orientation system provides realistic aircraft-like movement:

- **Natural Banking**: Up to ±22.5° roll in turns
- **Pitch Control**: Up to ±30° pitch for altitude changes
- **Responsive Turning**: Configurable turn speed (default 3x more responsive than v1.0)
- **Stability Limits**: Prevents unrealistic extreme rotations

## Examples

### Basic Flying Bird

```typescript
import { FlyingBehavior, FlightPattern } from './FlyingBehavior';

// Create a bird that flies in circles
const birdFlight = new FlyingBehavior({
  pattern: FlightPattern.CIRCULAR,
  speed: 8.0,
  flightRadius: 150,
  minHeight: 10,
  maxHeight: 50,
  faceDirection: true,
  forwardAxis: 'x',
  autoStart: true
});

birdFlight.attachTo(birdMesh);
```

### Drone with Obstacle Avoidance

```typescript
// Autonomous exploration drone
const droneFlight = new FlyingBehavior({
  pattern: FlightPattern.FREE_ROAM,
  speed: 12.0,
  flightRadius: 300,
  obstacleAvoidanceDistance: 30,
  minHeight: 20,
  maxHeight: 100,
  faceDirection: true,
  forwardAxis: 'z',
  debugVectors: process.env.NODE_ENV === 'development'
});

droneFlight.attachTo(droneMesh);
droneFlight.addObstacles([building1, building2, tower]);
droneFlight.start();
```

### Aerobatic Aircraft

```typescript
// High-speed aerobatic display
const aerobatic = new FlyingBehavior({
  pattern: FlightPattern.FIGURE_EIGHT,
  speed: 25.0,
  turnSpeed: 5.0,           // High responsiveness for tight turns
  flightRadius: 200,
  minHeight: 30,
  maxHeight: 200,
  faceDirection: true,
  forwardAxis: 'x',
  centerPoint: new THREE.Vector3(0, 100, 0)
});

aerobatic.attachTo(aircraftMesh);
```

### Flying Camera

```typescript
// Cinematic camera movement
const cameraFlight = new FlyingBehavior({
  pattern: FlightPattern.CIRCULAR,
  speed: 3.0,               // Slow for smooth cinematics
  turnSpeed: 1.0,           // Gentle turns
  flightRadius: 250,
  faceDirection: false,     // Camera points separately from movement
  autoStart: true,
  centerPoint: subjectPosition
});

cameraFlight.attachTo(cameraRig);
```

## API Reference

### Constructor

```typescript
new FlyingBehavior(options?: FlyingBehaviorOptions)
```

### Methods

#### Core Control
- `attachTo(object: THREE.Object3D)` - Attach behavior to Three.js object
- `start()` - Begin flying behavior
- `stop()` - Stop flying behavior
- `dispose()` - Clean up resources and remove from scene

#### Status
- `isFlying(): boolean` - Check if currently flying

#### Obstacles & Terrain
- `addObstacle(obstacle: THREE.Object3D)` - Add single obstacle
- `addObstacles(obstacles: THREE.Object3D[])` - Add multiple obstacles
- `setTerrain(terrain: THREE.Mesh)` - Set terrain for height detection

#### Dynamic Updates
- `updateCenterPoint(point: THREE.Vector3)` - Change center point during flight

### Events & Callbacks

The system operates autonomously but you can monitor state through:

- Console debug logs (when enabled)
- Visual debug vectors (when enabled)
- Object position/rotation changes in your animation loop

## Performance Considerations

### Optimization Tips

1. **Obstacle Count**: Limit obstacles to essential collision objects
2. **Debug Vectors**: Disable in production (`debugVectors: false`)
3. **Update Frequency**: The system runs at ~60fps by default
4. **Avoidance Distance**: Match to object speed and size for efficiency

### Recommended Settings by Use Case

#### Slow Ambient Objects (birds, butterflies)
```typescript
{ speed: 2-8, turnSpeed: 1-3, obstacleAvoidanceDistance: 5-10 }
```

#### Medium Speed Vehicles (drones, aircraft)
```typescript
{ speed: 10-20, turnSpeed: 2-5, obstacleAvoidanceDistance: 15-25 }
```

#### Fast Objects (racing, combat)
```typescript
{ speed: 25-50, turnSpeed: 3-8, obstacleAvoidanceDistance: 30-50 }
```

## Troubleshooting

### Common Issues

**Object not facing movement direction**
- Check `faceDirection: true` is set
- Verify `forwardAxis` matches your object's orientation
- Enable `debugVectors: true` to visualize the problem

**Object moving sideways/backwards**
- Incorrect `forwardAxis` setting
- Object mesh may need rotation adjustment
- Check with debug vectors (red = movement, blue = facing)

**Erratic or jittery movement**
- `turnSpeed` too high (try reducing to 1-3)
- `obstacleAvoidanceDistance` too small for the object's speed
- Multiple conflicting obstacles in close proximity

**Object leaving flight area**
- Increase `returnDistance` value
- Check `centerPoint` is correctly positioned
- For FREE_ROAM, ensure `flightRadius` is appropriate

**Poor obstacle avoidance**
- Increase `obstacleAvoidanceDistance`
- Reduce `speed` for tighter spaces
- Increase `turnSpeed` for more responsive avoidance
- Ensure obstacles have proper collision geometry

### Debug Workflow

1. Enable `debugVectors: true`
2. Enable console logging (automatic at 1% frequency)
3. Check red/blue arrow alignment for orientation issues
4. Adjust `forwardAxis` if arrows point wrong direction
5. Monitor console logs for rotation data
6. Test with simple obstacle-free environment first

## Version History

### v2.0.0 (Current)
- Added visual debug vectors
- Improved 3D orientation with natural banking
- Increased rotation responsiveness
- Added pitch and roll limits for stability
- Enhanced obstacle avoidance algorithms

### v1.0.0
- Initial implementation
- Basic flight patterns
- Simple obstacle avoidance
- Horizontal-only orientation