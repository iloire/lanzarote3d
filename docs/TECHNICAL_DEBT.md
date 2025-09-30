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
**Status**: ✅ Significantly Improved (13 batches completed)
**Files**: Reduced from 30+ to ~10 remaining instances
**Issue**: TypeScript strict mode violations and excessive use of `any` type
**Impact**: Runtime errors, poor developer experience, harder debugging, reduced type safety

**Fixed Files** (Batches 1-13):
- ✅ Foundation components base classes (IThreeComponent, BaseThreeComponent, AsyncThreeComponent)
- ✅ Resource management (ResourceManager, ComponentRegistry, ComponentBenchmark)
- ✅ Physics components (Weather, Thermal, WindIndicator)
- ✅ Environment components (Sky, Water, DesertHouseWithPool)
- ✅ Vehicle components (Hangglider, Paraglider, TerrainFollowingBehavior)
- ✅ Systems (ThemeEngine, VarioSound, disposal-utils)
- ✅ Location editor (state.ts, markers.ts)
- ✅ Applications (procedural-terrain, satellite-terrain, visualizer, flying-behavior-test)
- ✅ Character components (PilotVoxel, Marker)
- ✅ GUI components (flyzone-editor-ui, Wing, Tree)
- ✅ Foundation utils (models.ts already clean)
- ✅ CameraController (already using event.code, not event.which)

**Remaining Files to Fix**:

1. **src/applications/location-editor/state.ts**
   - Has eslint-disable for JSON deserialization (acceptable use of `any`)
   - Some additional lines may need review

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