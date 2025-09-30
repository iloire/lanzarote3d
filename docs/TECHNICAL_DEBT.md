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

### TypeScript Strict Mode Violations
**Status**: ⚠️ Needs Attention
**Files**: 20+ instances across codebase
**Issue**: TypeScript strict mode violations and excessive use of `any` type
**Impact**: Runtime errors, poor developer experience, harder debugging, reduced type safety

**Files Requiring Fixes**:

1. **src/apps/experiences/flyzones/markers/markers.ts:7**
   - Property 'type' will overwrite the base property in 'Object3D'
   - Need to add initializer or declare modifier

2. **src/apps/tools/location-editor/state.ts**
   - Multiple implicit 'any' types on lines 801, 811, 832
   - Object literal properties need proper typing

3. **src/apps/tools/workshop/demos/helmet/index.tsx**
   - Element access without index signature on lines 83, 142
   - HelmetType enum needs index signature or better type safety

4. **src/apps/tools/workshop/demos/pilot/index.tsx**
   - Class inheritance issue with private 'animationId' property (line 11)
   - Missing override modifier (line 12)

5. **src/apps/tools/workshop/demos/terrain/index.tsx**
   - Implicit 'any' type parameter on line 460

6. **src/apps/tools/workshop/demos/voxel/index.tsx**
   - Missing override modifier on dispose method (line 202)

7. **src/foundation/components/environment/Sky.ts:171**
   - Element access without index signature on SkyOptions

8. **src/foundation/systems/scene/CameraController.ts**
   - Uses deprecated 'event.which' property (lines 37, 54)
   - Should use 'event.code' or 'event.key' instead

9. **Multiple Physics Components**
   - src/foundation/components/physics/Thermal.ts:40 - implicit 'any' parameter
   - src/foundation/components/physics/Weather.ts:81 - implicit 'any' parameter
   - src/foundation/components/physics/WindIndicator.ts:15 - implicit 'any' parameter

10. **Additional Type Safety Issues**:
    - `src/apps/demos/animation/index.tsx:19` - `position: any`
    - `src/apps/demos/photobooth/index.tsx` - Multiple `any` usages
    - `src/foundation/utils/models.ts` - Model loading with `any`

**Solution**: Replace with proper TypeScript interfaces and fix strict mode violations

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
- TypeScript strict mode violations
- App registry import mapping technical debt
- CameraController deprecated API usage
- Location editor implicit any types
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