import { VisualizerState } from './flyzone-visualizer';
import { TakeoffRecommendation } from '../types/flyzone-types';

/**
 * FlyzoneVisualizerUI - User interface for weather-based takeoff recommendations
 *
 * Provides:
 * - Weather condition input controls
 * - Ranked takeoff recommendations list
 * - Selected takeoff detailed analysis
 * - Safety warnings and advice
 * - Pilot skill level selection
 */
export class FlyzoneVisualizerUI {
  private container: HTMLElement | undefined;
  private visualizerState: VisualizerState;
  private onAction: (action: string, data?: any) => void;

  constructor(visualizerState: VisualizerState, onAction: (action: string, data?: any) => void) {
    this.visualizerState = visualizerState;
    this.onAction = onAction;
    this.createUI();
  }

  private createUI(): void {
    this.container = document.createElement('div');
    this.container.className = 'flyzone-visualizer-ui';
    this.container.innerHTML = this.getUIHTML();

    document.body.appendChild(this.container);
    this.setupEventListeners();
  }

  private getUIHTML(): string {
    return `
      <div class="visualizer-toolbar">
        <div class="weather-input">
          <h3>🌬️ Current Weather</h3>
          <div class="weather-controls">
            <div class="input-group">
              <label>Wind Direction</label>
              <input type="number" id="wind-direction" min="0" max="360" value="45" />
              <span>°</span>
            </div>
            <div class="input-group">
              <label>Wind Speed</label>
              <input type="number" id="wind-speed" min="0" max="50" value="20" />
              <span>km/h</span>
            </div>
            <button id="analyze-btn" class="analyze-btn">Analyze</button>
          </div>
        </div>

        <div class="pilot-settings">
          <h3>👨‍✈️ Pilot Level</h3>
          <div class="level-selector">
            <button class="level-btn ${this.visualizerState.userLevel === 'beginner' ? 'active' : ''}" data-level="beginner">
              Beginner
            </button>
            <button class="level-btn ${this.visualizerState.userLevel === 'intermediate' ? 'active' : ''}" data-level="intermediate">
              Intermediate
            </button>
            <button class="level-btn ${this.visualizerState.userLevel === 'advanced' ? 'active' : ''}" data-level="advanced">
              Advanced
            </button>
            <button class="level-btn ${this.visualizerState.userLevel === 'expert' ? 'active' : ''}" data-level="expert">
              Expert
            </button>
          </div>
        </div>
      </div>

      <div class="visualizer-panel">
        ${this.getWeatherStatusHTML()}
        ${this.getRecommendationsHTML()}
        ${this.getSelectedDetailsHTML()}
        ${this.getAdviceHTML()}
      </div>
    `;
  }

  private getWeatherStatusHTML(): string {
    if (!this.visualizerState.currentWeather) {
      return `
        <div class="panel-section weather-status">
          <h3>Weather Analysis</h3>
          <p class="no-data">Enter wind conditions and click "Analyze" to get takeoff recommendations</p>
        </div>
      `;
    }

    const weather = this.visualizerState.currentWeather;
    return `
      <div class="panel-section weather-status">
        <h3>Current Conditions</h3>
        <div class="weather-summary">
          <div class="weather-item">
            <span class="label">Wind Direction:</span>
            <span class="value">${weather.windDirection}°</span>
            <span class="compass">${this.getCompassDirection(weather.windDirection)}</span>
          </div>
          <div class="weather-item">
            <span class="label">Wind Speed:</span>
            <span class="value">${weather.windSpeed} km/h</span>
            <span class="category">${this.getWindCategory(weather.windSpeed)}</span>
          </div>
          <div class="weather-item">
            <span class="label">Analysis Time:</span>
            <span class="value">${new Date(weather.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    `;
  }

  private getRecommendationsHTML(): string {
    if (!this.visualizerState.weatherAnalysis) {
      return '';
    }

    const recommendations = this.visualizerState.weatherAnalysis.recommendations
      .filter(rec => rec.score >= this.visualizerState.filterByScore)
      .slice(0, 10); // Show top 10

    if (recommendations.length === 0) {
      return `
        <div class="panel-section recommendations">
          <h3>Takeoff Recommendations</h3>
          <p class="no-recommendations">No suitable takeoffs found for current conditions.</p>
          <p class="suggestion">Try adjusting the minimum score filter or check different wind conditions.</p>
        </div>
      `;
    }

    const recommendationsHTML = recommendations
      .map(
        (rec, index) => `
      <div class="recommendation-item ${rec === this.visualizerState.selectedRecommendation ? 'selected' : ''}"
           data-recommendation-index="${index}">
        <div class="recommendation-header">
          <h4>${rec.takeoff.title}</h4>
          <div class="score score-${this.getScoreClass(rec.score)}">${rec.score}</div>
        </div>
        <div class="recommendation-details">
          <div class="location-info">
            <span class="region">${rec.takeoff.description}</span>
            <span class="elevation">${rec.takeoff.elevation}m</span>
          </div>
          <div class="wind-match">
            <span class="direction-score">Dir: ${rec.windMatch.directionScore.toFixed(0)}</span>
            <span class="speed-score">Speed: ${rec.windMatch.speedScore.toFixed(0)}</span>
          </div>
        </div>
        ${
          rec.warnings.length > 0
            ? `
          <div class="warnings">
            ${rec.warnings.map(warning => `<span class="warning">⚠️ ${warning}</span>`).join('')}
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');

    return `
      <div class="panel-section recommendations">
        <div class="recommendations-header">
          <h3>Takeoff Recommendations</h3>
          <div class="filter-controls">
            <label>Min Score:</label>
            <input type="range" id="score-filter" min="0" max="100" step="5"
                   value="${this.visualizerState.filterByScore}" />
            <span id="score-value">${this.visualizerState.filterByScore}</span>
          </div>
        </div>
        <div class="recommendations-list">
          ${recommendationsHTML}
        </div>
        <div class="recommendations-legend">
          <div class="legend-item">
            <div class="score score-excellent"></div>
            <span>Excellent (80+)</span>
          </div>
          <div class="legend-item">
            <div class="score score-good"></div>
            <span>Good (60-79)</span>
          </div>
          <div class="legend-item">
            <div class="score score-marginal"></div>
            <span>Marginal (40-59)</span>
          </div>
          <div class="legend-item">
            <div class="score score-poor"></div>
            <span>Poor (0-39)</span>
          </div>
        </div>
      </div>
    `;
  }

  private getSelectedDetailsHTML(): string {
    if (!this.visualizerState.selectedRecommendation) {
      return '';
    }

    const rec = this.visualizerState.selectedRecommendation;
    const takeoff = rec.takeoff;

    return `
      <div class="panel-section selected-details">
        <h3>📍 ${takeoff.title}</h3>
        <div class="details-content">
          <div class="takeoff-info">
            <div class="info-row">
              <span class="label">Description:</span>
              <span class="value">${takeoff.description}</span>
            </div>
            <div class="info-row">
              <span class="label">Elevation:</span>
              <span class="value">${takeoff.elevation}m</span>
            </div>
            <div class="info-row">
              <span class="label">Difficulty:</span>
              <span class="value difficulty-${takeoff.safety.difficulty}">${takeoff.safety.difficulty}</span>
            </div>
            <div class="info-row">
              <span class="label">Access:</span>
              <span class="value">${takeoff.access.difficulty} (${takeoff.access.walkingTime} min walk)</span>
            </div>
          </div>

          <div class="wind-analysis">
            <h4>Wind Analysis</h4>
            <div class="analysis-scores">
              <div class="score-item">
                <span class="label">Direction Match:</span>
                <div class="score-bar">
                  <div class="score-fill" style="width: ${rec.windMatch.directionScore}%"></div>
                  <span class="score-text">${rec.windMatch.directionScore.toFixed(0)}%</span>
                </div>
              </div>
              <div class="score-item">
                <span class="label">Speed Match:</span>
                <div class="score-bar">
                  <div class="score-fill" style="width: ${rec.windMatch.speedScore}%"></div>
                  <span class="score-text">${rec.windMatch.speedScore.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="reasoning">
            <h4>Analysis</h4>
            <ul>
              ${rec.reasoning.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
          </div>

          ${
            takeoff.safety.hazards.length > 0
              ? `
            <div class="hazards">
              <h4>⚠️ Site Hazards</h4>
              <ul>
                ${takeoff.safety.hazards.map(hazard => `<li>${hazard}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  private getAdviceHTML(): string {
    if (!this.visualizerState.weatherAnalysis) {
      return '';
    }

    const analysis = this.visualizerState.weatherAnalysis;

    return `
      <div class="panel-section advice">
        ${
          analysis.safetyWarnings.length > 0
            ? `
          <div class="safety-warnings">
            <h4>🚨 Safety Warnings</h4>
            <ul>
              ${analysis.safetyWarnings.map(warning => `<li class="warning">${warning}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }

        <div class="general-advice">
          <h4>💡 General Advice</h4>
          <ul>
            ${analysis.generalAdvice.map(advice => `<li>${advice}</li>`).join('')}
          </ul>
        </div>

        <div class="instructions">
          <h4>🎯 How to Use</h4>
          <ul>
            <li>Click on green markers in the 3D view for best takeoffs</li>
            <li>Yellow markers indicate good conditions</li>
            <li>Orange markers are marginal - proceed with caution</li>
            <li>Red markers indicate poor conditions</li>
            <li>Use keyboard shortcuts: 1-4 for pilot levels, Ctrl+W for wind visualization</li>
          </ul>
        </div>
      </div>
    `;
  }

  private getCompassDirection(degrees: number): string {
    const directions = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  private getWindCategory(speed: number): string {
    if (speed < 8) return 'Light';
    if (speed < 15) return 'Moderate';
    if (speed < 25) return 'Fresh';
    if (speed < 35) return 'Strong';
    return 'Very Strong';
  }

  private getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'marginal';
    return 'poor';
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Analyze button
    const analyzeBtn = this.container.querySelector('#analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        const windDir = parseInt(
          (this.container!.querySelector('#wind-direction') as HTMLInputElement).value
        );
        const windSpeed = parseInt(
          (this.container!.querySelector('#wind-speed') as HTMLInputElement).value
        );
        this.onAction('analyzeWeather', { windDirection: windDir, windSpeed: windSpeed });
      });
    }

    // Pilot level buttons
    this.container.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const level = (e.currentTarget as HTMLElement).dataset.level;
        this.onAction('userLevelChange', { level });
        this.refresh();
      });
    });

    // Recommendation items
    this.container.querySelectorAll('.recommendation-item').forEach(item => {
      item.addEventListener('click', e => {
        const index = parseInt((e.currentTarget as HTMLElement).dataset.recommendationIndex || '0');
        if (this.visualizerState.weatherAnalysis) {
          const recommendation = this.visualizerState.weatherAnalysis.recommendations[index];
          this.onAction('selectRecommendation', { recommendation });
        }
      });
    });

    // Score filter
    const scoreFilter = this.container.querySelector('#score-filter') as HTMLInputElement;
    const scoreValue = this.container.querySelector('#score-value');
    if (scoreFilter && scoreValue) {
      scoreFilter.addEventListener('input', e => {
        const value = parseInt((e.target as HTMLInputElement).value);
        scoreValue.textContent = value.toString();
        this.onAction('filterChange', { minScore: value });
      });
    }

    // Enter key for weather inputs
    const windDirInput = this.container.querySelector('#wind-direction') as HTMLInputElement;
    const windSpeedInput = this.container.querySelector('#wind-speed') as HTMLInputElement;

    [windDirInput, windSpeedInput].forEach(input => {
      if (input) {
        input.addEventListener('keypress', e => {
          if (e.key === 'Enter') {
            analyzeBtn?.dispatchEvent(new Event('click'));
          }
        });
      }
    });
  }

  public refresh(): void {
    if (!this.container) return;

    this.container.innerHTML = this.getUIHTML();
    this.setupEventListeners();
  }

  public update(): void {
    // Update dynamic elements without full refresh
    this.updateRecommendationSelection();
  }

  private updateRecommendationSelection(): void {
    if (!this.container) return;

    // Update selected recommendation highlighting
    this.container.querySelectorAll('.recommendation-item').forEach(item => {
      item.classList.remove('selected');
    });

    if (this.visualizerState.selectedRecommendation && this.visualizerState.weatherAnalysis) {
      const index = this.visualizerState.weatherAnalysis.recommendations.findIndex(
        rec => rec === this.visualizerState.selectedRecommendation
      );
      if (index >= 0) {
        const selectedItem = this.container.querySelector(`[data-recommendation-index="${index}"]`);
        if (selectedItem) {
          selectedItem.classList.add('selected');
        }
      }
    }
  }

  public dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = undefined;
  }
}
