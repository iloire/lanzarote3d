# Component Composition Architecture

**Last Updated**: October 1, 2025

This document defines the **definitive patterns** for creating Three.js components that work with both synchronous and asynchronous composition in the Lanzarote3D project.

---

## Table of Contents

1. [Overview](#overview)
2. [Base Component Classes](#base-component-classes)
3. [Composition Patterns](#composition-patterns)
4. [Pattern Selection Guide](#pattern-selection-guide)
5. [Examples](#examples)
6. [Migration Guide](#migration-guide)
7. [Common Pitfalls](#common-pitfalls)

---

## Overview

### The Problem

Components in Lanzarote3D often need to compose multiple sub-components, some of which require asynchronous loading (GLTF models, textures, etc.). We need a consistent pattern that works for:

- **Pure procedural geometry** (synchronous)
- **External resource loading** (asynchronous)
- **Composition of other components** (mixed sync/async)

### The Solution

Three distinct patterns using existing base classes:

1. **Pattern A**: SimpleThreeComponent with `createContent()` - Pure procedural/synchronous
2. **Pattern B**: SimpleThreeComponent with `createObject()` override - Async composition
3. **Pattern C**: AsyncThreeComponent - External resource loading

---

## Base Component Classes

### BaseThreeComponent (Abstract)

The foundation for all Three.js components.

**Provides**:
- Lifecycle management (`load()`, `dispose()`, `update()`)
- State tracking (`isLoaded`, `isVisible`, `isDisposed`)
- Performance metrics
- Validation and serialization
- Event callbacks

**Key Method**:
```typescript
protected abstract createObject(): Promise<THREE.Object3D>
```

**Do NOT extend directly** - use SimpleThreeComponent or AsyncThreeComponent instead.

---

### SimpleThreeComponent (extends BaseThreeComponent)

For components that create geometry **procedurally** (using Three.js primitives).

**Best for**:
- Procedural geometry (boxes, spheres, custom shapes)
- Synchronous content creation
- Material sharing via ResourceManager
- Geometry pooling

**Template Methods**:
```typescript
// Required: Define geometry
protected abstract createGeometry(): THREE.BufferGeometry

// Optional: Override for complex multi-mesh components
protected createContent(): THREE.Object3D {
  // Default: creates single mesh from geometry
  const geometry = this.createGeometry();
  const material = this.createMaterial();
  return new THREE.Mesh(geometry, material);
}

// For async sub-component loading (Pattern B)
protected async createObject(): Promise<THREE.Object3D> {
  // Load sub-components asynchronously
  return object;
}
```

**Examples**: Wing, Airliner, Cessna, Jet, Pilot

---

### AsyncThreeComponent (extends BaseThreeComponent)

For components that load **external resources** (GLTF, OBJ, textures).

**Best for**:
- Loading GLTF/GLB models
- Loading OBJ files with textures
- Loading texture maps
- Progress tracking during load
- Resource caching

**Template Methods**:
```typescript
// Required: Define what resources to load
protected abstract getResourceDescriptors(): ResourceDescriptor[]

// Required: Create object from loaded resources
protected abstract createObjectFromResources(
  resources: Map<string, LoadedResource>
): Promise<THREE.Object3D>

// Optional: Provide fallbacks for failed loads
protected getFallbackResources(): Partial<Record<string, any>> {
  return {};
}
```

**Examples**: PilotVoxel

---

## Composition Patterns

### Pattern A: Pure Procedural (SimpleThreeComponent)

**Use when**: Creating geometry from scratch with Three.js primitives.

**Extend**: `SimpleThreeComponent`
**Override**: `createContent()` (synchronous)

```typescript
export class Wing extends SimpleThreeComponent {
  constructor(options: WingOptions = {}) {
    super({
      name: 'Wing',
      version: '1.0.0',
      description: 'Procedural wing geometry',
      tags: ['vehicle', 'wing', 'procedural'],
    }, {
      wingColor: '#FF6B35',
      wingspan: 100,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Placeholder - not used when overriding createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const group = new THREE.Group();

    // Create geometry procedurally
    const wingGeometry = new THREE.BoxGeometry(10, 0.2, 5);
    const wingMaterial = resourceManager.getOrCreateMaterial(
      `wing_${this.options.wingColor}`,
      () => new THREE.MeshStandardMaterial({
        color: this.options.wingColor
      })
    );

    const wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
    group.add(wingMesh);

    return group;
  }
}
```

**Characteristics**:
- ✅ No async operations
- ✅ Fast instantiation
- ✅ Material sharing via ResourceManager
- ✅ Geometry caching

---

### Pattern B: Async Composition (SimpleThreeComponent + createObject override)

**Use when**: Composing multiple sub-components that require async loading.

**Extend**: `SimpleThreeComponent`
**Override**: `createObject()` (asynchronous)

**⚠️ This is the DEFINITIVE pattern for composite vehicles!**

```typescript
export class Hangglider extends SimpleThreeComponent {
  private wing?: HangGliderWing;
  private pilot?: Pilot;
  private pilotMesh?: THREE.Object3D;

  constructor(options: HanggliderOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Hangglider',
      version: '1.0.0',
      description: 'Composite hangglider with pilot and wing',
      tags: ['vehicle', 'aircraft', 'hangglider', 'composite'],
    };

    super(metadata, {
      wingColor: '#FF6B35',
      wingspan: 100,
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Placeholder - not used since we override createObject
    return new THREE.BoxGeometry(1, 1, 1);
  }

  /**
   * Override createObject to compose async sub-components.
   * This is the standard pattern for vehicles that combine
   * multiple loadable components (pilot + wing/body/etc).
   */
  protected override async createObject(): Promise<THREE.Object3D> {
    const group = new THREE.Group();
    group.name = 'Hangglider';

    const options = this.options as HanggliderOptions;

    // Load wing component asynchronously
    this.wing = new HangGliderWing({
      wingColor: options.wingColor,
      wingspan: options.wingspan,
    });
    const wingMesh = await this.wing.load();
    wingMesh.position.set(-40, 10, 0);
    group.add(wingMesh);

    // Load pilot component asynchronously
    this.pilot = new Pilot({
      castShadow: this.options.castShadow,
      receiveShadow: this.options.receiveShadow,
      ...options.pilotOptions,
    });
    this.pilotMesh = await this.pilot.load();
    this.pilotMesh.scale.setScalar(0.03);
    this.pilotMesh.position.set(-5, 0, -0.4);
    this.pilotMesh.rotateY(Math.PI / 2);
    group.add(this.pilotMesh);

    // Apply final transforms
    group.rotateY(-Math.PI / 2 + Math.PI);

    if (options.scale && options.scale !== 1) {
      group.scale.setScalar(options.scale);
    }

    // Apply shadow settings
    this.applyShadows(group);

    return group;
  }

  public override dispose(): void {
    // Dispose sub-components
    if (this.pilot) {
      this.pilot.dispose();
    }
    if (this.wing) {
      this.wing.dispose();
    }

    // Clear references
    this.wing = undefined;
    this.pilot = undefined;
    this.pilotMesh = undefined;

    super.dispose();
  }
}
```

**Characteristics**:
- ✅ Composes multiple async components
- ✅ Works with existing component classes
- ✅ Inherits BaseThreeComponent lifecycle
- ✅ Standard API: `load()`, `getObject()`, `dispose()`
- ⚠️ Bypasses `createContent()` template method
- ⚠️ Must manually dispose sub-components

---

### Pattern C: External Resource Loading (AsyncThreeComponent)

**Use when**: Loading GLTF, OBJ, textures, or other external files.

**Extend**: `AsyncThreeComponent`
**Override**: `getResourceDescriptors()` + `createObjectFromResources()`

```typescript
export class PilotVoxel extends AsyncThreeComponent {
  constructor(options: PilotVoxelOptions = {}) {
    super({
      name: 'PilotVoxel',
      version: '2.0.0',
      description: 'Voxel pilot loaded from OBJ file',
      tags: ['character', 'pilot', 'voxel', 'model'],
    }, options);
  }

  /**
   * Define resources to load
   */
  protected getResourceDescriptors(): ResourceDescriptor[] {
    return [
      {
        id: 'model',
        type: 'model',
        url: this.options.objFile,
      },
      {
        id: 'texture',
        type: 'texture',
        url: this.options.textureFile,
      },
    ];
  }

  /**
   * Create object from loaded resources
   */
  protected async createObjectFromResources(
    resources: Map<string, LoadedResource>
  ): Promise<THREE.Object3D> {
    const modelResource = resources.get('model');
    const textureResource = resources.get('texture');

    if (!modelResource || !textureResource) {
      throw new Error('Required resources not loaded');
    }

    const model = modelResource.data as THREE.Object3D;
    const texture = textureResource.data as THREE.Texture;

    // Clone model to avoid modifying cached version
    const pilotGroup = model.clone();
    pilotGroup.name = 'PilotVoxel';

    // Configure texture
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    // Create and apply material
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
    });

    pilotGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.castShadow = this.options.castShadow ?? true;
        child.receiveShadow = this.options.receiveShadow ?? true;
      }
    });

    return pilotGroup;
  }

  /**
   * Override to use OBJLoader instead of default
   */
  protected override async loadModel(url: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const loader = new OBJLoader();
      loader.load(url, resolve, undefined, reject);
    });
  }
}
```

**Characteristics**:
- ✅ Built-in progress tracking
- ✅ Resource caching and sharing
- ✅ Concurrent loading of multiple resources
- ✅ Fallback support
- ✅ Error handling
- ❌ Cannot directly compose other component classes
- ❌ More boilerplate for simple cases

---

## Pattern Selection Guide

### Decision Tree

```
Do you need to load external files (GLTF, OBJ, textures)?
├─ YES → Do you ONLY load files (no component composition)?
│  ├─ YES → Pattern C (AsyncThreeComponent)
│  └─ NO  → Pattern B (SimpleThreeComponent + createObject)
│
└─ NO → Do you need to compose other components?
   ├─ YES → Do the sub-components need async loading?
   │  ├─ YES → Pattern B (SimpleThreeComponent + createObject)
   │  └─ NO  → Pattern A (SimpleThreeComponent + createContent)
   │
   └─ NO → Pattern A (SimpleThreeComponent + createContent)
```

### Quick Reference Table

| Use Case | Pattern | Base Class | Override Method |
|----------|---------|------------|-----------------|
| Procedural geometry only | A | SimpleThreeComponent | `createContent()` |
| Compose async components | B | SimpleThreeComponent | `createObject()` |
| Load GLTF/OBJ/textures | C | AsyncThreeComponent | `getResourceDescriptors()` + `createObjectFromResources()` |
| Airliner, Wing, Jet | A | SimpleThreeComponent | `createContent()` |
| Hangglider, Paraglider, Tandem | B | SimpleThreeComponent | `createObject()` |
| PilotVoxel, external models | C | AsyncThreeComponent | Resource methods |

---

## Examples

### Example 1: Pure Procedural Aircraft (Pattern A)

```typescript
export class Airliner extends SimpleThreeComponent {
  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.BoxGeometry(1, 1, 1); // Placeholder
  }

  protected override createContent(): THREE.Object3D {
    const airliner = new THREE.Group();

    // Create fuselage
    const fuselageGeometry = new THREE.CylinderGeometry(2, 2, 18, 16);
    const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
    airliner.add(fuselage);

    // Create wings
    const wingGeometry = new THREE.BoxGeometry(3, 0.4, 18);
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, -0.5, -10);
    airliner.add(leftWing);

    return airliner;
  }
}
```

### Example 2: Composite Vehicle (Pattern B)

```typescript
export class Paraglider extends SimpleThreeComponent {
  private glider?: Glider;
  private pilot?: Pilot;

  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.BoxGeometry(1, 1, 1); // Not used
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const group = new THREE.Group();

    // Load glider wing
    this.glider = new Glider(this.options.glider);
    const wing = await this.glider.load();
    wing.translateY(-300);
    group.add(wing);

    // Load pilot
    this.pilot = new Pilot(this.options.pilot);
    const pilotMesh = await this.pilot.load();
    pilotMesh.scale.setScalar(0.03);
    group.add(pilotMesh);

    return group;
  }

  public override dispose(): void {
    this.glider?.dispose();
    this.pilot?.dispose();
    super.dispose();
  }
}
```

### Example 3: External Model Loading (Pattern C)

```typescript
export class CustomCharacter extends AsyncThreeComponent {
  protected getResourceDescriptors(): ResourceDescriptor[] {
    return [
      { id: 'character', type: 'model', url: 'assets/character.glb' },
      { id: 'skin', type: 'texture', url: 'assets/skin.png' },
    ];
  }

  protected async createObjectFromResources(
    resources: Map<string, LoadedResource>
  ): Promise<THREE.Object3D> {
    const character = resources.get('character')!.data as THREE.Object3D;
    const skinTexture = resources.get('skin')!.data as THREE.Texture;

    const clone = character.clone();
    // Apply custom skin texture
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.map = skinTexture;
      }
    });

    return clone;
  }
}
```

---

## Migration Guide

### Migrating Legacy Vehicles to Pattern B

**Before** (Legacy IVehicle pattern):
```typescript
export class Hangglider implements IVehicleWithGUI {
  private mesh?: THREE.Group;

  async load(): Promise<THREE.Group> {
    const group = new THREE.Group();
    // ... composition code
    this.mesh = group;
    return group;
  }

  public getMesh(): THREE.Group {
    if (!this.mesh) throw Error('not loaded');
    return this.mesh;
  }
}
```

**After** (Pattern B - SimpleThreeComponent):
```typescript
export class Hangglider extends SimpleThreeComponent {
  private wing?: HangGliderWing;
  private pilot?: Pilot;

  constructor(options: HanggliderOptions = {}) {
    super({
      name: 'Hangglider',
      version: '1.0.0',
      description: 'Hangglider with pilot',
      tags: ['vehicle', 'aircraft'],
    }, options);
  }

  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.BoxGeometry(1, 1, 1); // Not used
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const group = new THREE.Group();

    this.wing = new HangGliderWing(options);
    const wingMesh = await this.wing.load();
    group.add(wingMesh);

    this.pilot = new Pilot(options);
    const pilotMesh = await this.pilot.load();
    group.add(pilotMesh);

    return group;
  }

  public override dispose(): void {
    this.wing?.dispose();
    this.pilot?.dispose();
    super.dispose();
  }
}
```

**API Changes**:
- `getMesh()` → `getObject()` (BaseThreeComponent standard)
- Must extend `SimpleThreeComponent` instead of implementing `IVehicle`
- Must override `createObject()` for async composition
- Must call `super.dispose()` in dispose method

---

## Common Pitfalls

### ❌ Pitfall 1: Making createContent() Async

```typescript
// WRONG - createContent is synchronous!
protected override async createContent(): Promise<THREE.Object3D> {
  const wing = await this.wing.load(); // TypeScript error
  return wing;
}
```

**Solution**: Override `createObject()` instead:
```typescript
// CORRECT
protected override async createObject(): Promise<THREE.Object3D> {
  const wing = await this.wing.load();
  return wing;
}
```

---

### ❌ Pitfall 2: Not Disposing Sub-Components

```typescript
// WRONG - memory leak!
public override dispose(): void {
  super.dispose(); // Sub-components still loaded in memory
}
```

**Solution**: Dispose all sub-components first:
```typescript
// CORRECT
public override dispose(): void {
  this.wing?.dispose();
  this.pilot?.dispose();
  this.wing = undefined;
  this.pilot = undefined;
  super.dispose();
}
```

---

### ❌ Pitfall 3: Using AsyncThreeComponent for Component Composition

```typescript
// WRONG - AsyncThreeComponent is for file loading, not component composition
export class Paraglider extends AsyncThreeComponent {
  protected getResourceDescriptors(): ResourceDescriptor[] {
    // Can't define Pilot/Glider components as resources!
    return [];
  }
}
```

**Solution**: Use Pattern B (SimpleThreeComponent + createObject):
```typescript
// CORRECT
export class Paraglider extends SimpleThreeComponent {
  protected override async createObject(): Promise<THREE.Object3D> {
    this.pilot = new Pilot();
    const mesh = await this.pilot.load();
    return mesh;
  }
}
```

---

### ❌ Pitfall 4: Forgetting to Call Super Constructor

```typescript
// WRONG - metadata and options not initialized!
constructor(options: MyOptions) {
  this.myField = options.myField;
}
```

**Solution**: Always call super with metadata and options:
```typescript
// CORRECT
constructor(options: MyOptions = {}) {
  super({
    name: 'MyComponent',
    version: '1.0.0',
    description: 'My component',
    tags: ['component'],
  }, {
    ...defaultOptions,
    ...options,
  });
}
```

---

## Summary

### The Definitive Patterns

1. **Pure Procedural**: `SimpleThreeComponent` + override `createContent()`
2. **Async Composition**: `SimpleThreeComponent` + override `createObject()`
3. **External Loading**: `AsyncThreeComponent` + resource methods

### Key Principles

- ✅ Use the **simplest pattern** that meets your needs
- ✅ **Pattern B** is the standard for composite vehicles
- ✅ Always **dispose sub-components** properly
- ✅ Use **consistent API**: `load()`, `getObject()`, `dispose()`
- ✅ Provide **metadata** (name, version, description, tags)
- ❌ Don't mix patterns within a single component
- ❌ Don't make `createContent()` async
- ❌ Don't use `AsyncThreeComponent` for component composition

---

## Related Documentation

- [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) - Issue #4: Inconsistent Vehicle API Pattern
- [API.md](./API.md) - Component API reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall architecture overview

---

**Document Status**: ✅ Complete
**Next Review**: When adding CompositeThreeComponent base class
**Owner**: Architecture Team
