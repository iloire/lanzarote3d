# Technical Debt

**Last Updated**: October 1, 2025

This document tracks pending technical debt and issues that need to be addressed for improved code quality, performance, and maintainability.

> **Recent Wins (Oct 1, 2025)**:
> - ✅ Removed legacy CameraController (267 lines)
> - ✅ Migrated Flier to modern ParagliderController architecture
> - ✅ Removed location-editor application (1,100+ lines)
> - ✅ Completed 23 batches of TypeScript improvements (~148 console statements remaining)

---

## 🔴 High Priority Issues

### 1. Multiple Render Loops - Memory Leak Risk
**Status**: ⚠️ CRITICAL - Affects 23+ files
**Impact**: Memory leaks, performance degradation, potential crashes

**Problem**: Multiple components create independent `requestAnimationFrame` loops without proper cleanup coordination.

**Affected Files**:
- `src/foundation/components/vehicles/Hangglider.ts` - Unstoppable animation loop
- `src/foundation/components/wildlife/Birds.ts` - No cleanup mechanism
- `src/foundation/components/environment/Water.ts` - Memory leak potential
- `src/foundation/components/environment/Cloud.ts` - Uses expensive Date.now() in loop
- `src/applications/island-flying/index.tsx` - Creates 15-35 concurrent RAF loops!

**Recommended Solution**:
Implement centralized render loop manager:
```typescript
class RenderLoopManager {
  private loops: Set<() => void> = new Set();
  private animationId: number | null = null;

  register(callback: () => void): () => void {
    this.loops.add(callback);
    if (!this.animationId) this.start();
    return () => this.unregister(callback);
  }

  private tick = () => {
    this.loops.forEach(cb => cb());
    this.animationId = requestAnimationFrame(this.tick);
  };
}
```

**Estimated Effort**: 3-4 days
**Priority**: CRITICAL - Should be done ASAP

---

### 2. Island Flying App - Multiple Issues
**Status**: ⚠️ CRITICAL - Introduced Oct 1, 2025
**Files**: `src/applications/island-flying/index.tsx`

**Issue 1: Too Many Animation Loops**
- Creates 15-35 separate FlyingBehavior RAF loops
- Each behavior.start() creates independent loop
- No coordination or synchronization
- High CPU usage, potential frame drops

**Issue 2: Missing Behavior Cleanup (Memory Leak)**
```typescript
public override dispose(): void {
  // ❌ Missing: behaviors keep running!
  this.vehicles = [];
  super.dispose();
}
```

**Fix Required**:
```typescript
public override dispose(): void {
  for (const vehicle of this.vehicles) {
    vehicle.behavior.stop();  // Stop RAF loops!
  }
  this.vehicles = [];
  super.dispose();
}
```

**Issue 3: Type Safety Issues**
- `VehicleClass: any` - Should be typed constructor
- `vehicleConfig: any` - Should use union type
- No type guards for vehicle instantiation

**Estimated Effort**: 1 day to fix all three issues
**Priority**: CRITICAL - Memory leak and performance

---

### 3. Confusing Component Base Class Naming
**Status**: ⚠️ HIGH - Architecture Debt
**Files**: `src/foundation/components/base/`

**Problem**: Misleading names cause developer confusion
- `SimpleThreeComponent` - Actually async! Creates procedural geometry
- `AsyncThreeComponent` - Accurate, but makes Simple seem synchronous

**Better Names**:
```typescript
SimpleThreeComponent    →  ProceduralComponent
AsyncThreeComponent     →  ResourceLoaderComponent
```

**Migration Plan**:
1. Create new classes with clear names
2. Add @deprecated to old classes
3. Migrate 35+ components over 2-3 days
4. Remove old classes in v2.0.0

**Estimated Effort**: 4-5 days
**Priority**: HIGH - Should be done before v2.0.0

---

### 4. Inconsistent Vehicle API Pattern
**Status**: ⚠️ HIGH - Architecture Inconsistency
**Files**: `src/foundation/components/vehicles/`

**Problem**: Two different patterns for accessing vehicle meshes

**Modern Vehicles** (Cessna, Jet, Airliner, Hercules):
```typescript
const vehicle = new Cessna(config);
const mesh = await vehicle.load();
const object = vehicle.getObject();
```

**Legacy Vehicles** (Paraglider, Hangglider):
```typescript
const vehicle = new Paraglider(config);
const mesh = await vehicle.load();  // Different!
const object = vehicle.getMesh();   // Different!
```

**Root Cause**: Legacy vehicles don't extend BaseThreeComponent

**Solution**: Migrate legacy vehicles to modern architecture
1. Create ModernParaglider extends SimpleThreeComponent
2. Create ModernHangglider extends SimpleThreeComponent
3. Deprecate legacy classes
4. Update applications

**Estimated Effort**: 2-3 days
**Priority**: HIGH - Should be done before adding more vehicles

---

### 5. TypeScript Console Statements Remaining
**Status**: ✅ SIGNIFICANTLY IMPROVED - 23 batches completed
**Remaining**: ~103 console statements (down from 400+)

**Progress**:
- Batch 1-23: Fixed 400+ console statements
- Replaced with structured logger (info/warn/error/debug)
- Remaining mostly in demo apps and edge cases

**Next Targets**:
- Demo applications (workshop demos, etc.)
- Edge case error handling
- Final cleanup pass

**Estimated Effort**: 2-3 more batches (1-2 days)
**Priority**: MEDIUM - Most critical done

---

## 🟡 Medium Priority Issues

### 6. Legacy Code Scheduled for Removal in v2.0.0

**Flier Class** - ✅ Migrated, pending deletion
- Status: @deprecated, replaced by ParagliderController
- Migration: Complete (3 of 3 files)
- Removal: v2.0.0

**CameraController** - ✅ Removed
- Status: DELETED (Oct 1, 2025)
- Replaced by: CameraTargetController

---

### 7. Testing Infrastructure Gap
**Status**: ⚠️ CRITICAL GAP
**Current**: Only 3 test files exist

**Missing**:
- Component tests
- Integration tests
- E2E tests
- Behavior tests

**Impact**: High risk of regressions, difficult refactoring

**Solution**: Implement comprehensive test suite
- Jest for unit tests
- React Testing Library for components
- Playwright/Cypress for E2E

**Estimated Effort**: 5-10 days
**Priority**: MEDIUM (should be HIGH for long-term)

---

### 8. App Registry Import Mapping Duplication
**Status**: ⚠️ MEDIUM
**Files**: `src/shared/index.ts`, `src/config/apps.json`

**Problem**: Apps defined in both apps.json and manual importMap
- Duplication causes maintenance burden
- Manual synchronization error-prone
- Risk of inconsistency

**Solutions**:
1. Auto-generate import mapping from apps.json at build time
2. Use direct dynamic imports based on app metadata
3. Remove legacy "Stories" concept entirely

**Estimated Effort**: 2 days
**Priority**: MEDIUM

---

## 🟢 Low Priority Issues

### 9. Bundle Size Optimization
**Status**: Identified
**Current**: 1.1MB main bundles

**Opportunities**:
- Code splitting
- Tree shaking optimization
- Dynamic imports for large dependencies
- Asset optimization

**Estimated Effort**: 3-5 days
**Priority**: LOW

---

### 10. Accessibility Compliance Gap
**Status**: Identified
**Current**: Only 5 aria-label instances found

**Missing**:
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support

**Impact**: Excludes users with disabilities

**Solution**: Implement WCAG 2.1 compliance

**Estimated Effort**: 5-7 days
**Priority**: LOW (should be higher for production)

---

## 📋 Completed Items (Archive)

### ✅ Legacy CameraController Removal
**Completed**: October 1, 2025
- Removed 267 lines of deprecated code
- Updated all exports and imports
- All apps use CameraTargetController or THREE.PerspectiveCamera

### ✅ Flier Class Migration
**Completed**: October 1, 2025
- Created modern composition-based architecture
- Migrated all 3 usages
- Marked @deprecated, scheduled for v2.0.0 removal

### ✅ Location-Editor Application Removal
**Completed**: October 1, 2025
- Removed entire legacy application (1,100+ lines)
- Eliminated bloated state management
- Users directed to superior flyzone-editor

### ✅ TypeScript Improvements (Batches 1-23)
**Completed**: September-October 2025
- Fixed 400+ console statements
- Replaced 'any' types with proper interfaces
- Added structured logging throughout

### ✅ Legacy loadSync() Method Removal
**Completed**: September 2025
- Removed all loadSync() implementations
- Pure async architecture achieved
- 226 lines of legacy code eliminated

---

## 🎯 Recommended Action Plan

### Immediate (This Week)
1. ✅ Fix island-flying memory leak (behavior cleanup)
2. ✅ Fix island-flying excessive RAF loops
3. ⏳ Implement centralized render loop manager

### Short-term (This Month)
4. Migrate legacy vehicles to modern architecture
5. Rename base component classes for clarity
6. Finish console statement cleanup (remaining ~103)

### Medium-term (This Quarter)
7. Implement basic test coverage (>50%)
8. Auto-generate app import mapping
9. Bundle size optimization

### Long-term (Next Quarter)
10. WCAG 2.1 accessibility compliance
11. Remove all @deprecated code in v2.0.0
12. Comprehensive test coverage (>80%)

---

## 📊 Priority Matrix

```
Critical:
- Multiple render loops (memory leak risk)
- Island-flying app issues (performance + memory leak)

High:
- Confusing component naming
- Inconsistent vehicle API
- TypeScript cleanup (remaining ~103)

Medium:
- Testing infrastructure
- App registry duplication
- Legacy code removal (v2.0.0)

Low:
- Bundle size optimization
- Accessibility compliance
```

---

## 📝 How to Use This Document

1. **Add new debt**: Add to appropriate priority section with details
2. **Update status**: Mark progress (Identified → In Progress → Fixed)
3. **Move completed items**: Move to "Completed Items (Archive)" section
4. **Regular review**: Review during sprint planning
5. **Keep it clean**: Remove or archive stale items regularly
