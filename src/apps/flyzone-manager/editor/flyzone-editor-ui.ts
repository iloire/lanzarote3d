import { EditorState, EditorMode } from './flyzone-editor';

/**
 * FlyzoneEditorUI - User interface for flyzone editor
 *
 * Provides:
 * - Mode selection toolbar
 * - Location property editor
 * - Wind condition configuration
 * - Media management interface
 * - Save/Load controls
 */
export class FlyzoneEditorUI {
  private container: HTMLElement | undefined;
  private editorState: EditorState;
  private onAction: (action: string, data?: any) => void;

  constructor(editorState: EditorState, onAction: (action: string, data?: any) => void) {
    this.editorState = editorState;
    this.onAction = onAction;
    this.createUI();
  }

  private createUI(): void {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'flyzone-editor-ui';
    this.container.innerHTML = this.getUIHTML();

    // Add to DOM
    document.body.appendChild(this.container);

    // Setup event listeners
    this.setupEventListeners();
  }

  private getUIHTML(): string {
    return `
      <div class="editor-toolbar">
        <div class="mode-selector">
          <button class="mode-btn ${this.editorState.mode.type === 'select' ? 'active' : ''}" data-mode="select">
            <span class="icon">👆</span>
            Select
          </button>
          <button class="mode-btn ${this.editorState.mode.type === 'takeoff' ? 'active' : ''}" data-mode="takeoff">
            <span class="icon">🚀</span>
            Takeoff
          </button>
          <button class="mode-btn ${this.editorState.mode.type === 'landing' ? 'active' : ''}" data-mode="landing">
            <span class="icon">🎯</span>
            Landing
          </button>
          <button class="mode-btn ${this.editorState.mode.type === 'flyzone' ? 'active' : ''}" data-mode="flyzone">
            <span class="icon">🌀</span>
            Flyzone
          </button>
        </div>

        <div class="action-buttons">
          <button class="action-btn" data-action="save">
            <span class="icon">💾</span>
            Save
          </button>
          <button class="action-btn" data-action="load">
            <span class="icon">📂</span>
            Load
          </button>
          <button class="action-btn" data-action="clear">
            <span class="icon">🗑️</span>
            Clear
          </button>
        </div>
      </div>

      <div class="editor-panel">
        <div class="panel-section">
          <h3>Current Location</h3>
          <div class="location-info">
            ${this.getLocationInfoHTML()}
          </div>
        </div>

        <div class="panel-section">
          <h3>Mode Settings</h3>
          <div class="mode-settings">
            ${this.getModeSettingsHTML()}
          </div>
        </div>

        <div class="panel-section">
          <h3>Coordinates</h3>
          <div class="coordinates-display">
            <div class="coord-item">
              <label>Latitude:</label>
              <span id="coord-lat">-</span>
            </div>
            <div class="coord-item">
              <label>Longitude:</label>
              <span id="coord-lon">-</span>
            </div>
            <div class="coord-item">
              <label>Altitude:</label>
              <span id="coord-alt">-</span>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>Statistics</h3>
          <div class="stats-display">
            <div class="stat-item">
              <label>Takeoffs:</label>
              <span id="stat-takeoffs">${this.editorState.currentLocation?.takeoffs.length || 0}</span>
            </div>
            <div class="stat-item">
              <label>Landings:</label>
              <span id="stat-landings">${this.editorState.currentLocation?.landingZones.length || 0}</span>
            </div>
            <div class="stat-item">
              <label>Flight Phases:</label>
              <span id="stat-phases">${this.getFlightPhaseCount()}</span>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h3>Instructions</h3>
          <div class="instructions">
            ${this.getInstructionsHTML()}
          </div>
        </div>
      </div>
    `;
  }

  private getLocationInfoHTML(): string {
    if (!this.editorState.currentLocation) {
      return '<p class="no-location">No location selected. Create takeoffs, landings, or flyzone areas to start.</p>';
    }

    const location = this.editorState.currentLocation;
    return `
      <div class="location-details">
        <div class="field">
          <label>Title:</label>
          <input type="text" id="location-title" value="${location.title}" />
        </div>
        <div class="field">
          <label>Description:</label>
          <textarea id="location-description">${location.description}</textarea>
        </div>
        <div class="field">
          <label>Region:</label>
          <input type="text" id="location-region" value="${location.region}" />
        </div>
        <div class="field">
          <label>Status:</label>
          <span class="status ${location.verified ? 'verified' : 'unverified'}">
            ${location.verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
        ${this.editorState.isDirty ? '<div class="dirty-indicator">● Unsaved changes</div>' : ''}
      </div>
    `;
  }

  private getModeSettingsHTML(): string {
    switch (this.editorState.mode.type) {
      case 'flyzone':
        return `
          <div class="flyzone-settings">
            <label>Phase Type:</label>
            <select id="phase-type" value="${this.editorState.mode.subtype || 'ridge'}">
              <option value="ridge">Ridge Soaring</option>
              <option value="thermal">Thermal</option>
              <option value="approach">Approach</option>
            </select>
          </div>
        `;
      case 'takeoff':
        return `
          <div class="takeoff-settings">
            <p>Click on terrain to place takeoff location</p>
            <label>Default Wind Direction:</label>
            <input type="number" id="default-wind-dir" min="0" max="360" value="0" />°
          </div>
        `;
      case 'landing':
        return `
          <div class="landing-settings">
            <p>Click on terrain to place landing zone</p>
            <label>Landing Type:</label>
            <select id="landing-type">
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        `;
      default:
        return '<p>Select a mode to configure settings</p>';
    }
  }

  private getInstructionsHTML(): string {
    switch (this.editorState.mode.type) {
      case 'select':
        return `
          <ul>
            <li>Click on markers to select and edit them</li>
            <li>Use mode buttons to switch tools</li>
            <li>Ctrl+T for takeoff mode</li>
            <li>Ctrl+L for landing mode</li>
            <li>Ctrl+S to save</li>
          </ul>
        `;
      case 'takeoff':
        return `
          <ul>
            <li>Click on terrain to place takeoff location</li>
            <li>Choose elevated positions with good wind exposure</li>
            <li>Consider safety and accessibility</li>
            <li>Press Escape to return to select mode</li>
          </ul>
        `;
      case 'landing':
        return `
          <ul>
            <li>Click on terrain to place landing zone</li>
            <li>Choose flat, open areas</li>
            <li>Avoid obstacles and hazards</li>
            <li>Consider wind conditions and approach</li>
          </ul>
        `;
      case 'flyzone':
        return `
          <ul>
            <li>Click to define flight areas</li>
            <li>Ridge: Along ridgelines for soaring</li>
            <li>Thermal: Circular areas for lift</li>
            <li>Approach: Final approach zones</li>
          </ul>
        `;
      default:
        return '<p>Select a mode to see instructions</p>';
    }
  }

  private getFlightPhaseCount(): number {
    if (!this.editorState.currentLocation) return 0;
    return Object.keys(this.editorState.currentLocation.flyzone.phases).length;
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Mode buttons
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode as any;
        this.onAction('modeChange', { type: mode });
        this.refresh();
      });
    });

    // Action buttons
    this.container.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        this.onAction(action || '');
      });
    });

    // Phase type selector
    const phaseTypeSelect = this.container.querySelector('#phase-type') as HTMLSelectElement;
    if (phaseTypeSelect) {
      phaseTypeSelect.addEventListener('change', (e) => {
        const subtype = (e.target as HTMLSelectElement).value;
        this.onAction('modeChange', { ...this.editorState.mode, subtype });
      });
    }

    // Location property inputs
    const titleInput = this.container.querySelector('#location-title') as HTMLInputElement;
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        if (this.editorState.currentLocation) {
          this.editorState.currentLocation.title = (e.target as HTMLInputElement).value;
          this.onAction('locationChanged');
        }
      });
    }

    const descriptionInput = this.container.querySelector('#location-description') as HTMLTextAreaElement;
    if (descriptionInput) {
      descriptionInput.addEventListener('input', (e) => {
        if (this.editorState.currentLocation) {
          this.editorState.currentLocation.description = (e.target as HTMLTextAreaElement).value;
          this.onAction('locationChanged');
        }
      });
    }

    const regionInput = this.container.querySelector('#location-region') as HTMLInputElement;
    if (regionInput) {
      regionInput.addEventListener('input', (e) => {
        if (this.editorState.currentLocation) {
          this.editorState.currentLocation.region = (e.target as HTMLInputElement).value;
          this.onAction('locationChanged');
        }
      });
    }
  }

  public refresh(): void {
    if (!this.container) return;

    // Update the entire UI
    this.container.innerHTML = this.getUIHTML();
    this.setupEventListeners();
  }

  public update(): void {
    // Update dynamic elements without full refresh
    this.updateCoordinateDisplay();
    this.updateStatistics();
    this.updateModeButtons();
  }

  private updateCoordinateDisplay(): void {
    // This would be called with mouse position to show real-time coordinates
    // Implementation depends on mouse tracking from the main editor
  }

  private updateStatistics(): void {
    const takeoffsEl = document.getElementById('stat-takeoffs');
    const landingsEl = document.getElementById('stat-landings');
    const phasesEl = document.getElementById('stat-phases');

    if (takeoffsEl) {
      takeoffsEl.textContent = (this.editorState.currentLocation?.takeoffs.length || 0).toString();
    }
    if (landingsEl) {
      landingsEl.textContent = (this.editorState.currentLocation?.landingZones.length || 0).toString();
    }
    if (phasesEl) {
      phasesEl.textContent = this.getFlightPhaseCount().toString();
    }
  }

  private updateModeButtons(): void {
    if (!this.container) return;

    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      const mode = (btn as HTMLElement).dataset.mode;
      if (mode === this.editorState.mode.type) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  public updateCoordinates(lat: number, lon: number, alt: number): void {
    const latEl = document.getElementById('coord-lat');
    const lonEl = document.getElementById('coord-lon');
    const altEl = document.getElementById('coord-alt');

    if (latEl) latEl.textContent = lat.toFixed(6);
    if (lonEl) lonEl.textContent = lon.toFixed(6);
    if (altEl) altEl.textContent = `${alt.toFixed(1)}m`;
  }

  public dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = undefined;
  }
}