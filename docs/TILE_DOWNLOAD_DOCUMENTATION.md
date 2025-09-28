# Satellite Tile Download Documentation

## Overview
This document provides complete details on how satellite tiles are downloaded, processed, and integrated into the Lanzarote 3D terrain project.

## Geographic Coordinate System

### Verified GPS Bounds
Based on three-point GPS calibration using Google Maps verified coordinates:

```
North: 29.250°N
South: 28.606°N
East:  -13.526°W
West:  -13.878°W
```

### Reference Points Used for Calibration
1. **Point 1 (Northern edge)**: 30.639100°N, -13.597938°W
2. **Point 2 (Western edge)**: 29.027938°N, -13.810063°W
3. **Point 3 (Eastern edge)**: 28.905813°N, -13.473313°W

## Tile Coordinate Calculation

### Web Mercator Projection (EPSG:3857)
The tile server uses Web Mercator projection with the following formulas:

```javascript
// Convert latitude to tile Y coordinate
function latToY(lat, zoom) {
  const latRad = lat * Math.PI / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  return Math.floor((1 - mercN / Math.PI) / 2 * Math.pow(2, zoom));
}

// Convert longitude to tile X coordinate
function lonToX(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}
```

### Calculated Tile Range (Zoom Level 12)
```
X Range: 1891 → 1894 (4 tiles wide)
Y Range: 1699 → 1705 (7 tiles tall)
Total Tiles: 4 × 7 = 28 tiles
```

## Download Source

### Esri World Imagery Service
- **Base URL**: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **Source**: Esri, Maxar, Earthstar Geographics
- **Resolution**: ~10 meters per pixel at zoom level 12
- **Format**: JPEG
- **Tile Size**: 256×256 pixels

### Download Command
```bash
for x in {1891..1894}; do
  for y in {1699..1705}; do
    echo "Downloading tile ${x}_${y}...";
    curl -s "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/${y}/${x}" \
      -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
      -o "temp_tiles/tile_${x}_${y}.jpg";
  done;
done
```

### Required Headers
- **User-Agent**: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
  - Required to prevent blocking by Esri's servers
  - Simulates standard browser request

## Atlas Creation

### ImageMagick Montage Command
```bash
magick montage \
  temp_tiles/tile_1891_1699.jpg temp_tiles/tile_1892_1699.jpg temp_tiles/tile_1893_1699.jpg temp_tiles/tile_1894_1699.jpg \
  temp_tiles/tile_1891_1700.jpg temp_tiles/tile_1892_1700.jpg temp_tiles/tile_1893_1700.jpg temp_tiles/tile_1894_1700.jpg \
  temp_tiles/tile_1891_1701.jpg temp_tiles/tile_1892_1701.jpg temp_tiles/tile_1893_1701.jpg temp_tiles/tile_1894_1701.jpg \
  temp_tiles/tile_1891_1702.jpg temp_tiles/tile_1892_1702.jpg temp_tiles/tile_1893_1702.jpg temp_tiles/tile_1894_1702.jpg \
  temp_tiles/tile_1891_1703.jpg temp_tiles/tile_1892_1703.jpg temp_tiles/tile_1893_1703.jpg temp_tiles/tile_1894_1703.jpg \
  temp_tiles/tile_1891_1704.jpg temp_tiles/tile_1892_1704.jpg temp_tiles/tile_1893_1704.jpg temp_tiles/tile_1894_1704.jpg \
  temp_tiles/tile_1891_1705.jpg temp_tiles/tile_1892_1705.jpg temp_tiles/tile_1893_1705.jpg temp_tiles/tile_1894_1705.jpg \
  -tile 4x7 -geometry +0+0 \
  public/assets/textures/lanzarote-satellite-atlas-complete.jpg
```

### Atlas Layout
```
┌─────────┬─────────┬─────────┬─────────┐
│1891_1699│1892_1699│1893_1699│1894_1699│ ← Row 0 (North)
├─────────┼─────────┼─────────┼─────────┤
│1891_1700│1892_1700│1893_1700│1894_1700│ ← Row 1
├─────────┼─────────┼─────────┼─────────┤
│1891_1701│1892_1701│1893_1701│1894_1701│ ← Row 2
├─────────┼─────────┼─────────┼─────────┤
│1891_1702│1892_1702│1893_1702│1894_1702│ ← Row 3
├─────────┼─────────┼─────────┼─────────┤
│1891_1703│1892_1703│1893_1703│1894_1703│ ← Row 4
├─────────┼─────────┼─────────┼─────────┤
│1891_1704│1892_1704│1893_1704│1894_1704│ ← Row 5
├─────────┼─────────┼─────────┼─────────┤
│1891_1705│1892_1705│1893_1705│1894_1705│ ← Row 6 (South)
└─────────┴─────────┴─────────┴─────────┘
    ↑         ↑         ↑         ↑
  Col 0     Col 1     Col 2     Col 3
 (West)                        (East)
```

## UV Mapping Generation

### UV Coordinate System
- **U Axis**: West (0.0) → East (1.0)
- **V Axis**: North (0.0) → South (1.0)
- **Tile Size**: U = 0.25 (1/4), V = 0.142857 (1/7)

### UV Bounds Calculation
```javascript
// For tile at grid position (col, row)
const uvBounds = {
  uMin: col * 0.25,           // 0.0, 0.25, 0.5, 0.75
  uMax: (col + 1) * 0.25,     // 0.25, 0.5, 0.75, 1.0
  vMin: row * 0.142857,       // 0.0, 0.142857, 0.285714, ...
  vMax: (row + 1) * 0.142857  // 0.142857, 0.285714, 0.428571, ...
};
```

### Geographic Extent Calculation
```javascript
// Convert tile coordinates back to geographic bounds
function tileToLatLon(x, y, zoom) {
  const n = Math.pow(2, zoom);
  const lonDeg = x / n * 360.0 - 180.0;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
  const latDeg = latRad * 180.0 / Math.PI;
  return { lat: latDeg, lon: lonDeg };
}
```

## File Structure

### Generated Files
```
public/assets/textures/
├── lanzarote-satellite-atlas-complete.jpg     # Complete 4×7 atlas (281KB)
├── lanzarote-tile-mapping-complete.json       # UV mapping configuration
└── lanzarote-tile-mapping-verified.json       # 2×2 test mapping (legacy)

temp_tiles/
├── tile_1891_1699.jpg ... tile_1894_1705.jpg  # Individual tiles (28 files)
```

### Configuration JSON Structure
```json
{
  "tiles": [
    {
      "x": 1891,
      "y": 1699,
      "zoom": 12,
      "uvBounds": {
        "uMin": 0.0,
        "vMin": 0.0,
        "uMax": 0.25,
        "vMax": 0.142857
      },
      "geoExtent": {
        "north": 29.250,
        "south": 29.158,
        "east": -13.790,
        "west": -13.878
      }
    }
    // ... 27 more tiles
  ],
  "attribution": "© Esri, Maxar, Earthstar Geographics",
  "totalBounds": {
    "north": 29.250,
    "south": 28.606,
    "east": -13.526,
    "west": -13.878
  },
  "source": "Esri",
  "zoomLevel": 12,
  "format": "jpg",
  "resolution": 10,
  "description": "Complete 4x7 grid satellite imagery covering verified GPS bounds of Lanzarote island"
}
```

## Three.js Integration

### Texture Configuration
```javascript
// Texture setup for optimal satellite imagery
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;
texture.magFilter = THREE.LinearFilter;
texture.minFilter = THREE.LinearFilter;
texture.generateMipmaps = false;  // Prevent seaming
texture.flipY = true;             // Correct orientation
texture.colorSpace = THREE.SRGBColorSpace;
```

### UV Mapping Process
1. **Terrain Vertex Processing**: For each vertex in the terrain mesh
2. **Coordinate Normalization**: Convert 3D position to normalized coordinates
3. **Geographic Mapping**: Map to latitude/longitude using terrain bounds
4. **Tile Lookup**: Find which tile contains the coordinate
5. **UV Calculation**: Calculate UV coordinates within the tile's bounds

## Quality & Resolution

### Zoom Level 12 Specifications
- **Ground Resolution**: ~10 meters per pixel
- **Tile Coverage**: Each tile covers ~0.092° latitude × ~0.088° longitude
- **Total Coverage**: 0.644° × 0.352° (71.5km × 39.1km approx.)
- **Atlas Resolution**: 1024×1792 pixels (4×256 × 7×256)

## Validation & Testing

### Coordinate Verification
- Three-point calibration using Google Maps coordinates
- Distance-weighted interpolation for accuracy
- Cross-validation with known Lanzarote landmarks

### Visual Quality Checks
- Tile alignment at boundaries
- Color consistency across tiles
- No visible seams or artifacts
- Correct geographic orientation (North up)

## Usage Guidelines

### File Paths
```javascript
// Current configuration
textureAtlas: '/assets/textures/lanzarote-satellite-atlas-complete.jpg'
tileMap: '/assets/textures/lanzarote-tile-mapping-complete.json'
```

### Cache Busting
URLs include `?v=${Date.now()}` parameter to prevent browser caching during development.

### Performance Considerations
- Single atlas file reduces HTTP requests
- No mipmaps to prevent seaming
- Linear filtering for smooth appearance
- Compressed JPEG format for smaller file size

## Debugging Tools

### Debug Page Location
`/apps/tools/workshop/demos/tile-debug/`

### Debug Features
- Interactive tile grid visualization
- Geographic coordinate display
- UV mapping inspection
- Download process documentation
- Real-time tile information

## Legal Compliance

### Attribution Requirements
"© Esri, Maxar, Earthstar Geographics"

### Usage Terms
- Educational/development use
- No commercial redistribution of tiles
- Respect Esri's terms of service
- Reasonable request rates (not bulk downloading)

## Troubleshooting

### Common Issues
1. **HTTP 403 Errors**: Add proper User-Agent header
2. **Tile Alignment**: Verify UV bounds calculation
3. **Color Mismatches**: Check tile download order
4. **Seaming**: Disable mipmaps, use linear filtering

### Validation Commands
```bash
# Check all tiles downloaded
ls temp_tiles/*.jpg | wc -l  # Should be 28

# Verify atlas creation
file public/assets/textures/lanzarote-satellite-atlas-complete.jpg

# Check JSON validity
cat public/assets/textures/lanzarote-tile-mapping-complete.json | jq .
```