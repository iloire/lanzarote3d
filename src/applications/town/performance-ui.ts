/**
 * Performance UI Controller
 * Manages on-screen performance display and mode toggle controls
 */

export interface PerformanceSettings {
  lowPoly: boolean;
  polygonCount: number;
  lastRenderTime: number;
}

export interface PolygonBreakdown {
  houses: number;
  cacti: number;
  stones: number;
  pools: number;
  roads: number;
  parks: number;
  squares: number;
  other: number;
}

export class PerformanceUI {
  private toggleButton!: HTMLButtonElement;
  private performanceDisplay!: HTMLDivElement;
  private controlsContainer!: HTMLDivElement;
  private onToggleCallback?: () => Promise<void>;

  constructor(private settings: PerformanceSettings, private neighborhoodCount: () => number) {}

  /**
   * Initialize and render the on-screen controls
   */
  public initialize(onToggle?: () => Promise<void>): void {
    this.onToggleCallback = onToggle;
    this.createControlsContainer();
    this.createToggleButton();
    this.createPerformanceDisplay();
    this.assembleControls();
    this.updateDisplay();
    console.log('✅ Performance UI initialized');
  }

  /**
   * Remove controls from DOM
   */
  public dispose(): void {
    if (this.controlsContainer && this.controlsContainer.parentElement) {
      this.controlsContainer.parentElement.removeChild(this.controlsContainer);
    }
  }

  /**
   * Update the display with current performance data
   */
  public updateDisplay(polygonBreakdown?: PolygonBreakdown): void {
    this.updateButtonState();
    this.updatePerformanceInfo(polygonBreakdown);
  }

  /**
   * Set button to loading state
   */
  public setLoading(loading: boolean): void {
    if (loading) {
      this.toggleButton.textContent = '⏳ Rebuilding...';
      this.toggleButton.disabled = true;
    } else {
      this.toggleButton.disabled = false;
      this.updateButtonState();
    }
  }

  private createControlsContainer(): void {
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      font-family: Arial, sans-serif;
      background: rgba(0, 0, 0, 0.8);
      padding: 15px;
      border-radius: 10px;
      color: white;
      min-width: 200px;
      backdrop-filter: blur(5px);
    `;
  }

  private createToggleButton(): void {
    this.toggleButton = document.createElement('button');
    this.toggleButton.style.cssText = `
      width: 100%;
      padding: 10px;
      font-size: 14px;
      font-weight: bold;
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      margin-bottom: 10px;
      transition: all 0.3s ease;
    `;

    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton.style.transform = 'scale(1.05)';
    });

    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton.style.transform = 'scale(1)';
    });

    this.toggleButton.addEventListener('click', async () => {
      if (this.onToggleCallback) {
        await this.onToggleCallback();
      }
    });
  }

  private createPerformanceDisplay(): void {
    this.performanceDisplay = document.createElement('div');
    this.performanceDisplay.style.cssText = `
      font-size: 12px;
      color: #ccc;
      line-height: 1.4;
    `;
  }

  private assembleControls(): void {
    this.controlsContainer.appendChild(this.toggleButton);
    this.controlsContainer.appendChild(this.performanceDisplay);
    document.body.appendChild(this.controlsContainer);
  }

  private updateButtonState(): void {
    if (this.settings.lowPoly) {
      this.toggleButton.textContent = '⚡ Low-Poly Mode';
      this.toggleButton.style.background = 'linear-gradient(45deg, #FF9800, #F57C00)';
    } else {
      this.toggleButton.textContent = '🏗️ High Detail Mode';
      this.toggleButton.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
    }
  }

  private updatePerformanceInfo(polygonBreakdown?: PolygonBreakdown): void {
    let polygonInfo = '';

    if (polygonBreakdown) {
      const totalPolygons = Object.values(polygonBreakdown).reduce((sum, count) => sum + (count || 0), 0);

      // Calculate percentages (handle division by zero)
      const calculatePercentage = (value: number) => {
        if (totalPolygons === 0) return '0.0';
        return ((value / totalPolygons) * 100).toFixed(1);
      };

      const percentages = {
        houses: calculatePercentage(polygonBreakdown.houses || 0),
        cacti: calculatePercentage(polygonBreakdown.cacti || 0),
        stones: calculatePercentage(polygonBreakdown.stones || 0),
        pools: calculatePercentage(polygonBreakdown.pools || 0),
        roads: calculatePercentage(polygonBreakdown.roads || 0),
        parks: calculatePercentage(polygonBreakdown.parks || 0),
        squares: calculatePercentage(polygonBreakdown.squares || 0),
        other: calculatePercentage(polygonBreakdown.other || 0)
      };

      polygonInfo = `
        <div><strong>Total Polygons:</strong> ${Math.floor(totalPolygons).toLocaleString()}</div>
        <div style="margin-top: 8px; font-size: 11px; color: #ddd; border-top: 1px solid #333; padding-top: 6px;">
          <div style="margin-bottom: 3px; font-weight: bold;">📊 Breakdown:</div>
          <div>🏠 Houses: ${Math.floor(polygonBreakdown.houses || 0).toLocaleString()} (${percentages.houses}%)</div>
          <div>🌵 Cacti: ${Math.floor(polygonBreakdown.cacti || 0).toLocaleString()} (${percentages.cacti}%)</div>
          <div>🪨 Stones: ${Math.floor(polygonBreakdown.stones || 0).toLocaleString()} (${percentages.stones}%)</div>
          <div>🏊 Pools: ${Math.floor(polygonBreakdown.pools || 0).toLocaleString()} (${percentages.pools}%)</div>
          <div>🛣️ Roads: ${Math.floor(polygonBreakdown.roads || 0).toLocaleString()} (${percentages.roads}%)</div>
          <div>🌳 Parks: ${Math.floor(polygonBreakdown.parks || 0).toLocaleString()} (${percentages.parks}%)</div>
          <div>🏛️ Squares: ${Math.floor(polygonBreakdown.squares || 0).toLocaleString()} (${percentages.squares}%)</div>
          <div>❓ Other: ${Math.floor(polygonBreakdown.other || 0).toLocaleString()} (${percentages.other}%)</div>
        </div>
      `;
    } else {
      const polygonText = this.settings.polygonCount > 0
        ? this.settings.polygonCount.toLocaleString()
        : 'Calculating...';
      polygonInfo = `<div><strong>Polygons:</strong> ${polygonText}</div>`;
    }

    this.performanceDisplay.innerHTML = `
      <div style="background: rgba(0,0,0,0.9); color: white; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; line-height: 1.4; min-width: 240px;">
        <div><strong>Mode:</strong> ${this.settings.lowPoly ? 'Performance' : 'Quality'}</div>
        ${polygonInfo}
        <div><strong>Neighborhoods:</strong> ${this.neighborhoodCount() > 0 ? '27' : 'Loading...'}</div>
        <div style="margin-top: 6px; font-size: 10px; color: #aaa;">Click button to toggle modes</div>
      </div>
    `;
  }
}