# FloatingObject Modernization Proposal

## Current State Analysis

### Existing Architecture
- **FloatingObject**: Standalone class with manual mesh management
- **Boat Components**: FishingBoat, SmallSailBoat, SpeedBoat, Yacht all extend FloatingObject
- **Pattern**: Each boat implements `load()` method that creates geometry and calls `this.setMesh()`
- **Animation**: Built-in floating animation with realistic wave simulation

### Issues with Current Approach
1. **No integration** with modern Three.js component architecture
2. **Manual lifecycle management** instead of using component systems
3. **No resource sharing** or performance optimizations
4. **Missing component metadata** and validation
5. **Mixed responsibilities** - geometry creation + animation behavior

## Proposed Solution: FloatingThreeComponent

### Architecture Design

```typescript
// New base class that combines modern component architecture with floating behavior
export abstract class FloatingThreeComponent extends SimpleThreeComponent {
  private floatingBehavior: FloatingBehavior;

  constructor(metadata: ComponentMetadata, options: FloatingComponentOptions) {
    super(metadata, options);
    this.floatingBehavior = new FloatingBehavior({
      scaleMultiplier: options.floatingScale || 1,
      autoStart: options.autoStartFloating ?? true
    });
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const object = await super.createObject();

    // Integrate floating behavior
    if (this.options.autoStartFloating) {
      this.floatingBehavior.attachTo(object);
    }

    return object;
  }

  // Floating control methods
  public startFloating(): void { this.floatingBehavior.start(); }
  public stopFloating(): void { this.floatingBehavior.stop(); }
  public setFloatingScale(scale: number): void { this.floatingBehavior.setScale(scale); }
}
```

### Migration Strategy

#### Phase 1: Create FloatingThreeComponent
1. Extract floating animation logic into `FloatingBehavior` class
2. Create `FloatingThreeComponent` extending `SimpleThreeComponent`
3. Integrate floating behavior with component lifecycle

#### Phase 2: Migrate Boat Components
```typescript
// Before (current)
class FishingBoat extends FloatingObject {
  load(gui?: any): THREE.Group {
    const boat = new THREE.Group();
    // ... create geometry
    this.setMesh(boat);
    return boat;
  }
}

// After (modernized)
class FishingBoat extends FloatingThreeComponent {
  constructor(options: FishingBoatOptions = {}) {
    super({
      name: 'FishingBoat',
      version: '1.0.0',
      description: 'Fishing boat with realistic floating animation'
    }, options);
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const boat = new THREE.Group();
    // ... create geometry using resourceManager for optimization
    return boat;
  }
}
```

#### Phase 3: Update Usage Patterns
```typescript
// Before
const boat = new FishingBoat();
const mesh = boat.load(gui);
scene.add(mesh);

// After
const boat = new FishingBoat(options);
const mesh = await boat.load();
scene.add(mesh);
```

## Benefits of Modernization

### 1. **Consistent Architecture**
- All boat components use the same modern base class pattern
- Standardized component lifecycle and metadata
- Unified resource management and performance optimizations

### 2. **Better Resource Management**
- Geometry and material sharing through ResourceManager
- Automatic disposal and cleanup
- Memory optimization for multiple boat instances

### 3. **Enhanced Features**
- Component validation and error handling
- Performance monitoring and metrics
- Type-safe configuration options
- Shadow and lighting integration

### 4. **Behavior Separation**
- Floating animation as reusable behavior system
- Could be applied to other floating objects (debris, logs, etc.)
- Configurable animation parameters per component

### 5. **Development Experience**
- IntelliSense and type checking for all options
- Consistent API across all boat components
- Easier testing and debugging

## Implementation Files

### New Files to Create
- `src/foundation/components/base/FloatingThreeComponent.ts`
- `src/foundation/systems/behaviors/FloatingBehavior.ts`
- `src/foundation/components/scenery/boats/` (organized boat folder)

### Files to Update
- `src/foundation/components/scenery/FishingBoat.ts`
- `src/foundation/components/scenery/SmallSailBoat.ts`
- `src/foundation/components/scenery/SpeedBoat.ts`
- `src/foundation/components/scenery/Yacht.ts`
- `src/foundation/components/scenery/index.ts` (exports)

### Files to Remove
- `src/foundation/components/scenery/FloatingObject.ts` (replaced by new architecture)

## Migration Timeline

1. **Week 1**: Create FloatingThreeComponent and FloatingBehavior
2. **Week 2**: Migrate one boat component (FishingBoat) as proof of concept
3. **Week 3**: Migrate remaining boat components
4. **Week 4**: Update all usage, remove old FloatingObject, testing

## Backward Compatibility

- Maintain existing public API methods where possible
- Add deprecation warnings for old patterns
- Provide migration guide for existing code
- Keep old FloatingObject temporarily with deprecation notice

## Testing Strategy

- Unit tests for FloatingBehavior animation logic
- Component tests for each modernized boat
- Performance benchmarks comparing old vs new architecture
- Visual regression tests for floating animation accuracy

---

**Conclusion**: This modernization aligns FloatingObject with our established Three.js component architecture while preserving the excellent floating animation behavior. It provides better performance, consistency, and developer experience while maintaining the realistic wave simulation that makes the boats look great.