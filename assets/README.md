# Assets Directory

This directory contains all static assets used throughout the Lanzarote 3D application. Assets are organized by their purpose and usage context.

## Directory Structure

### `/foundation`
Core assets used by the foundation systems and shared across multiple applications.

- **`/audio`** - Sound effects and music files
  - `/environment` - Background music and ambient sounds (wind, hurricane sounds)
  - `/vario` - Variometer beep sounds for paragliding simulation

- **`/models`** - 3D models in GLB/GLTF format
  - `/characters` - Character models (pilot, heads, helmets)
  - `/environment` - Terrain and environment models (lanzarote.glb)

- **`/textures`** - Texture maps and images
  - `/effects` - Visual effect textures
  - `/environment` - Environmental textures (sky, water, terrain)

### `/apps`
Application-specific assets organized by app name.

- **`/shared`** - Assets shared between multiple apps
  - `/icons` - Icon files used across applications

## Asset Loading Strategies

### Static Imports (Bundled)
Most 3D models and textures are imported statically and bundled with webpack:
```typescript
import model from '../assets/foundation/models/environment/lanzarote.glb';
```

### Dynamic Imports (Lazy Loaded)
Audio files use dynamic imports for better performance:
```typescript
const audioModule = await import('../assets/foundation/audio/environment/wind.mp3');
```

## File Formats

- **Audio**: `.mp3` for music/ambience, `.wav` for short sound effects
- **3D Models**: `.glb` (preferred), `.gltf`, `.obj`
- **Textures**: `.jpg`, `.png`, `.webp`
- **Icons**: `.svg`, `.png`

## Size Considerations

- **Large Assets** (>1MB): Consider lazy loading or dynamic imports
- **3D Models**: Use GLB format with Draco compression when possible
- **Textures**: Optimize resolution based on usage (lower res for distant objects)
- **Audio**: Use appropriate compression (MP3 for music, WAV for short effects)

## Adding New Assets

1. Place assets in the appropriate directory based on usage
2. Use foundation directory for shared/core assets
3. Use apps directory for app-specific assets
4. Consider file size and loading strategy
5. Update this README if adding new categories

## Optimization

Assets in this directory should be:
- Compressed appropriately for their use case
- Named descriptively (avoid generic names)
- Organized in the correct subdirectory
- Referenced properly in the source code

## Current Asset Summary

- **Total Size**: ~15.2MB
- **Largest Assets**:
  - lanzarote.glb (8.3MB) - Main terrain model
  - the-beat-of-nature.mp3 (5.3MB) - Background music
- **Audio Assets**: 6.5MB (dynamically loaded)
- **3D Models**: ~8.8MB (bundled)
- **Textures**: ~400KB (bundled)