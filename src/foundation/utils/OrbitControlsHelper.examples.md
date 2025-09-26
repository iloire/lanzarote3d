# OrbitControlsHelper Usage Examples

The `OrbitControlsHelper` utility provides a reusable way to apply consistent orbit control limits and settings across different apps.

## Basic Usage

### 1. Apply a Preset

```typescript
import { OrbitControlsHelper } from '../../../foundation/utils/OrbitControlsHelper';

// Apply a predefined preset
OrbitControlsHelper.applyPreset(controls, 'closeSubject');
OrbitControlsHelper.applyPreset(controls, 'landscape');
OrbitControlsHelper.applyPreset(controls, 'freeExploration');
OrbitControlsHelper.applyPreset(controls, 'cinematic');
OrbitControlsHelper.applyPreset(controls, 'unlimited');
```

### 2. Focus on a Target with Limits

```typescript
const targetPosition = new THREE.Vector3(100, 50, 200);

// Focus on target and apply close subject limits
OrbitControlsHelper.focusOnTarget(
  controls,
  targetPosition,
  OrbitControlsHelper.ORBIT_CONTROLS_PRESETS.closeSubject
);
```

### 3. Create Custom Centered Limits

```typescript
const paragliderPosition = new THREE.Vector3(6897, 920, -705);

// Create limits centered around the paraglider
const customLimits = OrbitControlsHelper.createCenteredLimits(
  paragliderPosition,
  {
    minDistance: 50,
    maxDistance: 1000,
    rotateSpeed: 0.3,
    zoomSpeed: 0.5,
    panSpeed: 0.4,
    enableDamping: true,
    dampingFactor: 0.1
  }
);

OrbitControlsHelper.applyLimits(controls, customLimits);
```

### 4. Animation Loop Integration

```typescript
// In your animation loop
const animate = () => {
  // Update performance monitoring
  this.updatePerformance();

  // Update controls for damping (replaces manual controls.update())
  OrbitControlsHelper.update(controls);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
```

## Available Presets

### `closeSubject`
Perfect for focusing on a specific object like a paraglider or character:
- Close distance limits (50-1000 units)
- Restricted polar angles to prevent going too high/low
- Tight pan boundary (300 units radius)
- Slow, smooth movement speeds
- Damping enabled for smooth motion

### `landscape`
Good for terrain and landscape exploration:
- Medium distance limits (100-5000 units)
- Wider angle limits
- Larger pan boundary (2000 units radius)
- Moderate movement speeds
- Light damping

### `freeExploration`
For large open scenes with minimal restrictions:
- Wide distance limits (10-50000 units)
- Nearly unlimited angles
- Large pan boundary (10000 units radius)
- Fast movement speeds
- Minimal damping

### `cinematic`
For smooth, cinematic camera movements:
- Moderate distance limits
- Very slow movement speeds
- Heavy damping for smooth motion
- Optional auto-rotation

### `unlimited`
No restrictions - full user control:
- No distance, angle, or pan limits
- Normal movement speeds
- No damping
- No auto-rotation

## Real-World Examples

### Animation App (Close Subject Focus)
```typescript
// After animation completes, focus on paraglider
const pgPos = paraglidersVoxel[0]?.position || new THREE.Vector3();
OrbitControlsHelper.focusOnTarget(controls, pgPos,
  OrbitControlsHelper.createCenteredLimits(pgPos, {
    ...OrbitControlsHelper.ORBIT_CONTROLS_PRESETS.closeSubject,
    minDistance: 50,
    maxDistance: 1000,
    panBoundary: {
      center: pgPos,
      radius: 300,
      verticalScale: 0.5
    }
  })
);
```

### PhotoBooth App (Landscape Exploration)
```typescript
// Focus on scene center with landscape viewing
const lookAtPos = new THREE.Vector3(6500, 600, -200);
OrbitControlsHelper.focusOnTarget(controls, lookAtPos,
  OrbitControlsHelper.ORBIT_CONTROLS_PRESETS.landscape
);
```

### Workshop/Terrain App (Free Exploration)
```typescript
// Allow wide exploration of terrain
OrbitControlsHelper.applyPreset(controls, 'freeExploration');
```

## Custom Configuration

You can create completely custom limits:

```typescript
const customLimits = {
  minDistance: 20,
  maxDistance: 2000,
  minPolarAngle: Math.PI * 0.1,
  maxPolarAngle: Math.PI * 0.9,
  panBoundary: {
    center: new THREE.Vector3(0, 0, 0),
    radius: 500,
    verticalScale: 0.3
  },
  rotateSpeed: 0.4,
  zoomSpeed: 0.6,
  panSpeed: 0.5,
  enableDamping: true,
  dampingFactor: 0.08,
  autoRotate: false
};

OrbitControlsHelper.applyLimits(controls, customLimits);
```

## Tips

1. **Always call in animation loop**: If using damping, call `OrbitControlsHelper.update(controls)` in your animation loop.

2. **Use presets as starting points**: Customize presets rather than building from scratch.

3. **Match limits to content**: Use `closeSubject` for detailed objects, `landscape` for terrain, `freeExploration` for large scenes.

4. **Consider user experience**: Slower speeds with damping feel more professional and less jarring.

5. **Test thoroughly**: Different limits work better for different camera positions and scene scales.