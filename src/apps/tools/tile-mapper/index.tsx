import * as THREE from 'three';
import { AppBase } from '../../shared/AppBase';
import { StoryOptions } from '../../shared/types';
import { getAppConfig } from '../../config/app-registry';

/**
 * Comprehensive Tile Mapper Debug Tool - Interactive satellite tile system debugger
 *
 * This tool helps debug satellite tiling issues on Lanzarote island by providing:
 * - Interactive tile grid visualization
 * - Tile coordinate calculations and conversions
 * - URL generation and testing
 * - Coverage analysis and boundary verification
 * - Real-time tile preview and status checking
 */
class TileMapperApp extends AppBase {
  private animationId: number | undefined;
  private uiContainer: HTMLElement | undefined;
  private selectedTile: { x: number; y: number; zoom: number } | null = null;
  private tileGridContainer: HTMLElement | undefined;

  // Lanzarote island bounds and tile configuration
  private readonly LANZAROTE_BOUNDS = {
    north: 29.250,
    south: 28.606,
    east: -13.359,
    west: -13.975
  };

  private readonly ZOOM_LEVEL = 12;
  private readonly TILE_SIZE = 256;

  constructor() {
    const appConfig = getAppConfig('tile-mapper');
    super({
      name: appConfig?.name || 'Tile Mapper Debugger',
      description: appConfig?.description || 'Interactive satellite tile system debugger and analyzer',
      requiredComponents: ['scene', 'camera', 'renderer'],
      scene: {
        environment: 'minimal',
        lighting: 'static',
        physics: false,
        fog: { enabled: false },
      },
      performance: {
        monitoring: false,
        logIntervalMs: 30000,
      },
    });
  }

  async load(options: StoryOptions): Promise<void> {
    const { scene, camera, renderer } = options;

    this.initializeCore(options);
    await this.init(scene, camera, renderer, options);
    this.isLoaded = true;
  }

  async init(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    options?: StoryOptions
  ): Promise<void> {
    // Set up basic scene
    scene.background = new THREE.Color(0x1a1a2e);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    this.createTileDebugUI();
    console.log('🗺️ Tile Mapper Debugger initialized');
  }

  private lonLatToTileXY(lon: number, lat: number, zoom: number): { x: number; y: number } {
    const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  }

  private tileXYToLonLat(x: number, y: number, zoom: number): { lon: number; lat: number } {
    const n = Math.pow(2, zoom);
    const lon = (x / n) * 360 - 180;
    const lat = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * (180 / Math.PI);
    return { lon, lat };
  }

  private calculateTileGrid(): Array<{ x: number; y: number; bounds: any; url: string; status: string }> {
    const { north, south, east, west } = this.LANZAROTE_BOUNDS;
    const zoom = this.ZOOM_LEVEL;

    // Calculate tile boundaries
    const topLeft = this.lonLatToTileXY(west, north, zoom);
    const bottomRight = this.lonLatToTileXY(east, south, zoom);

    const tiles = [];
    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        const tileBounds = {
          topLeft: this.tileXYToLonLat(x, y, zoom),
          bottomRight: this.tileXYToLonLat(x + 1, y + 1, zoom)
        };

        const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;

        tiles.push({
          x,
          y,
          bounds: tileBounds,
          url,
          status: 'unknown'
        });
      }
    }

    return tiles;
  }

  private async testTileURL(url: string): Promise<string> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok ? 'available' : 'error';
    } catch (error) {
      return 'error';
    }
  }

  private createTileDebugUI(): void {
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: calc(100% - 240px);
      height: calc(100% - 40px);
      background: rgba(26, 26, 46, 0.95);
      color: #e0e0e0;
      z-index: 1000;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      border-radius: 8px;
      border: 1px solid #444;
    `;

    const tiles = this.calculateTileGrid();
    const tileCount = tiles.length;
    const gridWidth = Math.max(...tiles.map(t => t.x)) - Math.min(...tiles.map(t => t.x)) + 1;
    const gridHeight = Math.max(...tiles.map(t => t.y)) - Math.min(...tiles.map(t => t.y)) + 1;

    this.uiContainer.innerHTML = `
      <div style="padding: 20px;">

        <!-- Header -->
        <div style="margin-bottom: 24px; border-bottom: 2px solid #4a9eff; padding-bottom: 16px;">
          <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #4a9eff;">
            🗺️ Satellite Tile Mapper Debugger
          </h1>
          <p style="margin: 8px 0 0 0; color: #b0b0b0;">
            Interactive debugging tool for Lanzarote island satellite tiling system
          </p>
        </div>

        <!-- Grid Overview -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">

          <div style="background: rgba(74, 158, 255, 0.1); border: 1px solid #4a9eff; border-radius: 8px; padding: 16px;">
            <h3 style="margin: 0 0 12px 0; color: #4a9eff;">📊 Grid Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px;">
              <div><strong>Total Tiles:</strong> ${tileCount}</div>
              <div><strong>Grid Size:</strong> ${gridWidth}×${gridHeight}</div>
              <div><strong>Zoom Level:</strong> ${this.ZOOM_LEVEL}</div>
              <div><strong>Tile Size:</strong> ${this.TILE_SIZE}px</div>
              <div><strong>X Range:</strong> ${Math.min(...tiles.map(t => t.x))} → ${Math.max(...tiles.map(t => t.x))}</div>
              <div><strong>Y Range:</strong> ${Math.min(...tiles.map(t => t.y))} → ${Math.max(...tiles.map(t => t.y))}</div>
            </div>
          </div>

          <div style="background: rgba(74, 158, 255, 0.1); border: 1px solid #4a9eff; border-radius: 8px; padding: 16px;">
            <h3 style="margin: 0 0 12px 0; color: #4a9eff;">🌍 Geographic Bounds</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; font-family: monospace;">
              <div><strong>North:</strong> ${this.LANZAROTE_BOUNDS.north}°</div>
              <div><strong>South:</strong> ${this.LANZAROTE_BOUNDS.south}°</div>
              <div><strong>East:</strong> ${this.LANZAROTE_BOUNDS.east}°</div>
              <div><strong>West:</strong> ${this.LANZAROTE_BOUNDS.west}°</div>
              <div style="grid-column: 1 / -1; margin-top: 8px;">
                <strong>Coverage:</strong> ${(this.LANZAROTE_BOUNDS.north - this.LANZAROTE_BOUNDS.south).toFixed(3)}° × ${(this.LANZAROTE_BOUNDS.east - this.LANZAROTE_BOUNDS.west).toFixed(3)}°
              </div>
            </div>
          </div>

        </div>

        <!-- Interactive Tile Grid -->
        <div style="background: rgba(74, 158, 255, 0.1); border: 1px solid #4a9eff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px 0; color: #4a9eff;">🔍 Interactive Tile Grid</h3>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #b0b0b0;">
            Click on any tile to see detailed information, bounds, and test URL availability
          </p>
          <div id="tile-grid-container" style="
            display: grid;
            grid-template-columns: repeat(${gridWidth}, 1fr);
            gap: 2px;
            max-width: 100%;
            background: #2a2a4e;
            padding: 8px;
            border-radius: 4px;
            overflow: auto;
          "></div>
        </div>

        <!-- Selected Tile Details -->
        <div id="tile-details" style="
          background: rgba(74, 158, 255, 0.1);
          border: 1px solid #4a9eff;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: none;
        ">
          <h3 style="margin: 0 0 16px 0; color: #4a9eff;">📍 Selected Tile Details</h3>
          <div id="tile-info-content"></div>
        </div>

        <!-- URL Testing -->
        <div style="background: rgba(74, 158, 255, 0.1); border: 1px solid #4a9eff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px 0; color: #4a9eff;">🔗 URL Format & Testing</h3>

          <div style="margin-bottom: 16px;">
            <strong>Esri ArcGIS World Imagery URL Pattern:</strong><br>
            <code style="background: #1a1a2e; padding: 8px; border-radius: 4px; display: block; margin-top: 8px; font-size: 12px;">
              https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
            </code>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div>
              <strong>Alternative Sources:</strong>
              <ul style="margin: 8px 0; font-size: 12px;">
                <li>OpenStreetMap</li>
                <li>Mapbox Satellite</li>
                <li>Google Maps (API key required)</li>
                <li>Bing Maps</li>
              </ul>
            </div>
            <div>
              <strong>Tile Coordinates:</strong>
              <ul style="margin: 8px 0; font-size: 12px;">
                <li>Z: Zoom level (0-18+)</li>
                <li>X: Longitude tile index</li>
                <li>Y: Latitude tile index</li>
                <li>Format: Usually PNG or JPEG</li>
              </ul>
            </div>
            <div>
              <strong>Common Issues:</strong>
              <ul style="margin: 8px 0; font-size: 12px;">
                <li>Rate limiting</li>
                <li>CORS restrictions</li>
                <li>Incorrect coordinates</li>
                <li>Missing tiles at zoom levels</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Download Commands -->
        <div style="background: rgba(74, 158, 255, 0.1); border: 1px solid #4a9eff; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 16px 0; color: #4a9eff;">💻 Download Commands</h3>

          <div style="background: #1a1a2e; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 11px; overflow-x: auto;">
            <div style="color: #4a9eff; margin-bottom: 8px;"># Download all tiles for Lanzarote (${tileCount} tiles)</div>
            <div style="margin-bottom: 12px;">
for x in {${Math.min(...tiles.map(t => t.x))}..${Math.max(...tiles.map(t => t.x))}}; do
  for y in {${Math.min(...tiles.map(t => t.y))}..${Math.max(...tiles.map(t => t.y))}}; do
    curl "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${this.ZOOM_LEVEL}/\${y}/\${x}" \\
         -o "tile_\${x}_\${y}.jpg" \\
         --user-agent "TileMapper/1.0" \\
         --max-time 30
    sleep 0.1  # Be respectful to the server
  done
done</div>

            <div style="color: #4a9eff; margin-bottom: 8px;"># Create atlas with ImageMagick</div>
            <div style="margin-bottom: 12px;">magick montage tile_*.jpg -tile ${gridWidth}x${gridHeight} -geometry +0+0 lanzarote_satellite_atlas.jpg</div>

            <div style="color: #4a9eff; margin-bottom: 8px;"># Alternative: Download with wget</div>
            <div>wget --limit-rate=100k --wait=1 "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${this.ZOOM_LEVEL}/[y]/[x]"</div>
          </div>
        </div>

      </div>
    `;

    // Create interactive tile grid
    this.createInteractiveTileGrid(tiles);

    document.body.appendChild(this.uiContainer);
  }

  private createInteractiveTileGrid(tiles: Array<{ x: number; y: number; bounds: any; url: string; status: string }>): void {
    setTimeout(() => {
      const gridContainer = document.getElementById('tile-grid-container');
      if (!gridContainer) return;

      const minX = Math.min(...tiles.map(t => t.x));
      const minY = Math.min(...tiles.map(t => t.y));
      const maxX = Math.max(...tiles.map(t => t.x));
      const maxY = Math.max(...tiles.map(t => t.y));

      // Create grid cells
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const tile = tiles.find(t => t.x === x && t.y === y);
          const cell = document.createElement('div');

          cell.style.cssText = `
            aspect-ratio: 1;
            background: ${tile ? '#4a9eff' : '#333'};
            border: 1px solid #666;
            border-radius: 2px;
            cursor: ${tile ? 'pointer' : 'default'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: white;
            transition: all 0.2s;
            min-width: 40px;
            min-height: 40px;
          `;

          if (tile) {
            cell.textContent = `${x},${y}`;
            cell.title = `Tile ${x},${y}\nClick for details`;

            cell.addEventListener('mouseenter', () => {
              cell.style.background = '#6bb6ff';
              cell.style.transform = 'scale(1.1)';
              cell.style.zIndex = '10';
            });

            cell.addEventListener('mouseleave', () => {
              cell.style.background = '#4a9eff';
              cell.style.transform = 'scale(1)';
              cell.style.zIndex = '1';
            });

            cell.addEventListener('click', () => {
              this.selectTile(tile);
            });
          }

          gridContainer.appendChild(cell);
        }
      }
    }, 100);
  }

  private async selectTile(tile: { x: number; y: number; bounds: any; url: string; status: string }): Promise<void> {
    this.selectedTile = { x: tile.x, y: tile.y, zoom: this.ZOOM_LEVEL };

    const detailsContainer = document.getElementById('tile-details');
    const infoContent = document.getElementById('tile-info-content');

    if (!detailsContainer || !infoContent) return;

    detailsContainer.style.display = 'block';
    infoContent.innerHTML = '<div style="color: #4a9eff;">⏳ Testing tile availability...</div>';

    // Test URL availability
    const status = await this.testTileURL(tile.url);

    infoContent.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">

        <div>
          <h4 style="margin: 0 0 8px 0; color: #4a9eff;">Tile Coordinates</h4>
          <div style="font-family: monospace; font-size: 12px;">
            <div><strong>X:</strong> ${tile.x}</div>
            <div><strong>Y:</strong> ${tile.y}</div>
            <div><strong>Zoom:</strong> ${this.ZOOM_LEVEL}</div>
            <div style="margin-top: 8px;"><strong>Status:</strong>
              <span style="color: ${status === 'available' ? '#4ade80' : '#f87171'};">
                ${status === 'available' ? '✅ Available' : '❌ Error/Unavailable'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 style="margin: 0 0 8px 0; color: #4a9eff;">Geographic Bounds</h4>
          <div style="font-family: monospace; font-size: 12px;">
            <div><strong>NW:</strong> ${tile.bounds.topLeft.lat.toFixed(6)}°, ${tile.bounds.topLeft.lon.toFixed(6)}°</div>
            <div><strong>SE:</strong> ${tile.bounds.bottomRight.lat.toFixed(6)}°, ${tile.bounds.bottomRight.lon.toFixed(6)}°</div>
            <div><strong>Width:</strong> ${(tile.bounds.bottomRight.lon - tile.bounds.topLeft.lon).toFixed(6)}°</div>
            <div><strong>Height:</strong> ${(tile.bounds.topLeft.lat - tile.bounds.bottomRight.lat).toFixed(6)}°</div>
          </div>
        </div>

      </div>

      <div style="margin-top: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #4a9eff;">Tile URL</h4>
        <div style="background: #1a1a2e; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 11px; word-break: break-all;">
          ${tile.url}
        </div>
        <div style="margin-top: 8px; display: flex; gap: 8px;">
          <button onclick="navigator.clipboard.writeText('${tile.url}')" style="
            background: #4a9eff;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">📋 Copy URL</button>
          <button onclick="window.open('${tile.url}', '_blank')" style="
            background: #22c55e;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">🖼️ Open Image</button>
        </div>
      </div>

      <div style="margin-top: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #4a9eff;">Download Commands</h4>
        <div style="background: #1a1a2e; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 11px;">
          <div style="color: #4a9eff;"># Download this specific tile</div>
          <div>curl "${tile.url}" -o "tile_${tile.x}_${tile.y}.jpg"</div>
          <br>
          <div style="color: #4a9eff;"># With error handling and metadata</div>
          <div>curl "${tile.url}" \\<br>
          &nbsp;&nbsp;-o "tile_${tile.x}_${tile.y}.jpg" \\<br>
          &nbsp;&nbsp;--user-agent "TileMapper/1.0" \\<br>
          &nbsp;&nbsp;--max-time 30 \\<br>
          &nbsp;&nbsp;--write-out "Status: %{http_code}, Size: %{size_download} bytes\\n"</div>
        </div>
      </div>
    `;
  }

  animate(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const render = () => {
      this.animationId = requestAnimationFrame(render);
      // Minimal animation loop
    };

    render();
  }

  cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    if (this.uiContainer) {
      document.body.removeChild(this.uiContainer);
      this.uiContainer = undefined;
    }

    console.log('🗺️ Tile Mapper Debugger cleaned up');
  }
}

// Create singleton instance
const tileMapperApp = new TileMapperApp();

// Export in the expected format
const TileMapperDebugger = {
  load: async (options: StoryOptions) => {
    return tileMapperApp.load(options);
  },
  dispose: () => {
    return tileMapperApp.dispose();
  },
  getAppInfo: () => {
    return tileMapperApp.getAppInfo();
  },
};

export default TileMapperDebugger;