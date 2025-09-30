# Technical Debt

This document tracks pending technical debt and issues that need to be addressed for improved code quality, performance, and maintainability.

## High Priority Issues

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

### Legacy CameraController Removal
**Status**: ⚠️ Deprecated - Schedule for Removal
**Files**: `src/foundation/systems/scene/CameraController.ts`
**Issue**: Legacy CameraController deprecated in favor of CameraTargetController
**Impact**: Maintenance burden, Flier dependency prevents full type safety
**Dependencies**: Only app.tsx uses it (already migrated to CameraTargetController)
**Solution**: Remove in next major version (v2.0.0)
**Timeline**:
- ✅ v1.5.0: CameraTargetController created, CameraController deprecated
- 📅 v2.0.0: Remove CameraController entirely
**Migration**: All apps using CameraController should switch to CameraTargetController

### TypeScript Strict Mode Violations
**Status**: ✅ Significantly Improved (17 batches completed)
**Files**: Reduced from 30+ to ~5 remaining instances
**Issue**: TypeScript strict mode violations and excessive use of `any` type
**Impact**: Runtime errors, poor developer experience, harder debugging, reduced type safety

**Fixed Files** (Batches 1-17):
- ✅ Foundation components base classes (IThreeComponent, BaseThreeComponent, AsyncThreeComponent)
- ✅ Resource management (ResourceManager, ComponentRegistry, ComponentBenchmark)
- ✅ Physics components (Weather, Thermal, WindIndicator)
- ✅ Environment components (Sky, Water, DesertHouseWithPool)
- ✅ Vehicle components (Hangglider, Paraglider, TerrainFollowingBehavior)
- ✅ Systems (ThemeEngine, ThemeManager partial, VarioSound, disposal-utils)
- ✅ Location editor (state.ts, markers.ts)
- ✅ Applications (procedural-terrain, satellite-terrain, visualizer, flying-behavior-test)
- ✅ Character components (PilotVoxel, Marker, CharacterRegistry)
- ✅ GUI components (flyzone-editor-ui, Wing, Tree, CameraTargetUI)
- ✅ Foundation utils (models.ts already clean)
- ✅ CameraController (already using event.code, not event.which)
- ✅ Audio systems (SoundManager, SimpleAnimator)
- ✅ **Batch 14 (Sept 30, 2025)**: Window interface, GUI controls, shared/index.ts logging
- ✅ **Batch 15 (Sept 30, 2025)**: Core app modules, island, navigation, helpers
- ✅ **Batch 16 (Sept 30, 2025)**: Foundation components (ProceduralRoad, Bird, Water, CharacterRegistry, CameraTargetUI)
- ✅ **Batch 17 (Sept 30, 2025)**: Systems (SimpleAnimator, SoundManager, ProceduralTerrainGenerator, ThemeEngine, ThemeManager partial)

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
   - Note: 9 more console statements remain in this file for batch 18

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