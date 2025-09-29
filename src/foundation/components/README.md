# Three.js Component Architecture

This directory contains the new standardized component architecture for Lanzarote3D, providing a robust foundation for creating, managing, and optimizing Three.js components.

## Architecture Overview

The component system consists of several key layers:

### Core Interfaces (`base/IThreeComponent.ts`)
- **IThreeComponent**: Unified interface for all Three.js components
- **ComponentLifecycle**: Lifecycle management hooks
- **ComponentMetadata**: Component identification and debugging info
- **ComponentMetrics**: Performance tracking and memory usage

### Base Classes

#### `BaseThreeComponent` (`base/BaseThreeComponent.ts`)
Abstract base class providing:
- Lifecycle state management
- Performance metrics tracking
- Error handling and validation
- Resource cleanup utilities
- Event callback management

#### `SimpleThreeComponent` (`base/SimpleThreeComponent.ts`)
For components that create geometry procedurally:
- Material sharing through ResourceManager
- Geometry pooling for repeated shapes
- Fast instantiation without async loading
- Transform and material options

#### `AsyncThreeComponent` (`base/AsyncThreeComponent.ts`)
For components that load external resources:
- Standardized resource loading with progress tracking
- Concurrent loading with dependency management
- Resource caching and sharing
- Graceful error handling and fallbacks

### Resource Management (`systems/ResourceManager.ts`)
Centralized system for:
- Material sharing and pooling
- Geometry instance management
- Texture caching with automatic disposal
- Memory usage tracking
- Automatic cleanup of unused resources

### Component Factory (`factory/ComponentFactory.ts`)
Factory pattern providing:
- Component registration and discovery
- Dependency injection and resolution
- Configuration-based component creation
- Component caching and reuse
- Hot-reloading support for development

## Usage Examples

### Basic Component Creation

```typescript
import { Tree } from './scenery/trees/TreeComponent';
import { componentFactory } from './factory/ComponentFactory';

// Register component
componentFactory.register('tree', {
  constructor: Tree,
  metadata: {
    name: 'Tree',
    version: '2.0.0',
    description: 'Procedural tree component'
  },
  defaultOptions: {
    trunkHeight: 50,
    style: 'default'
  },
  category: 'scenery'
});

// Create component using factory
const result = await componentFactory.create('tree', {
  style: 'pine',
  position: new THREE.Vector3(100, 0, 100)
});

const tree = result.component;
const treeObject = await tree.load();
scene.add(treeObject);
```

### Resource Management

```typescript
import { resourceManager } from './systems/ResourceManager';

// Get shared material
const material = resourceManager.getMaterial('wood', {
  type: 'standard',
  color: 0x8B4513,
  roughness: 0.8
});

// Get cached geometry
const geometry = resourceManager.getGeometry('trunk', () =>
  new THREE.CylinderGeometry(1, 1, 10, 8)
);

// Monitor resource usage
const stats = resourceManager.getStats();
console.log(`Memory usage: ${stats.memoryUsage.total / 1024 / 1024} MB`);
```

### Component Lifecycle

```typescript
// Load component
const component = new Tree(options);
const object = await component.load();

// Update each frame
component.update(deltaTime);

// Toggle visibility
component.setVisible(false);

// Validate state
const issues = component.validate();
if (issues.length > 0) {
  console.warn('Component issues:', issues);
}

// Serialize state
const state = component.serialize();

// Cleanup
component.dispose();
```

## Migration Guide

### From Old Pattern
```typescript
// Old pattern
class OldTree {
  load(): THREE.Group {
    const tree = new THREE.Group();
    // Manual geometry/material creation
    // No resource sharing
    // No lifecycle management
    return tree;
  }
}
```

### To New Pattern
```typescript
// New pattern
class NewTree extends SimpleThreeComponent {
  constructor(options: TreeOptions = {}) {
    super({
      name: 'Tree',
      version: '2.0.0',
      description: 'Modern tree component'
    }, options);
  }

  protected async createObject(): Promise<THREE.Object3D> {
    // Automatic resource sharing
    // Built-in lifecycle management
    // Performance tracking
    return treeGroup;
  }
}
```

## Benefits

### For Developers
- **Consistent API**: All components follow the same interface
- **Resource Sharing**: Automatic material/geometry pooling
- **Error Handling**: Standardized error management
- **Performance**: Built-in metrics and optimization
- **Debugging**: Validation and introspection tools

### For Performance
- **Memory Efficiency**: Shared resources reduce memory usage
- **Load Times**: Resource caching improves loading performance
- **Cleanup**: Automatic disposal prevents memory leaks
- **Monitoring**: Real-time performance metrics

### For Maintenance
- **Type Safety**: Full TypeScript integration
- **Documentation**: Self-documenting metadata system
- **Testing**: Standardized validation and testing hooks
- **Refactoring**: Clear separation of concerns

## Component Categories

### Scenery
- Trees, rocks, buildings, natural features
- Example: `Tree`, `House`

### Vehicles
- Paragliders, boats, aircraft
- Example: `ParagliderComponent`, `BoatComponent`

### Characters
- Pilots, people, animals
- Example: `Pilot`, `BirdComponent`

### Environment
- Sky, water, clouds, weather effects
- Example: `CloudComponent`, `SkyComponent`

### UI
- 3D interface elements, trajectories, indicators
- Example: `TrajectoryComponent`, `WindIndicatorComponent`

## Best Practices

### Component Design
1. **Single Responsibility**: Each component should have one clear purpose
2. **Resource Sharing**: Use ResourceManager for materials and geometries
3. **Options Pattern**: Make components configurable through options
4. **Validation**: Implement proper option validation
5. **Documentation**: Include comprehensive metadata

### Performance
1. **LOD Support**: Implement level-of-detail for complex components
2. **Instancing**: Use geometry instancing for repeated elements
3. **Lazy Loading**: Only load resources when needed
4. **Cleanup**: Always implement proper disposal

### Error Handling
1. **Graceful Degradation**: Provide fallbacks for failed resources
2. **Validation**: Validate inputs and state
3. **Logging**: Use consistent logging patterns
4. **Recovery**: Handle and recover from errors gracefully

## Future Enhancements

- **LOD System**: Automatic level-of-detail management
- **Instancing Support**: Built-in geometry instancing
- **Animation System**: Standardized animation framework
- **Serialization**: Full scene serialization/deserialization
- **Hot Reloading**: Development-time component reloading
- **WebWorker Support**: Background processing for heavy operations

## Files Structure

```
foundation/components/
├── base/                    # Core interfaces and base classes
│   ├── IThreeComponent.ts   # Main interface definition
│   ├── BaseThreeComponent.ts # Abstract base implementation
│   ├── SimpleThreeComponent.ts # For procedural components
│   ├── AsyncThreeComponent.ts  # For resource-loading components
│   └── index.ts            # Exports
├── factory/                # Component factory and registration
│   └── ComponentFactory.ts # Factory pattern implementation
├── examples/               # Usage examples and demos
│   └── ComponentArchitectureExample.ts # Complete example
├── scenery/               # Scene objects (trees, rocks, buildings)
│   └── TreeComponent.ts   # Example refactored component (Tree class)
├── vehicles/              # Moving objects (boats, aircraft)
├── characters/            # People and animals
├── environment/           # Sky, water, weather
├── ui/                    # 3D interface elements
└── README.md             # This file
```

This architecture provides a solid foundation for building scalable, maintainable, and performant Three.js applications.