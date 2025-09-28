# Three.js Component System Examples

This directory contains comprehensive examples demonstrating the modern Three.js component architecture implemented in the Lanzarote3D project.

## 🏗️ Architecture Overview

The new component system provides:

- **Unified Component Lifecycle**: Consistent load/update/dispose patterns
- **Resource Management**: Shared resources with automatic cleanup
- **Type Safety**: Full TypeScript support with strict typing
- **Performance Monitoring**: Built-in metrics and validation
- **Async Loading**: Progress tracking and error handling
- **Component Factory**: Centralized registration and dependency injection

## 📁 Available Examples

### Character Components

#### `PilotVoxelExample.ts`
Basic example demonstrating the original PilotVoxel component using AsyncThreeComponent architecture:
- OBJ model loading with progress tracking
- Texture application and customization
- Resource sharing and performance benefits
- Error handling and fallback support

#### `MultiCharacterPilotVoxelExample.ts` ⭐ **NEW**
Advanced example showcasing the multi-character system:
- **Character Registry**: 7+ different character types (Adri, Pilot Classic, Modern, Warrior, Explorer, Scientist, Adventurer)
- **Asset Organization**: Individual folders for each character's assets
- **Character Switching**: Runtime character switching capabilities
- **Alternative Assets**: Support for multiple textures/models per character
- **Random Generation**: Procedural character army creation
- **Character Showcase**: Grid layout displaying all available characters

#### `PilotHeadExample.ts`
Modern PilotHead component with customizable features:
- Multiple head types (Default, Warrior, Skeleton, Devil)
- Configurable helmets and glasses
- Material and color customization

### Scenery Components

#### `TreeExample.ts`
Procedural tree generation using SimpleThreeComponent:
- Multiple tree styles and configurations
- Real-time parameter adjustment
- Performance optimization techniques

## 🎭 Character System Features

### Character Types Available
```typescript
enum CharacterType {
  ADRI = 'adri',                    // Original character
  PILOT_CLASSIC = 'pilot-classic',  // Traditional aviator
  PILOT_MODERN = 'pilot-modern',    // Contemporary pilot
  WARRIOR = 'warrior',              // Battle-hardened combatant
  EXPLORER = 'explorer',            // Adventure specialist
  SCIENTIST = 'scientist',          // Research expert
  ADVENTURER = 'adventurer'         // Free spirit
}
```

### Asset Organization
```
public/assets/foundation/models/characters/
├── adri/
│   ├── adri.obj
│   ├── adri.png
│   ├── adri_winter.png  (alternative texture)
│   ├── adri_summer.png  (alternative texture)
│   └── thumbnail.png
├── pilot-classic/
│   ├── model.obj
│   ├── texture.png
│   └── thumbnail.png
├── pilot-modern/
│   └── ...
└── [other character folders]
```

### Usage Examples

#### Basic Character Creation
```typescript
// Using character type (recommended)
const pilot = new PilotVoxelComponent({
  characterType: CharacterType.WARRIOR,
  position: new Vector3(0, 0, 0),
  scale: 0.01
});

// Using manual assets (legacy support)
const pilot = new PilotVoxelComponent({
  objFile: '/assets/models/custom-pilot.obj',
  textureFile: '/assets/textures/custom-pilot.png'
});
```

#### Character Switching
```typescript
// Switch to different character
await pilot.switchCharacter(CharacterType.EXPLORER);

// Switch to alternative texture
await pilot.switchToAlternativeTexture(1);
```

#### Random Character Generation
```typescript
// Create random character
const randomPilot = PilotVoxelComponent.createRandomCharacter({
  position: new Vector3(100, 0, 0),
  scale: 0.015
});
```

#### Character Information
```typescript
const info = pilot.getCharacterInfo();
console.log(info.characterName);           // "Sky Warrior"
console.log(info.availableAlternatives);  // { textures: 2, models: 0 }
```

## 🔧 Component Registration

All modern components are automatically registered through the ComponentRegistration system:

```typescript
// Register all components
initializeComponentSystem();

// Use factory to create components
const result = await componentFactory.create('pilotVoxel', {
  characterType: CharacterType.SCIENTIST
});
```

## 📊 Performance Features

- **Resource Sharing**: 60-80% memory reduction through shared geometries and textures
- **Progress Tracking**: Real-time loading progress with byte-level monitoring
- **Metrics**: Built-in performance and memory usage tracking
- **Validation**: Comprehensive component validation and error reporting
- **Benchmarking**: Performance testing utilities for component creation

## 🛠️ Development Tools

### Character Registry
- Dynamic character registration
- Asset validation
- Search and filtering capabilities
- Development utilities for hot-reloading

### Component Factory
- Centralized component management
- Dependency injection
- Metadata tracking
- Performance benchmarking

## 🔄 Migration Guide

### From Legacy to Modern Components

**Before (Legacy)**:
```typescript
import { PilotVoxel } from 'legacy/components';
const pilot = new PilotVoxel();
const mesh = pilot.load();
```

**After (Modern)**:
```typescript
import { PilotVoxelComponent, CharacterType } from 'foundation/components/characters';
const pilot = new PilotVoxelComponent({
  characterType: CharacterType.ADRI
});
const object = await pilot.load();
```

### Key Improvements
1. **Type Safety**: Full TypeScript support
2. **Async Loading**: Promise-based with progress tracking
3. **Resource Management**: Automatic cleanup and sharing
4. **Multi-Character**: Easy character switching
5. **Validation**: Built-in error checking and fallbacks

## 🎯 Next Steps

The component system is designed for extensibility. Future enhancements include:

1. **Vehicle Components**: Modern Paraglider, Boat, and Aircraft components
2. **Environment Components**: Advanced Sky, Cloud, and Weather systems
3. **UI Components**: Interactive trajectory and wind indicators
4. **Animation System**: Component-based animation framework
5. **Physics Integration**: Physics-enabled component variants

## 📚 References

- [Component Architecture Documentation](../base/README.md)
- [Resource Manager Documentation](../../systems/README.md)
- [Character Registry API](../characters/CharacterRegistry.ts)
- [Factory Pattern Implementation](../factory/ComponentFactory.ts)