# Components

Every model in the scenes (boats, houses, cacti, aircraft, pilots, gliders) is a component in
`src/foundation/components/`. A component builds its `THREE.Object3D` once, on `load()`, and owns it
until `dispose()`.

## The base classes

```
BaseThreeComponent          load / dispose / update / visibility / metrics
└─ SimpleThreeComponent     shared geometry + material cache, transforms, shadows
   ├─ LODComponent          one builder per level of detail
   ├─ FloatingThreeComponent  bobs on the sea (FloatingBehavior)
   │  └─ MovableBoatComponent  plus a movement pattern
   └─ MovableCarComponent   drives along a path
```

All of them live in `src/foundation/components/base/`.

- **`BaseThreeComponent`** runs the lifecycle. `load()` calls the subclass's `createObject()` once,
  caches the result, and records load time, vertex and triangle counts. `dispose()` releases it.
- **`SimpleThreeComponent`** implements `createObject()` as a template method: it calls
  `createContent()`, then applies the `position` / `rotation` / `scale` and shadow options. Its
  default `createContent()` builds one mesh from `createGeometry()`, and fetches both the geometry
  and the material through `resourceManager`, so identical parts are shared rather than duplicated.

## Two ways to build a component

### Override `createContent()` for procedural models

Use this when the model is built from three.js primitives and nothing has to load. Return a `Group`
of meshes; transforms and shadows are still applied for you.

Used by Cessna, Hercules, Park, Pool, Stone, ProceduralRoad, the cacti and every boat.
`LODComponent` is the same pattern: its `createContent()` picks `createUltraLowLODContent()`,
`createLowLODContent()`, `createMediumLODContent()` or `createHighLODContent()` from the
`levelOfDetail` option. Barn, House, DesertHouse, DesertHouseWithPool, Townhouse and Villa use it.

```typescript
class Stone extends SimpleThreeComponent {
  protected createGeometry() {
    return new THREE.DodecahedronGeometry(1);
  }

  protected override createContent(): THREE.Object3D {
    const group = new THREE.Group();
    // build meshes here
    return group;
  }
}
```

### Override `createObject()` to load files or compose components

Use this when building is asynchronous: loading an `.obj`, or loading child components and
assembling them. Transforms and shadows are no longer applied for you: call `applyTransforms()`
and `applyShadows()` if you need them, or position the result from the scene.

Used by ParagliderVoxel and Hangglider (a glider or wing plus a pilot), PilotVoxel (loads the voxel
`.obj` and texture through `OBJLoader`), Pilot, PilotHead, BaseHead, HangGliderWing, and the floating
and movable bases.

```typescript
class ParagliderVoxel extends SimpleThreeComponent {
  protected override async createObject(): Promise<THREE.Object3D> {
    const group = new THREE.Object3D();
    this.glider = new Glider(options.glider);
    group.add(await this.glider.load());
    this.pilot = new PilotVoxel(options.pilot);
    group.add(await this.pilot.load()); // then offset and scale the pilot into the harness
    return group;
  }
}
```

## Pitfalls

- **`load()` is async.** Add the object to the scene after `await component.load()`, not before.
- **Shared resources are reference-counted.** `dispose()` on a `SimpleThreeComponent` releases its
  cached geometry and material keys. If you create extra geometry outside `resourceManager`, dispose
  of it yourself.
- **Child components are yours to dispose.** A composite that loads other components in
  `createObject()` must dispose of them in its own `dispose()`.
