# Workshop Demo Architecture

## Overview
The workshop system now uses specialized base classes to provide clean environments for showcasing individual 3D components without heavy dependencies like the island terrain model.

## App Base Class Hierarchy

### WorkshopDemoBase (for individual component demos)
Automatically provides:
- Clean environment (hides terrain and water)
- Optional ground plane with configurable color/size
- Proper lighting setup
- Helper creation
- Standard label utilities
- Animation loop utilities

### ToolBase (for tools like main workshop)
Provides flexible environment control:
- Option to hide terrain/water via `hideEnvironment` flag
- Custom lighting setup
- Development helpers

## Best Practices for Workshop Demos

### 1. Extend WorkshopDemoBase
Create workshop demos by extending the specialized base class:

```typescript
import { WorkshopDemoBase } from '../../../shared/WorkshopDemoBase';

class MyComponentDemo extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'My Component Demo',
      description: 'Showcase of my component',
      ground: {
        create: true,
        size: { width: 1000, height: 1000 },
        color: 0x8fbc8f, // Choose appropriate color
        opacity: 0.3,
      },
      lighting: {
        sunPosition: 12,
        showHelpers: true,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    // Environment is automatically clean - just add your components
    this.initializeCore(options); // Sets up clean environment

    const { scene, camera, renderer, controls } = options;

    // Create your components here
    // Use this.createLabelContainer() and this.createStandardLabel()
    // Use this.startAnimationLoop() for consistent animation

    this.isLoaded = true;
  }
}
```

### 2. Configuration Options

#### Ground Configuration
- `create`: Whether to create a ground plane (default: true)
- `size`: Size of the ground plane `{ width: number, height: number }`
- `color`: Ground color (use appropriate colors for your demo)
- `opacity`: Ground transparency

#### Lighting Configuration
- `sunPosition`: Sun position for lighting (0-24 hours)
- `showHelpers`: Whether to show debug helpers

### 3. Built-in Utilities

#### Label Creation
```typescript
// Create label container
this.labelContainer = this.createLabelContainer();

// Create styled labels
const label = this.createStandardLabel('Component Name', 'Additional info');
this.labelContainer.appendChild(label);
```

#### Animation Loop
```typescript
this.startAnimationLoop(renderer, scene, camera, controls, () => {
  // Your per-frame updates here
});
```

### 4. Export Pattern
Follow the singleton pattern for compatibility with the Stories system:

```typescript
// Create singleton instance
const myDemoApp = new MyComponentDemo();

// Export in expected format
const MyDemo = {
  load: async (options: StoryOptions) => myDemoApp.load(options),
  dispose: () => myDemoApp.dispose(),
  getAppInfo: () => myDemoApp.getAppInfo(),
};

export default MyDemo;
```

## Benefits of the New Architecture

### No Boilerplate
- Zero environment setup code in individual demos
- Automatic terrain/water hiding
- Consistent ground plane and lighting

### Performance
- No heavy island model loading for component demos
- Clean, focused rendering

### Maintainability
- Environment logic centralized in base classes
- Consistent patterns across all demos
- Easy to modify global behavior

### Type Safety
- Proper inheritance hierarchy
- Configuration interfaces for type checking

## Migration from Old Pattern

### Before (old pattern)
```typescript
const MyDemo = {
  load: async (options: StoryOptions) => {
    const { terrain, water, sky, controls } = options;

    controls.enabled = true;
    terrain.visible = false;
    water.visible = false;
    sky.updateSunPosition(12);
    Helpers.createHelpers(scene);

    // Create ground plane...
    // Create label container...
    // Set up animation...
    // 50+ lines of boilerplate
  }
};
```

### After (new pattern)
```typescript
class MyDemo extends WorkshopDemoBase {
  constructor() {
    super({ name: 'My Demo', groundColor: 0xffffff });
  }

  async load(options: StoryOptions): Promise<void> {
    this.initializeCore(options); // Everything handled automatically
    // Just add your components - 5 lines instead of 50+
  }
}
```

## Examples
- **Igloo Demo**: `src/apps/tools/workshop/demos/igloo.tsx` - Complete example using WorkshopDemoBase
- **Main Workshop**: `src/apps/tools/workshop/index.tsx` - Example using ToolBase