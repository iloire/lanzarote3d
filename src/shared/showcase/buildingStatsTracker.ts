import { formatPolygonCount } from './polygonCounter';

export interface BuildingStats {
  name: string;
  ultraLowPolygons: number;
  lowPolygons: number;
  mediumPolygons: number;
  highPolygons: number;
}

/**
 * Manages building polygon statistics and UI display
 */
export class BuildingStatsTracker {
  private stats: BuildingStats[] = [];
  private statsOverlay?: HTMLDivElement;
  private toggleButton?: HTMLButtonElement;
  private isVisible: boolean = false;

  constructor() {
    this.createUI();
  }

  private createUI(): void {
    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.innerHTML = '📊 Show Stats<br><span style="font-size: 10px; opacity: 0.8;">(Click to toggle)</span>';
    this.toggleButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      padding: 14px 24px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      z-index: 1001;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      transition: all 0.3s ease;
      line-height: 1.3;
      text-align: center;
    `;
    this.toggleButton.addEventListener('click', () => this.toggle());
    this.toggleButton.addEventListener('mouseenter', () => {
      if (this.toggleButton) {
        this.toggleButton.style.transform = 'scale(1.05)';
        this.toggleButton.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.8)';
        this.toggleButton.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      }
    });
    this.toggleButton.addEventListener('mouseleave', () => {
      if (this.toggleButton) {
        this.toggleButton.style.transform = 'scale(1)';
        this.toggleButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        this.toggleButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }
    });
    document.body.appendChild(this.toggleButton);

    // Create stats overlay - positioned on the right, starts hidden
    this.statsOverlay = document.createElement('div');
    this.statsOverlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 20px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      max-height: 90vh;
      overflow-y: auto;
      min-width: 500px;
      z-index: 1000;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(102, 126, 234, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      display: none;
      opacity: 0;
    `;
    document.body.appendChild(this.statsOverlay);
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;

    if (this.statsOverlay) {
      if (this.isVisible) {
        this.statsOverlay.style.display = 'block';
        this.statsOverlay.style.opacity = '1';
        this.statsOverlay.style.transform = 'translateY(0)';
      } else {
        this.statsOverlay.style.opacity = '0';
        this.statsOverlay.style.transform = 'translateY(20px)';
        setTimeout(() => {
          if (this.statsOverlay) {
            this.statsOverlay.style.display = 'none';
          }
        }, 300);
      }
    }

    if (this.toggleButton) {
      this.toggleButton.innerHTML = this.isVisible
        ? '📊 Hide Stats<br><span style="font-size: 10px; opacity: 0.8;">(Click to toggle)</span>'
        : '📊 Show Stats<br><span style="font-size: 10px; opacity: 0.8;">(Click to toggle)</span>';
    }
  }

  public addBuilding(stats: BuildingStats): void {
    this.stats.push(stats);
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.statsOverlay) return;

    const totalUltraLow = this.stats.reduce((sum, stat) => sum + stat.ultraLowPolygons, 0);
    const totalLow = this.stats.reduce((sum, stat) => sum + stat.lowPolygons, 0);
    const totalMedium = this.stats.reduce((sum, stat) => sum + stat.mediumPolygons, 0);
    const totalHigh = this.stats.reduce((sum, stat) => sum + stat.highPolygons, 0);

    let html = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 3px solid #667eea; padding-bottom: 10px; color: #667eea;">
        🏠 LOD System - Polygon Comparison
      </div>
      <div style="display: grid; grid-template-columns: 160px 90px 90px 90px 90px; gap: 8px; font-weight: bold; color: #667eea; margin-bottom: 10px; font-size: 11px;">
        <div>Building</div>
        <div>ULTRA_LOW</div>
        <div>LOW</div>
        <div>MEDIUM</div>
        <div>HIGH</div>
      </div>
    `;

    this.stats.forEach((stat) => {
      html += `
        <div style="display: grid; grid-template-columns: 160px 90px 90px 90px 90px; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.08);">
          <div style="color: #333; font-weight: 500; font-size: 12px;">${stat.name}</div>
          <div style="color: #9b59b6; font-weight: 600; font-size: 12px;">${formatPolygonCount(stat.ultraLowPolygons)}</div>
          <div style="color: #3498db; font-weight: 600; font-size: 12px;">${formatPolygonCount(stat.lowPolygons)}</div>
          <div style="color: #f39c12; font-weight: 600; font-size: 12px;">${formatPolygonCount(stat.mediumPolygons)}</div>
          <div style="color: #e74c3c; font-weight: 600; font-size: 12px;">${formatPolygonCount(stat.highPolygons)}</div>
        </div>
      `;
    });

    html += `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 3px solid #667eea; font-weight: bold;">
        <div style="display: grid; grid-template-columns: 160px 90px 90px 90px 90px; gap: 8px;">
          <div style="color: #667eea; font-size: 14px;">TOTAL</div>
          <div style="color: #9b59b6; font-size: 14px;">${formatPolygonCount(totalUltraLow)}</div>
          <div style="color: #3498db; font-size: 14px;">${formatPolygonCount(totalLow)}</div>
          <div style="color: #f39c12; font-size: 14px;">${formatPolygonCount(totalMedium)}</div>
          <div style="color: #e74c3c; font-size: 14px;">${formatPolygonCount(totalHigh)}</div>
        </div>
      </div>
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 11px; color: #666; background: rgba(102, 126, 234, 0.08); padding: 10px; border-radius: 5px;">
        💡 <strong style="color: #27ae60;">ULTRA_LOW saves ${Math.round((1 - totalUltraLow/totalHigh) * 100)}%</strong> •
        <strong style="color: #3498db;">LOW saves ${Math.round((1 - totalLow/totalHigh) * 100)}%</strong> •
        <strong style="color: #f39c12;">MEDIUM saves ${Math.round((1 - totalMedium/totalHigh) * 100)}%</strong> vs HIGH
      </div>
    `;

    this.statsOverlay.innerHTML = html;
  }

  public dispose(): void {
    if (this.statsOverlay && this.statsOverlay.parentElement) {
      this.statsOverlay.parentElement.removeChild(this.statsOverlay);
    }
    if (this.toggleButton && this.toggleButton.parentElement) {
      this.toggleButton.parentElement.removeChild(this.toggleButton);
    }
  }
}
