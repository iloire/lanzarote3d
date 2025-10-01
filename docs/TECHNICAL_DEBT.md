# Technical Debt

This document tracks pending technical debt and issues that need to be addressed for improved code quality, performance, and maintainability.

## High Priority Issues

### Confusing Component Base Class Naming
**Status**: ⚠️ High Priority - Architecture Debt - Documented Oct 1, 2025
**Files**: `src/foundation/components/base/SimpleThreeComponent.ts`, `AsyncThreeComponent.ts`
**Issue**: Component base class names don't accurately reflect their actual behavior, causing developer confusion
**Impact**: Reduced code clarity, harder onboarding, potential incorrect usage patterns

**The Problem**:
The naming is misleading because BOTH base classes are async:
- `SimpleThreeComponent` - implies synchronous, but has `async load()` and `async createObject()`
- `AsyncThreeComponent` - name is accurate, but makes SimpleThreeComponent seem synchronous by comparison

**What They Actually Do**:
- `SimpleThreeComponent` = **Procedural geometry generation** (creates THREE.js geometry in code)
  - Uses `createGeometry()` and `createContent()` methods
  - Still async because of lifecycle methods
  - Used by: Cessna, Jet, Airliner, Truck, Car, Wing, HangGliderWing (20+ files)

- `AsyncThreeComponent` = **External resource loading** (loads models/textures from files)
  - Uses `getResourceDescriptors()` and `createObjectFromResources()`
  - Loads GLTF/GLB models, textures, etc.
  - Currently unused in codebase (all vehicles use procedural geometry)

**Better Naming**:
```typescript
// Current (Confusing)
SimpleThreeComponent    →  // Sounds sync but is async
AsyncThreeComponent     →  // Accurate but creates confusion

// Proposed (Clear)
ProceduralComponent     →  // Creates geometry procedurally
ResourceLoaderComponent →  // Loads external resources
// OR
GeometryComponent       →  // Procedural geometry
AssetLoaderComponent    →  // External asset loading
```

**Migration Strategy**:

**Phase 1: Add New Classes with Deprecation** (1 day)
1. Create `ProceduralComponent` extending current `SimpleThreeComponent` functionality
2. Create `ResourceLoaderComponent` extending current `AsyncThreeComponent` functionality
3. Add `@deprecated` tags to old classes with migration instructions
4. Export both old and new names for backward compatibility

**Phase 2: Migrate Core Components** (2-3 days)
1. Migrate all vehicles (20+ files):
   - Aircraft: Cessna, Jet, Airliner, Hercules
   - Ground: Car, Truck, AutonomousCar
   - Components: Wing, HangGliderWing, Glider
2. Migrate characters: Pilot, PilotVoxel, PilotHead
3. Migrate environment: Water, Cloud, Tree, etc.
4. Update all imports across codebase

**Phase 3: Update Documentation** (1 day)
1. Update all JSDoc comments
2. Update architecture documentation
3. Create migration guide for external users
4. Update examples and tutorials

**Phase 4: Remove Old Classes** (v2.0.0)
1. Remove deprecated `SimpleThreeComponent`
2. Remove deprecated `AsyncThreeComponent`
3. Clean up any remaining references

**Files Affected** (~35+ files):
- `src/foundation/components/base/SimpleThreeComponent.ts` → `ProceduralComponent.ts`
- `src/foundation/components/base/AsyncThreeComponent.ts` → `ResourceLoaderComponent.ts`
- All 20+ vehicle files extending SimpleThreeComponent
- All character components
- All environment components
- Type definitions and exports

**Breaking Changes**:
- Import statements need updates: `import { SimpleThreeComponent }` → `import { ProceduralComponent }`
- Class extensions need updates: `extends SimpleThreeComponent` → `extends ProceduralComponent`
- Can be mitigated with deprecation warnings and gradual migration

**Benefits**:
- ✅ Clear, self-documenting class names
- ✅ Easier for new developers to understand architecture
- ✅ Reduces cognitive load when choosing base class
- ✅ More accurate representation of actual functionality
- ✅ Better code organization and discoverability

**Estimated Effort**: 4-5 days total
- Day 1: Create new classes with deprecation
- Days 2-3: Migrate all components
- Day 4: Update documentation
- v2.0.0: Remove old classes

**Priority**: High - Should be done before v2.0.0 release
**Complexity**: Medium (mostly mechanical refactoring)
**Risk**: Low (backward compatible during migration)

### Multiple Render Loops - Memory Leak Risk
**Status**: ⚠️ Critical Issue
**Files**: 23+ files with `requestAnimationFrame` calls
**Issue**: Multiple competing animation loops without proper cleanup coordination
**Impact**: Memory leaks, performance degradation, potential crashes
**Files Affected**:
- `src/foundation/components/vehicles/Hangglider.ts` - Unstoppable animation loop
- `src/foundation/components/wildlife/Birds.ts` - No cleanup mechanism
- `src/foundation/components/environment/Water.ts` - Memory leak potential
- `src/foundation/components/environment/Cloud.ts` - Uses expensive Date.now() in loop
**Solution**: Implement centralized render loop manager with proper cleanup

### Legacy Flier Class - Architectural Debt
**Status**: ✅ Migrated (Oct 1, 2025) - Scheduled for Removal in v2.0.0
**Files**: `src/foundation/types/flier.ts` (deprecated)
**Issue**: Monolithic Flier class violated Single Responsibility Principle and modern architecture patterns
**Impact**: Performance issues (setInterval), tight coupling, mixed responsibilities, 'any' types

**New Architecture Created (Oct 1, 2025)**:
1. **ParagliderPhysics.ts** (236 lines) - Pure physics calculations (lift, thermals, wind)
2. **ParagliderInputController.ts** (177 lines) - Input handling with rotation inertia
3. **TrajectoryTracker.ts** (194 lines) - Flight path recording and analysis
4. **ParagliderController.ts** (328 lines) - Main controller using composition

**Migrations Completed (Oct 1, 2025)**:
- ✅ `src/applications/flier-pg/index.tsx` - Main paraglider demo
- ✅ `src/foundation/systems/audio/VarioSound.ts` - Decoupled with IAltitudeProvider interface
- ✅ `src/foundation/systems/scene/CameraController.ts` - Made generic (deprecated anyway)
- ℹ️ Birds.ts uses AutoFlier, not Flier (no migration needed)

**Benefits Achieved**:
- ✅ Performance: requestAnimationFrame instead of setInterval
- ✅ Type Safety: No 'any' types in new architecture
- ✅ Single Responsibility: Each class has one clear purpose
- ✅ Maintainability: Easier to modify individual components
- ✅ Reusability: Physics and input systems can be used independently

**Timeline**:
- ✅ Oct 1, 2025: Flier marked @deprecated, ParagliderController created and migrated
- 📅 v2.0.0: Remove Flier class entirely

### Legacy CameraController Removal
**Status**: ✅ Removed (Oct 1, 2025)
**Files**: `src/foundation/systems/scene/CameraController.ts` (removed)
**Issue**: Legacy CameraController was deprecated in favor of CameraTargetController
**Impact**: Reduced maintenance burden, improved type safety

**Actions Completed (Oct 1, 2025)**:
- ✅ Removed CameraController.ts (267 lines)
- ✅ Updated foundation/systems/scene/index.ts (removed exports)
- ✅ Updated foundation/index.ts (removed from public API)
- ✅ Updated shared/types.ts (removed import, updated comment)
- ✅ Build verification: All 31 applications compile successfully

**Timeline**:
- ✅ v1.5.0: CameraTargetController created, CameraController deprecated
- ✅ Oct 1, 2025: CameraController removed entirely
**Migration**: Complete - All apps now use CameraTargetController or standard THREE.PerspectiveCamera

### TypeScript Strict Mode Violations
**Status**: ✅ Significantly Improved (22 batches completed)
**Files**: Reduced from 30+ to minimal remaining instances, ~148 console statements remaining
**Issue**: TypeScript strict mode violations and excessive use of `any` type
**Impact**: Runtime errors, poor developer experience, harder debugging, reduced type safety

**Fixed Files** (Batches 1-22):
- ✅ Foundation components base classes (IThreeComponent, BaseThreeComponent, AsyncThreeComponent)
- ✅ Resource management (ResourceManager, ComponentRegistry, ComponentBenchmark)
- ✅ Physics components (Weather, Thermal, WindIndicator)
- ✅ Environment components (Sky, Water, DesertHouseWithPool)
- ✅ Vehicle components (Hangglider, Paraglider, TerrainFollowingBehavior)
- ✅ Systems (ThemeEngine, ThemeManager, VarioSound, disposal-utils)
- ✅ Location editor (state.ts, markers.ts)
- ✅ Applications (procedural-terrain, satellite-terrain, visualizer, flying-behavior-test)
- ✅ Character components (PilotVoxel, Marker, CharacterRegistry)
- ✅ GUI components (flyzone-editor-ui, Wing, Tree, CameraTargetUI)
- ✅ Foundation utils (models.ts already clean)
- ✅ CameraController (already using event.code, not event.which)
- ✅ Audio systems (SoundManager, SimpleAnimator, BackgroundAudio, VarioSound)
- ✅ Behaviors (FlyingBehavior, EngineFlyingBehavior, TerrainNavigator)
- ✅ Scene systems (CameraTargetController)
- ✅ **Batch 14 (Sept 30, 2025)**: Window interface, GUI controls, shared/index.ts logging
- ✅ **Batch 15 (Sept 30, 2025)**: Core app modules, island, navigation, helpers
- ✅ **Batch 16 (Sept 30, 2025)**: Foundation components (ProceduralRoad, Bird, Water, CharacterRegistry, CameraTargetUI)
- ✅ **Batch 17 (Sept 30, 2025)**: Systems (SimpleAnimator, SoundManager, ProceduralTerrainGenerator, ThemeEngine, ThemeManager partial)
- ✅ **Batch 18 (Sept 30, 2025)**: Audio & behaviors complete (ThemeManager complete, BackgroundAudio, VarioSound, EngineFlyingBehavior, CameraTargetController)
- ✅ **Batch 19 (Sept 30, 2025)**: UI, environment, and house systems (ThemeSelector, environment.ts, house-group-creator.ts, FlyingBehavior, tile-debug)
- ✅ **Batch 20 (Sept 30, 2025)**: Application demos (visualizer, famara-animation, roads, camera-switcher-demo, hangglider)
- ✅ **Batch 21 (Oct 1, 2025)**: High-count application files (town, houses, animals, planes, island)
- ✅ **Batch 22 (Oct 1, 2025)**: High-complexity application files (flyzone-editor, satellite-terrain, terrain-gps, procedural-terrain, plane)

**Batch 22 Completed (Oct 1, 2025)**:
1. **src/applications/editor/flyzone-editor.tsx**: 26 console statements → logger (info/warn/error/debug)
2. **src/applications/satellite-terrain/index.tsx**: 25 console statements → logger (info/warn/error/debug)
3. **src/applications/terrain-gps/index.tsx**: 23 console statements → logger (info/warn)
4. **src/applications/procedural-terrain/index.tsx**: 7 console statements → logger (info/warn)
5. **src/applications/plane/index.tsx**: 6 console statements → logger (info/error)
**Total**: 81 console statements replaced with structured logging

**Batch 21 Completed (Oct 1, 2025)**:
1. **src/applications/town/index.tsx**: Replaced console (25 statements)
   - Changed 1 `console.log` to `logger.debug` (options received)
   - Changed 1 `console.log` to `logger.info` (loaded successfully)
   - Changed 2 `console.log` to `logger.info` (mode switch)
   - Changed 1 `console.error` to `logger.error` (toggle error)
   - Changed 2 `console.log` to `logger.debug` (GUI setup)
   - Changed 1 `console.warn` to `logger.warn` (no GUI provided)
   - Changed 1 `console.log` to `logger.debug` (object names)
   - Changed 8 `console.log` to `logger.info` (polygon breakdown)
   - Changed 1 `console.log` to `logger.debug` (HouseGroupCreator setting)
   - Changed 1 `console.log` to `logger.info` (neighborhoods recreated)
   - Changed 2 `console.log` to `logger.debug` (clearing/cleanup)
   - Changed 1 `console.warn` to `logger.warn` (unknown neighborhood)
   - Changed 1 `console.log` to `logger.info` (neighborhood created)
   - Changed 1 `console.log` to `logger.debug` (disposal)
   - Also fixed disposal-utils.ts (2 statements) and performance-ui.ts (1 statement)

2. **src/applications/houses/index.tsx**: Replaced console (17 statements)
   - Changed 1 `console.log` to `logger.info` (starting demo)
   - Changed 10 `console.log` to `logger.info` (house types loaded with polygon counts)
   - Changed 5 `console.error` to `logger.error` (loading errors)
   - Changed 1 `console.log` to `logger.info` (demo complete)

3. **src/applications/animals/index.tsx**: Replaced console (15 statements)
   - Changed 11 `console.log` to `logger.info` (various loading messages)
   - Changed 3 `console.error` to `logger.error` (mesh failures)
   - Changed 1 `console.log` to `logger.info` (disposal)

4. **src/applications/planes/index.tsx**: Replaced console (11 statements)
   - Changed all `console.log` to `logger.info` (aircraft loading with polygon counts)

5. **src/applications/island/index.tsx**: Replaced console (7 statements)
   - Changed `console.log` to either `logger.info` or `logger.debug` appropriately

**Batch 20 Completed (Sept 30, 2025)**:
1. **src/applications/visualizer/flyzone-visualizer.tsx**: Replaced console (7 statements)
   - Changed 1 `console.log` to `logger.info` (app loaded successfully)
   - Changed 1 `console.log` to `logger.info` (takeoff selection)
   - Changed 1 `console.log` to `logger.info` (flyzone locations loaded)
   - Changed 1 `console.error` to `logger.error` (failed to load locations)
   - Changed 1 `console.log` to `logger.info` (weather analysis complete)
   - Changed 1 `console.error` to `logger.error` (weather analysis failure)
   - Changed 1 `console.log` to `logger.debug` (disposal)

2. **src/applications/famara-animation/index.tsx**: Replaced console (6 statements)
   - Changed 1 `console.log` to `logger.info` (road creation)
   - Changed 1 `console.log` to `logger.info` (app loaded with paragliders count)
   - Changed 1 `console.log` to `logger.info` (flying behavior started)
   - Changed 1 `console.log` to `logger.info` (hangglider loaded)
   - Changed 1 `console.log` to `logger.debug` (disposal)
   - Note: 1 commented out console.log left as is (commented code)

3. **src/applications/roads/index.tsx**: Replaced console (5 statements)
   - Changed 1 `console.error` to `logger.error` (terrain not available)
   - Changed 1 `console.log` to `logger.info` (creating roads)
   - Changed 1 `console.log` to `logger.info` (app loaded with roads count)
   - Changed 1 `console.log` to `logger.info` (demo roads created)
   - Changed 1 `console.log` to `logger.debug` (disposal)

4. **src/applications/camera-switcher-demo/index.tsx**: Replaced console (2 statements)
   - Changed 1 `console.log` to `logger.info` (target switched)
   - Changed 1 `console.log` to `logger.info` (demo loaded with targets count)

5. **src/applications/hangglider/index.tsx**: Replaced console (2 statements)
   - Changed 1 `console.log` to `logger.info` (app loaded successfully)
   - Changed 1 `console.log` to `logger.debug` (disposal)

**Batch 19 Completed (Sept 30, 2025)**:
1. **src/components/ThemeSelector.tsx**: Replaced console
   - Changed 1 `console.error` to `logger.error`
   - Theme application error handling

2. **src/shared/env/environment.ts**: Replaced console (9 statements)
   - Changed 1 `console.warn` to `logger.warn` (terrain height)
   - Changed 2 `console.error` to `logger.error` (neighborhood creation errors)
   - Changed 2 `console.log` to `logger.info` (neighborhood creation)
   - Changed 3 `console.log` to `logger.debug` (cloud updates, movement origins)
   - Changed 1 `console.log` to `logger.debug` (disposal)

3. **src/shared/env/house-group-creator.ts**: Replaced console (17 statements)
   - Changed 2 `console.log` to `logger.debug` (cleanup operations)
   - Changed 6 `console.log` to `logger.debug` (house creation by type)
   - Changed 1 `console.warn` to `logger.warn` (unknown house type)
   - Changed 1 `console.error` to `logger.error` (invalid position)
   - Changed 1 `console.error` to `logger.error` (house creation error)
   - Changed 1 `console.error` to `logger.error` (land plot error)
   - Changed 1 `console.error` to `logger.error` (landscape element error)
   - Changed 2 `console.log` to `logger.debug` (barrel cactus creation with polygon count)
   - Changed 1 `console.error` to `logger.error` (pool addition error)
   - Changed 1 `console.log` to `logger.debug` (dynamic spacing calculation)

4. **src/foundation/systems/behaviors/FlyingBehavior.ts**: Replaced console (3 statements)
   - Changed 1 `console.log` to `logger.debug` (close obstacle encounters)
   - Changed 1 `console.log` to `logger.debug` (flight status)
   - Changed 1 `console.log` to `logger.debug` (orientation debugging)

5. **src/applications/tile-debug/entry.tsx**: Replaced console
   - Changed 1 `console.error` to `logger.error`
   - Root element not found error

**Batch 18 Completed (Sept 30, 2025)**:
1. **src/foundation/systems/ThemeManager.ts**: Completed console replacements (remaining 9 statements)
   - Changed 2 `console.info` to `logger.info` (theme application after load)
   - Changed 2 `console.warn` to `logger.warn` (not ready warnings)
   - Changed 1 `console.error` to `logger.error` (apply theme failure)
   - Changed 1 `console.error` to `logger.error` (event listener)
   - Changed 2 `console.warn` to `logger.warn` (localStorage errors)
   - Changed 1 `console.log` to `logger.debug` (clear saved theme)

2. **src/foundation/systems/audio/BackgroundAudio.ts**: Replaced console
   - Changed 2 `console.error` to `logger.error`
   - Audio loading and playback error handling

3. **src/foundation/systems/audio/VarioSound.ts**: Replaced console
   - Changed 3 `console.error` to `logger.error`
   - Vario audio loading and playback error handling

4. **src/foundation/systems/behaviors/EngineFlyingBehavior.ts**: Replaced console
   - Changed 1 `console.log` to `logger.debug`
   - Terrain avoidance logging with sampling

5. **src/foundation/systems/scene/CameraTargetController.ts**: Replaced console
   - Changed 1 `console.warn` to `logger.warn`
   - Invalid target index warning

**Batch 17 Completed (Sept 30, 2025)**:
1. **src/foundation/systems/animation/SimpleAnimator.ts**: Replaced console
   - Changed 1 `console.error` to `logger.error`
   - Animation error handling

2. **src/foundation/systems/audio/SoundManager.ts**: Replaced console
   - Changed 1 `console.error` to `logger.error`
   - Sound loading error handling

3. **src/foundation/systems/terrain/ProceduralTerrainGenerator.ts**: Replaced console
   - Changed 1 `console.log` to `logger.debug`
   - Terrain generation completion message

4. **src/foundation/systems/ThemeEngine.ts**: Replaced console (9 statements)
   - Changed 2 `console.log` to `logger.info` (theme application)
   - Changed 1 `console.error` to `logger.error`
   - Changed 4 `console.log` to `logger.debug` (environment theme application)
   - Changed 2 `console.warn` to `logger.warn` (missing theme support)

5. **src/foundation/systems/ThemeManager.ts**: Replaced console (first 10 statements)
   - Changed 5 `console.log` to `logger.debug` (initialization)
   - Changed 2 `console.warn` to `logger.warn` (not ready)
   - Changed 2 `console.log` to `logger.info` (theme application)
   - Changed 1 `console.error` to `logger.error` (theme not found)
   - Note: Completed in batch 18

**Batch 16 Completed (Sept 30, 2025)**:
1. **src/foundation/components/scenery/ProceduralRoad.ts**: Replaced console
   - Changed 2 `console.error` to `logger.error`
   - Validation error messages for control points and terrain

2. **src/foundation/components/animals/Bird.ts**: Replaced console
   - Changed 1 `console.log` to `logger.debug`
   - Changed 1 `console.warn` to `logger.warn`
   - Bird creation and wing animation warnings

3. **src/foundation/components/environment/Water.ts**: Replaced console
   - Changed 1 `console.log` to `logger.debug`
   - Water component loading message

4. **src/foundation/components/characters/CharacterRegistry.ts**: Replaced console
   - Changed 3 `console.log` to `logger.debug`
   - Registry initialization, character registration, and asset validation

5. **src/foundation/components/ui/CameraTargetUI.tsx**: Replaced console
   - Changed 1 `console.error` to `logger.error`
   - UI element not found error

**Batch 15 Completed (Sept 30, 2025)**:
1. **src/shared/index.ts**: Fixed 'any' type in dynamicImportApp
   - Created `AppModule` interface with proper typing
   - Changed return type from `Promise<any>` → `Promise<AppModule>`
   - Ensures type safety for dynamic app imports

2. **src/app.tsx**: Replaced console with logger
   - Changed 1 `console.log` to `logger.info`
   - Changed 1 `console.warn` to `logger.warn`
   - Changed 1 `console.error` to `logger.error`
   - Added logger import

3. **src/foundation/utils/helpers.ts**: Replaced console
   - Changed 1 `console.log` to `logger.debug`

4. **src/foundation/utils/navigation.ts**: Replaced console warnings
   - Changed 5 `console.warn` statements to `logger.warn`
   - Note: This file is not currently used anywhere (candidate for removal)

5. **src/foundation/components/scenery/Island.ts**: Replaced console logging
   - Changed 11 console statements to logger (warn/debug/info/error)
   - Improved logging levels for satellite texture operations
   - Added logger import

**Batch 14 Completed (Sept 30, 2025)**:
1. **src/index.tsx**: Added proper Window interface declaration for dev mode functions
   - Replaced `(window as any).enableDevMode` with typed `window.enableDevMode`
   - Replaced `(window as any).disableDevMode` with typed `window.disableDevMode`
   - Added `declare global { interface Window { ... } }` block

2. **src/shared/index.ts**: Replaced console.log with logger
   - Changed 3 `console.log` statements to `logger.debug`
   - Changed 1 `console.error` to `logger.error`
   - Added logger import

3. **src/applications/flying-behavior-test/index.tsx**: Fixed GUI types and logging
   - Added imports for `OrbitControls` and `GUI` from proper packages
   - Changed `controls: any` → `controls: OrbitControls`
   - Changed `gui: any` → `gui: GUI`
   - Replaced 13 console statements with logger (info/debug/error)
   - Fixed GUI property access to use proper setters instead of `as any` casts

4. **src/foundation/systems/behaviors/FlyingBehavior.ts**: Added public setters
   - Added `setSpeed()`, `setTurnSpeed()`, `setFlightRadius()`, `setPattern()` methods
   - Enables type-safe GUI controls without `as any` casts

5. **src/applications/visualizer/flyzone-visualizer.tsx**: Fixed types
   - Added `GUI` import
   - Changed `gui: any` → `gui: GUI`
   - Changed `controls: any` → `controls: StoryOptions['controls']`
   - Changed `data?: any` → `data?: unknown` with proper type narrowing
   - Added runtime type checking for action data

6. **src/foundation/components/scenery/buildings/Townhouse.ts**: Created materials interface
   - Added `TownhouseMaterials` interface with proper Material types
   - Changed all `materials: any` parameters to `materials: TownhouseMaterials`
   - Changed `getInfo(): Record<string, any>` → `Record<string, unknown>`

**Remaining Files to Fix**:

1. **src/applications/location-editor/state.ts**
   - Has eslint-disable for JSON deserialization (acceptable use of `any`)

2. **Workshop demos** (lower priority - demo code):
   - `src/applications/workshop/demos/helmet/index.tsx`
   - `src/applications/workshop/demos/pilot/index.tsx`
   - `src/applications/workshop/demos/terrain/index.tsx`
   - `src/applications/workshop/demos/voxel/index.tsx`

**Solution**: Most critical TypeScript issues have been addressed with proper types or eslint-disable comments where `any` is genuinely necessary (GUI integrations, JSON deserialization)

### App Registry Import Mapping Technical Debt
**Status**: ⚠️ High Priority
**Files**: `src/apps/shared/index.ts`, `src/config/apps.json`
**Issue**: Duplication between app registry and import mapping causes maintenance burden
**Impact**: High maintenance burden, risk of inconsistency, manual synchronization prone to error

**Problems**:
1. **Duplication**: Apps defined in both `apps.json` and manual `importMap`
2. **Manual Maintenance**: Each new app requires updates in two places
3. **Legacy "Stories" Concept**: Unnecessary Proxy pattern for backward compatibility

**Recommended Solutions**:
- **Option 1**: Auto-generate import mapping from `apps.json` at build time
- **Option 2**: Use direct dynamic imports based on app metadata
- **Option 3**: Remove Stories concept entirely and update all consumers

### Production Debug Code
**Status**: ⚠️ Should be removed
**Files**: 5+ files with console.log in production
**Issue**: Debug statements left in production code
**Impact**: Performance, console pollution, potential security info leakage
**Files Affected**:
- `src/foundation/systems/animation/SimpleAnimator.ts` - 6 console.log statements
- `src/apps/experiences/flyzones/navigation/camera.ts` - Debug output
**Solution**: Replace with proper logging utility or remove

### Legacy loadSync() Method Removal
**Status**: ✅ Fully Completed - Removed Entirely (Sept 30, 2025)
**Impact**: Successfully eliminated ALL loadSync() usage, ~226 lines of legacy code removed

**Completed Refactoring**:

**Phase 1 - Public API Migration** (Earlier in Sept 2025):
- ✅ **Houses Application**: Refactored to use async/await
  - Removed all legacy prototype overrides from building components
  - All building components export clean classes
- ✅ **House Group Creator**: Refactored with parallel loading
  - Converted all 6 loadSync() calls to async/await
  - Implemented Promise.all for parallel landscape element loading
  - Stones, cacti, and pool loading now non-blocking
- ✅ **DesertHouseWithPool**: Refactored with parallel composition
  - Moved house and pool loading from synchronous to async phase
  - House and pool now load in parallel via Promise.all

**Phase 2 - Complete Removal** (Sept 30, 2025, commit f75d39f):
- ✅ **Base Components** (4 files, ~60 lines removed):
  - `SimpleThreeComponent.ts` - Removed loadSync() base implementation
  - `FloatingThreeComponent.ts` - Removed loadSync() override
  - `MovableBoatComponent.ts` - Removed loadSync() override
  - `MovableCarComponent.ts` - Removed loadSync() override

- ✅ **Vehicle Components** (3 files, ~66 lines removed):
  - `Car.ts` - Removed loadSync() implementation
  - `Truck.ts` - Removed loadSync() implementation
  - `AutonomousCar.ts` - Removed loadSync() override

**Benefits Achieved**:
- Single async loading path throughout entire codebase
- Eliminates code duplication between sync/async paths
- Reduces maintenance burden significantly
- Enforces modern async/await pattern consistently
- Improves code readability and maintainability
- No performance impact (all applications already used async load())

**Result**: Zero instances of loadSync() remain in codebase. Pure async architecture.

### Island Flying App - Multiple Animation Loops Issue
**Status**: ⚠️ Critical - Introduced Oct 1, 2025
**Files**: `src/applications/island-flying/index.tsx`
**Issue**: Creates 25-35 separate FlyingBehavior animation loops (each with its own requestAnimationFrame)
**Impact**: Performance degradation, high CPU usage, potential frame drops with many aircraft

**Problems**:
1. **Multiple RAF Loops**: Each FlyingBehavior.start() creates independent requestAnimationFrame loop
2. **No Coordination**: 25-35 loops running concurrently without synchronization
3. **Random Counts**: Unpredictable performance (3-7 aircraft of each of 5 types = 15-35 total)
4. **Memory Inefficiency**: Each behavior tracks its own timing state independently

**Current Architecture**:
```typescript
// Each aircraft gets its own animation loop
for (const vehicle of vehicles) {
  behavior.attachTo(mesh);
  behavior.start();  // Creates new RAF loop!
}
```

**Recommended Solutions**:
- **Option 1**: Single update loop that calls behavior.update() for all vehicles (requires FlyingBehavior refactor)
- **Option 2**: Limit max aircraft count (e.g., max 15 total instead of up to 35)
- **Option 3**: Use shared animation loop manager (relates to "Multiple Render Loops" issue above)

**Temporary Mitigations**:
- Reduce random count range from 3-7 to 2-4 per type
- Add configurable max aircraft limit
- Consider pooling behaviors or using single behavior for multiple objects

**Related Issues**:
- See "Multiple Render Loops - Memory Leak Risk" (High Priority)
- This app significantly worsens the existing render loop problem

### Inconsistent Vehicle API Pattern
**Status**: ⚠️ High Priority - Architecture Inconsistency
**Files**: `src/foundation/components/vehicles/`, `src/applications/island-flying/index.tsx`
**Issue**: Two different patterns for accessing vehicle meshes despite abstract base classes

**Root Cause Analysis**:
The inconsistency exists because legacy vehicles (Paraglider, Hangglider) pre-date the modern component architecture and don't extend BaseThreeComponent:

1. **Modern Vehicles** (Cessna, Jet, Airliner):
   - Extend `SimpleThreeComponent` → `BaseThreeComponent`
   - Implement `IThreeComponent` interface
   - Use `load()` returns `Promise<THREE.Object3D>`
   - Use `getObject()` to retrieve mesh
   - Proper lifecycle management, metrics, disposal

2. **Legacy Vehicles** (Paraglider, Hangglider):
   - Plain classes with no base (Paraglider)
   - HangGliderModel doesn't extend anything
   - Use `load()` returns `Promise<THREE.Object3D>` (direct return, not stored)
   - Use `getMesh()` to retrieve mesh (Paraglider only)
   - Manual lifecycle management
   - Implement `IFlyable` interface (different from IThreeComponent)

**Why Abstract Classes Didn't Prevent This**:
Legacy vehicles were created before the modern architecture existed and were never migrated. They don't extend the base classes at all, so they're not subject to the interface constraints.

**Current Workaround**:
```typescript
// island-flying/index.tsx lines 276-281
const loadResult = await vehicle.load();
const mesh = loadResult || (vehicle.getMesh ? vehicle.getMesh() : null);
```

**Recommended Solution**:

**Phase 1: Migrate Legacy Vehicles to Modern Architecture** (High Priority)
1. Create `ModernParaglider extends SimpleThreeComponent`
2. Create `ModernHangglider extends SimpleThreeComponent`
3. Keep legacy classes for backward compatibility with deprecation warnings
4. Update all applications to use modern versions

**Phase 2: Unified Interface** (After Phase 1)
All vehicles will then use consistent API:
```typescript
const vehicle = new AnyVehicle(config);
const mesh = await vehicle.load();  // Returns mesh directly
// OR
const object = vehicle.getObject();  // After load()
```

**Benefits**:
- ✅ Single API pattern across all vehicles
- ✅ Proper lifecycle management with metrics
- ✅ Resource pooling via ResourceManager
- ✅ Consistent disposal and memory management
- ✅ Type safety through IThreeComponent interface
- ✅ No more workarounds or special cases

**Breaking Changes**:
- Applications using Paraglider/Hangglider will need updates
- Can be mitigated with deprecation warnings and migration guide

**Estimated Effort**: 2-3 days
- 1 day: Implement ModernParaglider and ModernHangglider
- 1 day: Update applications and tests
- 0.5 day: Documentation and deprecation warnings

**Priority**: High - Should be done before adding more vehicles

### Island Flying App - Type Safety Issues
**Status**: ⚠️ Needs Improvement - Introduced Oct 1, 2025
**Files**: `src/applications/island-flying/index.tsx`
**Issue**: Excessive use of `any` type in vehicle management

**Problems**:
1. **Line 231**: `VehicleClass: any` - Should be typed vehicle constructor interface
2. **Line 232**: `vehicleConfig: any` - Should use union type of vehicle config interfaces
3. **No Type Guards**: Vehicle instantiation not type-safe

**Current Code**:
```typescript
private async addVehicle(
  scene: THREE.Scene,
  type: string,
  VehicleClass: any,  // ❌ No type safety
  vehicleConfig: any,  // ❌ No type safety
  flightPattern: FlightPattern,
  flightParams: { altitude: number; radius: number; speed: number }
): Promise<void>
```

**Recommended Solution**:
```typescript
interface VehicleConstructor {
  new (config: VehicleConfig): {
    load(): Promise<void>;
    getMesh(): THREE.Object3D | null;
  };
}

type VehicleConfig =
  | ParagliderConfig
  | HanggliderConfig
  | CessnaConfig
  | JetConfig
  | AirlinerConfig;

private async addVehicle(
  scene: THREE.Scene,
  type: string,
  VehicleClass: VehicleConstructor,
  vehicleConfig: VehicleConfig,
  // ... rest
)
```

### Island Flying App - Missing Behavior Cleanup
**Status**: ⚠️ Memory Leak Risk - Introduced Oct 1, 2025
**Files**: `src/applications/island-flying/index.tsx`
**Issue**: FlyingBehavior animation loops not stopped on dispose

**Problem**:
```typescript
public override dispose(): void {
  logger.debug(`🧹 Disposing ${this.config.name}`);

  if (this.animationId) {
    cancelAnimationFrame(this.animationId);  // Only cancels main loop
    this.animationId = undefined;
  }

  // ❌ Missing: No cleanup of FlyingBehavior loops!
  this.vehicles = [];  // Just clears array, behaviors keep running

  super.dispose();
}
```

**Impact**: 15-35 animation loops continue running after app disposal, causing memory leak

**Recommended Solution**:
```typescript
public override dispose(): void {
  logger.debug(`🧹 Disposing ${this.config.name}`);

  if (this.animationId) {
    cancelAnimationFrame(this.animationId);
    this.animationId = undefined;
  }

  // Stop all flying behaviors
  for (const vehicle of this.vehicles) {
    vehicle.behavior.stop();  // Must call stop() to cancel RAF loop
  }
  this.vehicles = [];

  super.dispose();
}
```

## Medium Priority Issues

### Testing Infrastructure Gap
**Status**: ⚠️ Critical Gap
**Files**: Only 3 test files exist in entire codebase
**Issue**: Minimal test coverage for complex 3D application
**Impact**: High risk of regressions, difficult refactoring, poor code confidence
**Files Affected**:
- `tests/utils/logger.test.ts` - Basic utility tests only
- `tests/utils/date.test.ts` - Basic utility tests only
- No component tests, no integration tests, no E2E tests
**Solution**: Implement comprehensive test suite with Jest, RTL, and E2E framework

### Missing Error Handling in Audio Systems
**Status**: Partially Fixed
**Files**: `src/foundation/systems/audio/`
**Issue**: Audio loading failures could be handled more gracefully
**Impact**: User experience when audio fails to load

### Hardcoded Scene Configuration
**Status**: Identified
**Files**: `src/app.tsx`
**Issue**: Scene configuration is hardcoded in SCENE_CONFIG constant
**Impact**: Flexibility, different environments
**Solution**: Make configurable via environment or app registry

## Low Priority Issues

### Mixed Component Patterns
**Status**: Identified
**Files**: Various component files
**Issue**: Mix of class components and functional patterns
**Impact**: Code consistency, maintainability
**Solution**: Standardize on functional components with hooks

### Bundle Size Optimization Opportunities
**Status**: Identified
**Files**: Build output
**Issue**: Large bundle sizes (1.1MB main bundles)
**Impact**: Loading performance
**Solution**: Code splitting, tree shaking optimization

### Accessibility Compliance Gap
**Status**: Identified
**Files**: Limited accessibility attributes throughout codebase
**Issue**: Poor accessibility support (only 5 aria-label instances found)
**Impact**: Excludes users with disabilities, potential legal compliance issues
**Solution**: Implement WCAG 2.1 compliance with proper semantic HTML and ARIA

## Priority Levels

**High Priority**:
- Multiple render loops (memory leak risk)
- Legacy CameraController removal (deprecated in v1.5.0)
- TypeScript strict mode violations
- App registry import mapping technical debt
- Production debug code cleanup

**Medium Priority**:
- Testing infrastructure gap
- Audio error handling
- Workshop demo type safety issues
- Foundation component parameter typing
- Hardcoded scene configuration

**Low Priority**:
- Override modifier warnings
- Mixed component patterns
- Bundle size optimization
- Accessibility compliance

---

## How to Use This File

1. **Add new debt**: When you find technical debt, add it to the appropriate priority section
2. **Update status**: Change status as work progresses (Identified → In Progress → Fixed)
3. **Include details**: Always include files affected and impact assessment
4. **Regular review**: Review during sprint planning and refactoring sessions