# Satellite Texture Assets

This directory contains satellite imagery assets for the Lanzarote 3D terrain system.

## File Structure

- `lanzarote-satellite-atlas.jpg` - Main satellite texture atlas (combine multiple tiles into single image)
- `lanzarote-tile-mapping.json` - Tile mapping configuration defining UV coordinates and geographic bounds
- `placeholder-satellite.jpg` - Development/testing placeholder texture

## How to Add Real Satellite Imagery

### 1. Download Tiles from OpenStreetMap

You can use tools like [TileDownloader](https://github.com/AliFlux/TileDownloader) or write a simple script to download tiles from OpenStreetMap:

```bash
# Example: Download Lanzarote tiles at zoom level 12
# Bounds: North: 29.25, South: 28.85, East: -13.40, West: -13.90

# Tile calculations for zoom 12:
# x range: 828-829
# y range: 1316-1317

wget "https://tile.openstreetmap.org/12/828/1316.png" -O "tile_828_1316.png"
wget "https://tile.openstreetmap.org/12/829/1316.png" -O "tile_829_1316.png"
wget "https://tile.openstreetmap.org/12/828/1317.png" -O "tile_828_1317.png"
wget "https://tile.openstreetmap.org/12/829/1317.png" -O "tile_829_1317.png"
```

### 2. Create Texture Atlas

Combine the downloaded tiles into a single 2x2 texture atlas:

```
[828,1316] [829,1316]
[828,1317] [829,1317]
```

Use image editing software or ImageMagick:

```bash
montage tile_828_1316.png tile_829_1316.png tile_828_1317.png tile_829_1317.png \
        -tile 2x2 -geometry +0+0 lanzarote-satellite-atlas.jpg
```

### 3. Update Tile Mapping

The `lanzarote-tile-mapping.json` file already contains the correct UV coordinates for this 2x2 layout.

## Attribution Requirements

When using OpenStreetMap tiles, include attribution:
"© OpenStreetMap contributors"

For other providers (Google, Mapbox, Esri), check their specific attribution requirements.

## Performance Considerations

- Keep texture atlas size reasonable (recommended: 1024x1024 or 2048x2048)
- Use JPG format for satellite imagery to reduce file size
- Consider generating multiple resolution versions for LOD (Level of Detail)

## Alternative Providers

- **Esri World Imagery**: Higher resolution satellite imagery
- **Mapbox Satellite**: High-quality satellite imagery with API
- **Google Maps Static API**: Satellite view tiles (requires API key)

Remember to respect provider terms of service and usage limits.