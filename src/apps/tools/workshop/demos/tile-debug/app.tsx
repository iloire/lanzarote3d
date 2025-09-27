import { NonRenderingAppBase } from '../../../../shared/NonRenderingAppBase';
import { StoryOptions } from '../../../../shared/types';
import { getAppConfig } from '../../../../config/app-registry';

/**
 * Tile Debug Dashboard - Interactive debug tool for satellite tile system
 *
 * Features:
 * - Visual tile grid showing 4×7 layout
 * - Interactive tile selection with detailed information
 * - Geographic bounds and tile coordinate calculations
 * - Download process documentation
 * - UV mapping visualization
 */
class TileDebugApp extends NonRenderingAppBase {
  private animationId: number | undefined;
  private uiContainer: HTMLElement | undefined;

  constructor() {
    const appConfig = getAppConfig('tile-debug');
    super({
      name: appConfig?.name || 'Tile Debug Dashboard',
      description: appConfig?.description || 'Debug tool for satellite tile download system',
      requiresThreeJS: false, // Pure HTML/DOM app
    });
  }

  async load(_options: StoryOptions): Promise<void> {
    // For non-rendering apps, we don't need Three.js components
    this.createDebugUI();
    this.isLoaded = true;
    console.log('🔧 Tile Debug Dashboard initialized');
  }


  private createDebugUI(): void {
    // Use the base class method to create container (already positioned properly for menu)
    this.uiContainer = this.createUIContainer();
    // Apply light theme styling for tile debug dashboard
    this.uiContainer.style.background = 'rgba(248, 250, 252, 0.95)';
    this.uiContainer.style.color = '#1f2937';
    this.uiContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.uiContainer.style.border = '1px solid #e2e8f0';

    // Add the React component content
    this.uiContainer.innerHTML = `
      <div style="padding: 24px; max-width: 1200px; margin: 0 auto;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">
            🔧 Satellite Tile Debug Dashboard
          </h1>
          <p style="color: #666; margin-bottom: 16px;">
            Visualizing tile download process, calculations, and atlas creation
          </p>
          <div style="background: #e0f2fe; border: 1px solid #0891b2; padding: 12px; border-radius: 8px;">
            <strong>📍 Access Interactive Dashboard:</strong>
            <a href="/tile-debug.html" target="_blank" style="color: #0891b2; text-decoration: underline;">
              Open Full Interactive Dashboard
            </a>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">

          <!-- Overview Card -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: white;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">
              🌍 Tile System Overview
            </h3>
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
              <div><strong>Coverage:</strong> Complete Lanzarote island</div>
              <div><strong>Grid Size:</strong> 7×8 tiles (56 total)</div>
              <div><strong>Zoom Level:</strong> 12 (~10m resolution)</div>
              <div><strong>Source:</strong> Esri World Imagery</div>
              <div><strong>Format:</strong> JPEG atlas</div>
              <div><strong>Status:</strong> <span style="color: #059669;">✅ Complete</span></div>
            </div>
          </div>

          <!-- Coordinates Card -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: white;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">
              📐 Geographic Bounds
            </h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-family: monospace; font-size: 13px;">
              <div>North: 29.250°</div>
              <div>South: 28.606°</div>
              <div>East: -13.359°</div>
              <div>West: -13.975°</div>
            </div>
            <div style="margin-top: 16px; font-size: 14px;">
              <strong>Tile Range:</strong><br>
              <span style="font-family: monospace;">X: 1891→1897, Y: 1699→1706</span>
            </div>
          </div>

          <!-- Process Card -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: white;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">
              ⚙️ Generation Process
            </h3>
            <div style="font-size: 14px; display: flex; flex-direction: column; gap: 8px;">
              <div>1. Calculate Web Mercator tile coordinates</div>
              <div>2. Download 56 tiles from Esri servers</div>
              <div>3. Create 7×8 atlas with ImageMagick</div>
              <div>4. Generate UV mapping configuration</div>
              <div>5. Update satellite texture system</div>
            </div>
          </div>

          <!-- Files Card -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: white;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">
              📁 Generated Files
            </h3>
            <div style="font-size: 13px; font-family: monospace; display: flex; flex-direction: column; gap: 6px;">
              <div>📄 lanzarote-satellite-atlas-optimized.jpg</div>
              <div>📄 lanzarote-tile-mapping-optimized.json</div>
              <div>📁 temp_tiles/ (56 individual tiles)</div>
              <div>📄 TILE_DOWNLOAD_DOCUMENTATION.md</div>
            </div>
          </div>

        </div>

        <!-- Documentation Section -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: white; margin-top: 24px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">
            📚 Documentation & Resources
          </h3>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">

            <div>
              <h4 style="font-weight: 600; margin-bottom: 8px; color: #4338ca;">🔗 Interactive Tools</h4>
              <div style="font-size: 14px; display: flex; flex-direction: column; gap: 6px;">
                <a href="/tile-debug.html" target="_blank" style="color: #4338ca;">Interactive Tile Grid Viewer</a>
                <a href="/?story=terrain-gps" style="color: #4338ca;">GPS Coordinate Mapper</a>
                <a href="/?story=satellite-terrain" style="color: #4338ca;">Satellite Terrain Demo</a>
              </div>
            </div>

            <div>
              <h4 style="font-weight: 600; margin-bottom: 8px; color: #059669;">📖 Technical Specs</h4>
              <div style="font-size: 14px; display: flex; flex-direction: column; gap: 6px;">
                <div>Web Mercator Projection (EPSG:3857)</div>
                <div>256×256px tiles, Zoom level 12</div>
                <div>7×8 grid = 1792×2048px atlas</div>
                <div>UV mapping: U(0→1), V(0→1)</div>
              </div>
            </div>

            <div>
              <h4 style="font-weight: 600; margin-bottom: 8px; color: #dc2626;">⚡ Quick Actions</h4>
              <div style="font-size: 14px; display: flex; flex-direction: column; gap: 6px;">
                <button onclick="window.open('/tile-debug.html')" style="background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                  Open Debug Dashboard
                </button>
                <button onclick="navigator.clipboard.writeText('29.306,-13.975 28.691,-13.359')" style="background: #059669; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                  Copy GPS Bounds
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Command Reference -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: white; margin-top: 24px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">
            💻 Command Reference
          </h3>

          <div style="background: #1f2937; color: #f3f4f6; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto;">
            <div style="color: #34d399; margin-bottom: 8px;"># Download tiles</div>
            <div>for x in {1891..1897}; do for y in {1699..1706}; do curl "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/\${y}/\${x}" -o "tile_\${x}_\${y}.jpg"; done; done</div>
            <br>
            <div style="color: #34d399; margin-bottom: 8px;"># Create atlas</div>
            <div>magick montage temp_tiles/*.jpg -tile 7x8 -geometry +0+0 lanzarote-satellite-atlas-optimized.jpg</div>
            <br>
            <div style="color: #34d399; margin-bottom: 8px;"># Access URLs</div>
            <div>http://localhost:8080/tile-debug.html  # Interactive dashboard</div>
            <div>http://localhost:8080/?story=tile-debug  # This overview page</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.uiContainer);
  }

  animate(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const render = () => {
      this.animationId = requestAnimationFrame(render);
      // Minimal animation loop - just keep the Three.js context alive
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

    console.log('🔧 Tile Debug Dashboard cleaned up');
  }
}

// Create singleton instance
const tileDebugApp = new TileDebugApp();

// Export in the expected format for the Workshop system
const TileDebugDashboard = {
  load: async (options: StoryOptions) => {
    return tileDebugApp.load(options);
  },
  dispose: () => {
    return tileDebugApp.dispose();
  },
  getAppInfo: () => {
    return tileDebugApp.getAppInfo();
  },
};

export default TileDebugDashboard;