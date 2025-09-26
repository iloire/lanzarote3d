# Technical Debt

This document tracks technical debt and issues that need to be addressed for improved code quality, performance, and maintainability.

## High Priority

### Tween.js Deprecation Issues
**Status**: Partially Fixed
**Files**: Multiple animation-related files
**Issue**: The `TWEEN.update()` call pattern is deprecated. Need to update to the new Tween.js API.
**Impact**: Future compatibility, potential performance issues
**Files Affected**:
- `src/apps/demos/animation/index.tsx` - ⚠️ Still has deprecation warning
- `src/foundation/utils/animations.ts` - Needs review

### Inconsistent Animation Loop Management
**Status**: ✅ Fixed
**Files**: `src/app.tsx`, `src/apps/demos/animation/index.tsx`, `src/apps/experiences/game/game.tsx`, `src/apps/experiences/flyzones/animation/loop.ts`
**Issue**: Multiple competing animation loops. Main app has its own loop, individual apps create their own loops.
**Impact**: Performance, potential conflicts, duplicate rendering
**Solution**: ✅ Implemented centralized AnimationManager singleton that coordinates all animations with priority-based execution

## Medium Priority

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

## Low Priority

### Three.js Color Management Configuration
**Status**: Identified
**Files**: `src/app.tsx`
**Issue**: `THREE.ColorManagement.enabled = false` is a workaround for color space issues
**Impact**: Color accuracy, future Three.js compatibility
**Solution**: Proper color space configuration

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

---

## How to Use This File

1. **Add new debt**: When you find technical debt, add it to the appropriate priority section
2. **Update status**: Change status as work progresses (Identified → In Progress → Fixed)
3. **Include details**: Always include files affected and impact assessment
4. **Regular review**: Review during sprint planning and refactoring sessions