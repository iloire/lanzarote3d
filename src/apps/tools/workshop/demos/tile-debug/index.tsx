import React, { useState, useEffect } from 'react';

interface TileInfo {
  x: number;
  y: number;
  zoom: number;
  uvBounds: {
    uMin: number;
    vMin: number;
    uMax: number;
    vMax: number;
  };
  geoExtent: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface TileMapping {
  tiles: TileInfo[];
  attribution: string;
  totalBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  source: string;
  zoomLevel: number;
  format: string;
  resolution: number;
  description: string;
}

const TileDebugPage: React.FC = () => {
  const [tileMapping, setTileMapping] = useState<TileMapping | null>(null);
  const [selectedTile, setSelectedTile] = useState<TileInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTileMapping();
  }, []);

  const loadTileMapping = async () => {
    try {
      console.log('🔧 Loading tile mapping...');
      const response = await fetch('/assets/textures/lanzarote-tile-mapping-optimized.json');
      console.log('🔧 Response:', response.status, response.statusText);
      const data = await response.json();
      console.log('🔧 Loaded', data.tiles.length, 'tiles');
      setTileMapping(data);
    } catch (error) {
      console.error('🔧 Failed to load tile mapping:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTileGridPosition = (tile: TileInfo) => {
    if (!tileMapping) return { row: 0, col: 0 };

    const minX = Math.min(...tileMapping.tiles.map(t => t.x));
    const minY = Math.min(...tileMapping.tiles.map(t => t.y));

    return {
      row: tile.y - minY,
      col: tile.x - minX
    };
  };

  const calculateTileCoordinates = (north: number, south: number, east: number, west: number, zoom: number) => {
    // Web Mercator projection calculations
    const latToY = (lat: number, zoom: number) => {
      const latRad = lat * Math.PI / 180;
      const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      return Math.floor((1 - mercN / Math.PI) / 2 * Math.pow(2, zoom));
    };

    const lonToX = (lon: number, zoom: number) => {
      return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    };

    return {
      xMin: lonToX(west, zoom),
      xMax: lonToX(east, zoom),
      yMin: latToY(north, zoom),
      yMax: latToY(south, zoom)
    };
  };

  const renderTileGrid = () => {
    if (!tileMapping) return null;

    const gridSize = 80; // Size of each tile in pixels
    const rows = Math.max(...tileMapping.tiles.map(t => getTileGridPosition(t).row)) + 1;
    const cols = Math.max(...tileMapping.tiles.map(t => getTileGridPosition(t).col)) + 1;

    return (
      <div style={{
        position: 'relative',
        border: '4px solid #00b894',
        backgroundColor: '#f1f2f6',
        width: cols * gridSize,
        height: rows * gridSize,
        margin: '0 auto'
      }}>
        {tileMapping.tiles.map((tile, index) => {
          const { row, col } = getTileGridPosition(tile);
          const isSelected = selectedTile?.x === tile.x && selectedTile?.y === tile.y;

          return (
            <div
              key={`${tile.x}-${tile.y}`}
              style={{
                position: 'absolute',
                left: col * gridSize,
                top: row * gridSize,
                width: gridSize,
                height: gridSize,
                border: isSelected ? '2px solid #4299e1' : '1px solid #999',
                backgroundColor: isSelected ? '#bee3f8' : '#f7fafc',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '10px',
                textAlign: 'center'
              }}
              onClick={() => setSelectedTile(tile)}
              title={`Tile ${tile.x}_${tile.y}`}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold' }}>
                {tile.x}_{tile.y}
              </div>
              <div style={{ fontSize: '8px', color: '#666' }}>
                UV: {tile.uvBounds.uMin.toFixed(2)},{tile.uvBounds.vMin.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const verifiedCoords = {
    north: 29.306,
    south: 28.691,
    east: -13.359,
    west: -13.975
  };

  const calculatedTiles = calculateTileCoordinates(
    verifiedCoords.north,
    verifiedCoords.south,
    verifiedCoords.east,
    verifiedCoords.west,
    12
  );

  if (loading) {
    return <div style={{ padding: '32px' }}>Loading tile mapping...</div>;
  }

  if (!tileMapping) {
    return <div style={{ padding: '32px', color: 'red' }}>❌ Failed to load tile mapping data</div>;
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          🔧 Satellite Tile Debug Dashboard
        </h1>
        <p style={{ color: '#666' }}>
          Visualizing tile download process, calculations, and atlas creation
        </p>
        <div style={{ padding: '8px', backgroundColor: '#f0fff4', border: '1px solid #68d391', borderRadius: '4px', color: '#2d7748', marginBottom: '16px' }}>
          ✅ Loaded {tileMapping.tiles.length} tiles successfully - Interactive grid below
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Geographic Bounds & Calculations */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', backgroundColor: 'white' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            🌍 Geographic Bounds & Tile Calculations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Verified GPS Coordinates</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px', fontFamily: 'monospace' }}>
                <div>North: {verifiedCoords.north}°</div>
                <div>South: {verifiedCoords.south}°</div>
                <div>East: {verifiedCoords.east}°</div>
                <div>West: {verifiedCoords.west}°</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Calculated Tile Range (Zoom 12)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px', fontFamily: 'monospace' }}>
                <div>X Range: {calculatedTiles.xMin} → {calculatedTiles.xMax}</div>
                <div>Y Range: {calculatedTiles.yMin} → {calculatedTiles.yMax}</div>
                <div>Width: {calculatedTiles.xMax - calculatedTiles.xMin + 1} tiles</div>
                <div>Height: {calculatedTiles.yMax - calculatedTiles.yMin + 1} tiles</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Download URLs</h4>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#f7fafc', padding: '8px', borderRadius: '4px' }}>
                <div>Base: server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/Y/X</div>
                <div style={{ marginTop: '4px', color: '#666' }}>Example: .../tile/12/1700/1892</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Atlas Creation</h4>
              <div style={{ fontSize: '14px' }}>
                <div>Grid: 7×8 tiles (56 total)</div>
                <div>Command: <code style={{ fontSize: '12px', backgroundColor: '#f7fafc', padding: '2px 4px' }}>magick montage -tile 7x8 -geometry +0+0</code></div>
                <div>Output: lanzarote-satellite-atlas-optimized.jpg</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tile Information */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', backgroundColor: 'white' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            🗂️ Tile Information
          </h3>
          {tileMapping && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{
                  backgroundColor: '#f7fafc',
                  border: '1px solid #e2e8f0',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  marginBottom: '8px',
                  display: 'inline-block'
                }}>
                  {tileMapping.tiles.length} tiles total
                </span>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {tileMapping.description}
                </div>
              </div>

              {selectedTile ? (
                <div style={{ border: '1px solid #4299e1', padding: '12px', borderRadius: '8px', backgroundColor: '#ebf8ff' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>
                    Selected Tile: {selectedTile.x}_{selectedTile.y}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>Geographic Extent:</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        N: {selectedTile.geoExtent.north.toFixed(3)}°<br/>
                        S: {selectedTile.geoExtent.south.toFixed(3)}°<br/>
                        E: {selectedTile.geoExtent.east.toFixed(3)}°<br/>
                        W: {selectedTile.geoExtent.west.toFixed(3)}°
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '500' }}>UV Bounds:</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        U: {selectedTile.uvBounds.uMin.toFixed(3)} → {selectedTile.uvBounds.uMax.toFixed(3)}<br/>
                        V: {selectedTile.uvBounds.vMin.toFixed(3)} → {selectedTile.uvBounds.vMax.toFixed(3)}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    Grid Position: Row {getTileGridPosition(selectedTile).row}, Col {getTileGridPosition(selectedTile).col}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#999', textAlign: 'center', padding: '16px' }}>
                  Click on a tile in the grid to see details
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tile Grid Visualization */}
      <div style={{ border: '3px solid #ff6b6b', borderRadius: '8px', padding: '24px', backgroundColor: '#fff5f5', marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#d63031' }}>
          🔲 TILE GRID VISUALIZATION - INTERACTIVE GRID BELOW
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Interactive grid showing tile layout and UV mapping. Click tiles for details.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>

            {/* Complete Satellite Atlas */}
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '12px', color: '#2d3748' }}>
                📸 Optimized Satellite Atlas (7×8 tiles - COMPLETE ISLAND, NO WASTE)
              </h4>
              <img
                src="/assets/textures/lanzarote-satellite-atlas-optimized.jpg"
                alt="Complete satellite atlas of Lanzarote"
                style={{
                  maxWidth: '600px',
                  border: '2px solid #2d3748',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'block';
                }}
              />
              <div style={{ display: 'none', padding: '20px', backgroundColor: '#fed7d7', color: '#c53030', borderRadius: '8px' }}>
                ❌ Satellite atlas image not found at /assets/textures/lanzarote-satellite-atlas-full.jpg
              </div>
            </div>

            {/* Interactive Grid Overlay */}
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '12px', color: '#2d3748' }}>
                🎯 Interactive Tile Grid (click tiles for details)
              </h4>
              {renderTileGrid()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '14px' }}>
            <div>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Layout</div>
              <div>4 columns × 7 rows</div>
              <div>West → East (X: 1891-1894)</div>
              <div>North → South (Y: 1699-1705)</div>
            </div>
            <div>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>UV Mapping</div>
              <div>U: 0.0 → 1.0 (West → East)</div>
              <div>V: 0.0 → 1.0 (North → South)</div>
              <div>Each tile: 0.25 × 0.142857</div>
            </div>
            <div>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Atlas Position</div>
              <div>Top-left: Tile 1891_1699</div>
              <div>Bottom-right: Tile 1894_1705</div>
              <div>Sequential row ordering</div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Process */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', backgroundColor: 'white', marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          ⬇️ Download Process
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Step 1: Calculate Tile Range</h4>
              <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Convert GPS bounds to Web Mercator</div>
                <div>• Apply zoom level 12 calculations</div>
                <div>• Determine X/Y tile coordinates</div>
                <div>• Result: 7×8 grid (56 tiles)</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Step 2: Download Tiles</h4>
              <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Loop through X: 1889-1895</div>
                <div>• Loop through Y: 1699-1706</div>
                <div>• Download from Esri World Imagery</div>
                <div>• Save as tile_X_Y.jpg</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Step 3: Create Atlas</h4>
              <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Use ImageMagick montage</div>
                <div>• Arrange in 6×10 grid</div>
                <div>• No gaps between tiles</div>
                <div>• Output: complete atlas</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Step 4: Generate UV Mapping</h4>
              <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Calculate UV bounds per tile</div>
                <div>• Map geographic extents</div>
                <div>• Create JSON configuration</div>
                <div>• Enable precise texture mapping</div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f0fff4',
            border: '1px solid #68d391',
            borderRadius: '8px'
          }}>
            <h4 style={{ fontWeight: '600', color: '#2d7748', marginBottom: '8px' }}>
              ✅ Current Status
            </h4>
            <div style={{ fontSize: '14px', color: '#2d7748' }}>
              Complete 6×10 satellite atlas downloaded and configured with expanded GPS coverage.
              Ready for terrain texture mapping with full island coverage and precise geographic alignment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TileDebugPage;