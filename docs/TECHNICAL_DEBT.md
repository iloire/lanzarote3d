# Technical Debt

This document tracks technical debt and issues that need to be addressed for improved code quality, performance, and maintainability.

## High Priority

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

### TypeScript Type Safety Violations
**Status**: ⚠️ Needs Attention
**Files**: 20+ instances across codebase
**Issue**: Excessive use of `any` type reduces type safety and IDE support
**Impact**: Runtime errors, poor developer experience, harder debugging
**Files Affected**:
- `src/apps/demos/animation/index.tsx:19` - `position: any`
- `src/apps/demos/photobooth/index.tsx` - Multiple `any` usages
- `src/foundation/utils/models.ts` - Model loading with `any`
**Solution**: Replace with proper TypeScript interfaces

### Production Debug Code
**Status**: ⚠️ Should be removed
**Files**: 5+ files with console.log in production
**Issue**: Debug statements left in production code
**Impact**: Performance, console pollution, potential security info leakage
**Files Affected**:
- `src/foundation/systems/animation/SimpleAnimator.ts` - 6 console.log statements
- `src/apps/experiences/flyzones/navigation/camera.ts` - Debug output
**Solution**: Replace with proper logging utility or remove

### Inconsistent Animation Loop Management
**Status**: ✅ Fixed
**Files**: `src/app.tsx`, `src/apps/demos/animation/index.tsx`, `src/apps/experiences/game/game.tsx`, `src/apps/experiences/flyzones/animation/loop.ts`
**Issue**: Multiple competing animation loops. Main app has its own loop, individual apps create their own loops.
**Impact**: Performance, potential conflicts, duplicate rendering
**Solution**: ✅ Implemented AppBase architecture with standardized animation loop management across all 8 applications

### Animation System Complexity (Architectural Improvement)
**Status**: ✅ Improved
**Files**: `src/foundation/systems/animation/SimpleAnimator.ts`, `src/apps/demos/animation/index.tsx`
**Issue**: Previous animation system was too complex with hidden dependencies (AnimationManager → TWEEN → Animations utility) making debugging difficult
**Impact**: Hard to debug animation issues, timing problems, mixed responsibilities
**Solution**: ✅ Created SimpleAnimator - self-contained, no external dependencies, transparent operation, easy to debug

### App Architecture Inconsistency
**Status**: ✅ Fixed
**Files**: All 8 applications converted to AppBase
**Issue**: Applications used inconsistent patterns (simple objects vs class-based), no standardized error handling, resource management, or performance monitoring
**Impact**: Inconsistent developer experience, potential memory leaks, no visibility into performance issues
**Files Affected**:
- ✅ `src/apps/demos/famara/index.tsx` - Converted to AppBase
- ✅ `src/apps/demos/photobooth/index.tsx` - Converted to AppBase
- ✅ `src/apps/demos/animation/index.tsx` - Converted to AppBase
- ✅ `src/apps/tools/workshop/index.tsx` - Converted to AppBase
- ✅ `src/apps/experiences/game/game.tsx` - Converted to AppBase
- ✅ `src/apps/experiences/flyzones/index.tsx` - Converted to AppBase
- ✅ `src/apps/tools/location-editor/index.tsx` - Converted to AppBase
- ✅ `src/apps/tools/workshop/demos/voxel/index.tsx` - Converted to AppBase
**Solution**: ✅ Implemented unified AppBase architecture with standardized lifecycle management, performance monitoring, error handling, and resource cleanup

## Medium Priority

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

### Event Listener Memory Leaks
**Status**: ✅ Significantly Improved
**Files**: All AppBase applications now have proper cleanup
**Issue**: Many event listeners lack proper cleanup mechanisms
**Impact**: Memory leaks, degraded performance over time
**Files Affected**:
- `src/apps/experiences/flyzones/events/mouse.ts` - ✅ Now has proper cleanup in AppBase
- Multiple window resize listeners - ✅ Now tracked and cleaned up in dispose() methods
**Solution**: ✅ AppBase architecture ensures all event listeners are properly cleaned up via standardized dispose() methods

### Hardcoded Scene Configuration
**Status**: Identified
**Files**: `src/app.tsx`
**Issue**: Scene configuration is hardcoded in SCENE_CONFIG constant
**Impact**: Flexibility, different environments
**Solution**: Make configurable via environment or app registry

## Low Priority

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

---

## Suggested Next Areas of Improvement

### Phase 1: Critical Stability (High Impact, Medium Effort)
1. **Render Loop Centralization** - Fix memory leaks in component animations
2. **Type Safety Audit** - Replace all `any` types with proper interfaces
3. **Production Debug Cleanup** - Remove console.log statements from production code
4. **Event Listener Audit** - Ensure proper cleanup for all event listeners

### Phase 2: Developer Experience (High Impact, High Effort)
5. **Testing Infrastructure** - Implement comprehensive test suite (Jest + RTL + E2E)
6. **Error Handling Standardization** - Consistent error handling patterns across apps
7. **Development Tooling** - Enhanced debugging capabilities and better error reporting

### Phase 3: Performance & User Experience (Medium Impact, Medium Effort)
8. **Bundle Optimization** - Code splitting and tree-shaking for faster load times
9. **Progressive Web App** - Service worker, offline capability, installability
10. **Accessibility Compliance** - WCAG 2.1 compliance for inclusive user experience

### Phase 4: Architecture Enhancement (Medium Impact, High Effort)
11. **Component Interface Standardization** - Consistent APIs across foundation components
12. **Advanced Asset Management** - Centralized loading with priority and caching
13. **Performance Monitoring** - Real-time metrics and optimization insights

---

## Design Decisions & Architecture Evaluations

### Apps Directory Structure Evaluation
**Status**: ✅ Evaluated - No Change Recommended
**Date**: 2025-09-26
**Question**: Should apps be restructured with an additional `/applications` parent directory?

**Current Structure** (Recommended):
```
src/apps/
├── config/           # Central app registry
├── demos/            # Standalone demo applications (3 apps)
├── experiences/      # Full interactive experiences (2 apps)
├── shared/           # Shared utilities & AppBase
└── tools/            # Development/authoring tools (2 apps)
```

**Proposed Alternative** (Not Recommended):
```
src/apps/
├── config/
├── shared/
└── applications/     # NEW grouping level
    ├── demos/
    ├── experiences/
    └── tools/
```

**Decision**: Keep current structure
**Reasoning**:
- Current structure is already well-organized with clear logical separation
- Proposed change adds unnecessary nesting without significant benefit
- Would require extensive migration (69+ files, webpack configs, registry paths)
- Flat structure with 3 clear categories is more conventional and easier to navigate
- Each category has a distinct purpose: demos (showcase), experiences (interactive), tools (development)

---

## How to Use This File

1. **Add new debt**: When you find technical debt, add it to the appropriate priority section
2. **Update status**: Change status as work progresses (Identified → In Progress → Fixed)
3. **Include details**: Always include files affected and impact assessment
4. **Regular review**: Review during sprint planning and refactoring sessions