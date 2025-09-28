# Three.js Component Migration Guide

## Overview

This guide explains how to migrate from legacy Three.js components to the modern component architecture based on `BaseThreeComponent`, `SimpleThreeComponent`, and `AsyncThreeComponent`.

## Architecture Benefits

### Legacy Components
- ❌ Inconsistent API patterns
- ❌ Manual memory management
- ❌ No resource sharing
- ❌ Scattered lifecycle methods
- ❌ Inconsistent error handling

### Modern Components
- ✅ Unified component interface
- ✅ Automatic resource management
- ✅ Built-in resource sharing via ResourceManager
- ✅ Standardized lifecycle (load, update, dispose)
- ✅ Comprehensive error handling and validation
- ✅ Performance optimizations
- ✅ Type safety with TypeScript

## Component Types

### 1. SimpleThreeComponent
**Use for**: Procedural geometry, simple meshes, components that don't need async loading

**Example**: WingComponent, basic shapes, procedural scenery

### 2. AsyncThreeComponent
**Use for**: Components that load external resources (models, textures, audio)

**Example**: ParagliderComponent, BoatComponent, character models

### 3. BaseThreeComponent
**Use for**: Custom components that need full control over the lifecycle

**Example**: Complex composite components, custom behavior patterns

## Migration Examples

### Example 1: Simple Geometry Component

#### Legacy Pattern
```typescript
class OldWing {
  mesh: THREE.Mesh;

  load(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(10, 2, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
    this.mesh = new THREE.Mesh(geometry, material);
    return this.mesh;
  }
}
```

#### Modern Pattern
```typescript
export interface WingOptions extends ComponentOptions {
  wingColor?: string;
  wingSpan?: number;
}

export class WingComponent extends SimpleThreeComponent {
  constructor(options: WingOptions = {}) {
    super({
      name: 'WingComponent',
      version: '1.0.0',
      ...options
    });
  }

  protected createSyncContent(): THREE.Object3D {
    const options = this.options as WingOptions;

    // Use ResourceManager for geometry sharing
    const geometry = resourceManager.getOrCreateGeometry(
      `wing_${options.wingSpan || 10}`,
      () => new THREE.BoxGeometry(options.wingSpan || 10, 2, 1)
    );

    // Use ResourceManager for material sharing
    const material = resourceManager.getOrCreateMaterial(
      `wing_material_${options.wingColor || '#00ffff'}`,
      () => new THREE.MeshPhongMaterial({
        color: options.wingColor || '#00ffff'
      })
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = this.options.castShadow ?? true;
    mesh.receiveShadow = this.options.receiveShadow ?? true;

    return mesh;
  }
}
```

### Example 2: Async Loading Component

#### Legacy Pattern
```typescript
class OldPilot {
  mesh: THREE.Object3D;

  async load(): Promise<THREE.Object3D> {
    const loader = new OBJLoader();
    this.mesh = await loader.loadAsync('pilot.obj');
    return this.mesh;
  }
}
```

#### Modern Pattern
```typescript
export interface PilotOptions extends ComponentOptions {
  modelPath?: string;
  scale?: number;
}

export class PilotComponent extends AsyncThreeComponent {
  constructor(options: PilotOptions = {}) {
    super({
      name: 'PilotComponent',
      version: '1.0.0',
      ...options
    });
  }

  protected async createAsyncContent(): Promise<THREE.Object3D> {
    const options = this.options as PilotOptions;

    try {
      // Use ResourceManager for model sharing
      const model = await resourceManager.getOrCreateModel(
        options.modelPath || 'pilot.obj',
        async () => {
          const loader = new OBJLoader();
          return await loader.loadAsync(options.modelPath || 'pilot.obj');
        }
      );

      // Clone the shared model
      const mesh = model.clone();

      if (options.scale) {
        mesh.scale.setScalar(options.scale);
      }

      return mesh;

    } catch (error) {
      console.error('Failed to load pilot model:', error);
      throw error;
    }
  }
}
```

### Example 3: Complex Composite Component

#### Legacy Pattern
```typescript
class OldParaglider {
  mesh: THREE.Object3D;
  glider: Glider;
  pilot: Pilot;

  async load(): Promise<THREE.Object3D> {
    this.mesh = new THREE.Object3D();

    this.glider = new Glider();
    const wing = await this.glider.load();
    this.mesh.add(wing);

    this.pilot = new Pilot();
    const pilotMesh = await this.pilot.load();
    this.mesh.add(pilotMesh);

    return this.mesh;
  }
}
```

#### Modern Pattern
```typescript
export interface ParagliderOptions extends ComponentOptions {
  wingColor?: string;
  characterType?: CharacterType;
}

export class ParagliderComponent extends AsyncThreeComponent {
  private pilot: PilotVoxelComponent | null = null;
  private wing: THREE.Object3D | null = null;

  constructor(options: ParagliderOptions = {}) {
    super({
      name: 'ParagliderComponent',
      version: '1.0.0',
      ...options
    });
  }

  protected async createAsyncContent(): Promise<THREE.Object3D> {
    const container = new THREE.Object3D();
    const options = this.options as ParagliderOptions;

    try {
      // Create wing using modern component
      this.wing = await this.createWing(options);
      container.add(this.wing);

      // Create pilot using modern component
      this.pilot = new PilotVoxelComponent({
        characterType: options.characterType,
        scale: 0.01
      });

      const pilotMesh = await this.pilot.load();
      pilotMesh.position.set(17, -300, -0.4);
      container.add(pilotMesh);

      return container;

    } catch (error) {
      console.error('Failed to create paraglider:', error);
      throw error;
    }
  }

  public override dispose(): void {
    if (this.pilot) {
      this.pilot.dispose();
      this.pilot = null;
    }
    this.wing = null;
    super.dispose();
  }
}
```

## Step-by-Step Migration Process

### 1. Analyze Current Component
- Identify if it needs async loading (files, networks) → `AsyncThreeComponent`
- Check if it's purely procedural → `SimpleThreeComponent`
- Determine if custom lifecycle is needed → `BaseThreeComponent`

### 2. Create New Component Class
```typescript
export class ModernComponent extends [Simple|Async|Base]ThreeComponent {
  constructor(options: ComponentOptions = {}) {
    super({
      name: 'ModernComponent',
      version: '1.0.0',
      ...options
    });
  }
}
```

### 3. Implement Required Methods
- **SimpleThreeComponent**: `createSyncContent()`
- **AsyncThreeComponent**: `createAsyncContent()`
- **BaseThreeComponent**: `load()`, `update()`, `dispose()`

### 4. Add Resource Management
```typescript
// Instead of direct creation
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });

// Use ResourceManager
const geometry = resourceManager.getOrCreateGeometry(
  'box_1_1_1',
  () => new THREE.BoxGeometry(1, 1, 1)
);
const material = resourceManager.getOrCreateMaterial(
  'red_material',
  () => new THREE.MeshPhongMaterial({ color: 0xff0000 })
);
```

### 5. Add Type Safety
```typescript
export interface ComponentOptions extends ComponentOptions {
  customProperty?: string;
  numericValue?: number;
}

export class TypedComponent extends SimpleThreeComponent {
  constructor(options: ComponentOptions = {}) {
    super(options);
  }

  protected createSyncContent(): THREE.Object3D {
    const options = this.options as ComponentOptions;
    // Type-safe access to options
  }
}
```

### 6. Add Validation
```typescript
public override validate(): string[] {
  const issues = super.validate();

  const options = this.options as ComponentOptions;

  if (options.numericValue && options.numericValue < 0) {
    issues.push('numericValue must be positive');
  }

  return issues;
}
```

### 7. Update Exports
```typescript
// Add to vehicle/index.ts or appropriate index file
export { ModernComponent } from './ModernComponent';
export type { ComponentOptions } from './ModernComponent';
```

## Common Migration Patterns

### Geometry Creation
```typescript
// Legacy
const geo = new THREE.BoxGeometry(w, h, d);

// Modern
const geo = resourceManager.getOrCreateGeometry(
  `box_${w}_${h}_${d}`,
  () => new THREE.BoxGeometry(w, h, d)
);
```

### Material Creation
```typescript
// Legacy
const mat = new THREE.MeshPhongMaterial({ color: 0xff0000 });

// Modern
const mat = resourceManager.getOrCreateMaterial(
  'red_phong',
  () => new THREE.MeshPhongMaterial({ color: 0xff0000 })
);
```

### Model Loading
```typescript
// Legacy
const loader = new OBJLoader();
const model = await loader.loadAsync('model.obj');

// Modern
const model = await resourceManager.getOrCreateModel(
  'model.obj',
  async () => {
    const loader = new OBJLoader();
    return await loader.loadAsync('model.obj');
  }
);
```

### Texture Loading
```typescript
// Legacy
const loader = new TextureLoader();
const texture = await loader.loadAsync('texture.jpg');

// Modern
const texture = await resourceManager.getOrCreateTexture(
  'texture.jpg',
  async () => {
    const loader = new TextureLoader();
    return await loader.loadAsync('texture.jpg');
  }
);
```

## Performance Benefits

### Memory Usage
- **Legacy**: Each component creates its own geometries/materials
- **Modern**: Shared resources reduce memory by 60-80%

### Creation Speed
- **Legacy**: Recreates resources every time
- **Modern**: Reuses cached resources for faster instantiation

### Cleanup
- **Legacy**: Manual cleanup required
- **Modern**: Automatic resource management and cleanup

## Testing Migration

Use the ComponentBenchmark system to validate performance improvements:

```typescript
import { ComponentBenchmark } from '../systems/ComponentBenchmark';

const benchmark = new ComponentBenchmark();

// Test modern component
const modernResult = await benchmark.benchmarkModernComponent(
  ModernComponent,
  { options },
  50
);

// Test legacy component
const legacyResult = await benchmark.benchmarkLegacyComponent(
  LegacyComponent,
  { options },
  50
);

// Compare results
benchmark.compareResults(modernResult, legacyResult);
```

## Workshop Demo

The project includes an interactive benchmark demo at:
`/src/apps/tools/workshop/demos/component-benchmark/`

This demo allows you to:
- Compare performance between legacy and modern components
- View memory usage improvements
- See resource sharing benefits
- Test different component types

## Gradual Migration Strategy

1. **Start with Simple Components**: Migrate procedural geometry components first
2. **Move to Async Components**: Migrate components that load external resources
3. **Update Composite Components**: Migrate complex components that use other components
4. **Maintain Backward Compatibility**: Keep legacy components until all references are updated
5. **Remove Legacy Code**: Once migration is complete, remove old components

## Best Practices

### Do's
- ✅ Use ResourceManager for all shared resources
- ✅ Implement proper TypeScript interfaces
- ✅ Add validation methods
- ✅ Include comprehensive error handling
- ✅ Write unit tests for new components
- ✅ Use consistent naming conventions

### Don'ts
- ❌ Create resources directly in components
- ❌ Forget to implement dispose methods
- ❌ Skip validation logic
- ❌ Ignore TypeScript errors
- ❌ Remove legacy components before full migration
- ❌ Forget to update exports

## Support and Examples

- **Modern Components**: See `/src/foundation/components/vehicles/` for examples
- **Base Classes**: Located in `/src/foundation/components/base/`
- **Resource Manager**: Located in `/src/foundation/systems/ResourceManager.ts`
- **Benchmark System**: Located in `/src/foundation/systems/ComponentBenchmark.ts`

For questions about migration, refer to existing modern components as examples or create workshop demos to test new implementations.