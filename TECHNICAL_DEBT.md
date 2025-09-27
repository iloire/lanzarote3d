# Technical Debt

This file tracks technical debt items identified during development.

## Recent Improvements

### App Loading Architecture (2025-09-27)
✅ **Completed**: Replaced complex "Stories" system with simple app registry-based loading
- Removed StoryLoader class and complex proxy patterns
- Simplified to direct `loadApp()` function with app registry lookup
- Still using switch statement for webpack compatibility - could be further improved with dynamic imports if webpack config allows

## Identified Issues

### TypeScript Strict Mode Issues

The following files have TypeScript strict mode violations that should be addressed:

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

### Foundation Components

7. **src/foundation/components/environment/Sky.ts:171**
   - Element access without index signature on SkyOptions

8. **src/foundation/systems/scene/CameraController.ts**
   - Uses deprecated 'event.which' property (lines 37, 54)
   - Should use 'event.code' or 'event.key' instead

9. **Multiple Physics Components**
   - src/foundation/components/physics/Thermal.ts:40 - implicit 'any' parameter
   - src/foundation/components/physics/Weather.ts:81 - implicit 'any' parameter
   - src/foundation/components/physics/WindIndicator.ts:15 - implicit 'any' parameter

## Priority

High Priority:
- CameraController deprecated API usage
- Location editor implicit any types

Medium Priority:
- Workshop demo type safety issues
- Foundation component parameter typing

Low Priority:
- Override modifier warnings