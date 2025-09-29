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
          <button class="action-btn" data-action="export-json">
            <span class="icon">📤</span>
            Export JSON
          </button>
          <button class="action-btn" data-action="import-json">
            <span class="icon">📥</span>
            Import JSON
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

        ${this.getSelectedItemHTML()}

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

  private getSelectedItemHTML(): string {
    if (!this.editorState.selectedItem) {
      return '';
    }

    const item = this.editorState.selectedItem;
    const data = item.data;

    return `
      <div class="panel-section selected-item">
        <div class="selected-header">
          <h3>✏️ Selected ${item.type}</h3>
          <button class="delete-btn" data-action="delete-selected">🗑️</button>
        </div>

        <div class="selected-content">
          <div class="field-group">
            <label>Title:</label>
            <input type="text" id="selected-title" value="${data.title || ''}"
                   placeholder="Enter ${item.type} title" />
          </div>

          <div class="field-group">
            <label>Description:</label>
            <textarea id="selected-description" rows="3"
                     placeholder="Describe this ${item.type}">${data.description || ''}</textarea>
          </div>

          ${this.getItemSpecificFields(item)}

          <div class="coordinates-info">
            <h4>📍 Location</h4>
            <div class="coord-display">
              <span>GPS: ${data.gps?.latitude.toFixed(6) || 'N/A'}, ${data.gps?.longitude.toFixed(6) || 'N/A'}</span>
              <span>Elevation: ${data.elevation || data.position?.y || 'N/A'}m</span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="save-btn" data-action="save-selected">💾 Save Changes</button>
            <button class="cancel-btn" data-action="deselect">❌ Deselect</button>
            <button class="focus-btn" data-action="focus-selected">🎯 Focus Camera</button>
          </div>
        </div>
      </div>
    `;
  }

  private getItemSpecificFields(item: any): string {
    const data = item.data;

    switch (item.type) {
      case 'takeoff':
        return `
          <div class="field-group">
            <label>Difficulty:</label>
            <select id="selected-difficulty">
              <option value="beginner" ${data.safety?.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
              <option value="intermediate" ${data.safety?.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
              <option value="advanced" ${data.safety?.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
              <option value="expert" ${data.safety?.difficulty === 'expert' ? 'selected' : ''}>Expert</option>
            </select>
          </div>

          <div class="field-group">
            <label>Walking Time (minutes):</label>
            <input type="number" id="selected-walking-time" min="0" max="120"
                   value="${data.access?.walkingTime || 10}" />
          </div>

          <div class="field-group">
            <label>Hazards (comma-separated):</label>
            <input type="text" id="selected-hazards"
                   value="${data.safety?.hazards?.join(', ') || ''}"
                   placeholder="power lines, rocks, etc." />
          </div>
        `;

      case 'landing':
        return `
          <div class="field-group">
            <label>Landing Type:</label>
            <select id="selected-landing-type">
              <option value="primary" ${data.type === 'primary' ? 'selected' : ''}>Primary</option>
              <option value="secondary" ${data.type === 'secondary' ? 'selected' : ''}>Secondary</option>
              <option value="emergency" ${data.type === 'emergency' ? 'selected' : ''}>Emergency</option>
            </select>
          </div>

          <div class="field-group">
            <label>Surface Type:</label>
            <select id="selected-surface">
              <option value="grass" ${data.surface === 'grass' ? 'selected' : ''}>Grass</option>
              <option value="sand" ${data.surface === 'sand' ? 'selected' : ''}>Sand</option>
              <option value="gravel" ${data.surface === 'gravel' ? 'selected' : ''}>Gravel</option>
              <option value="paved" ${data.surface === 'paved' ? 'selected' : ''}>Paved</option>
              <option value="mixed" ${data.surface === 'mixed' ? 'selected' : ''}>Mixed</option>
            </select>
          </div>

          <div class="field-group">
            <label>Size (W×L meters):</label>
            <div class="size-inputs">
              <input type="number" id="selected-width" value="${data.size?.width || 100}" min="10" max="1000" />
              <span>×</span>
              <input type="number" id="selected-length" value="${data.size?.length || 150}" min="10" max="1000" />
            </div>
          </div>
        `;

      case 'phase':
        return `
          <div class="field-group">
            <label>Phase Type:</label>
            <select id="selected-phase-type">
              <option value="takeoff" ${data.type === 'takeoff' ? 'selected' : ''}>Takeoff</option>
              <option value="ridge" ${data.type === 'ridge' ? 'selected' : ''}>Ridge Soaring</option>
              <option value="thermal" ${data.type === 'thermal' ? 'selected' : ''}>Thermal</option>
              <option value="approach" ${data.type === 'approach' ? 'selected' : ''}>Approach</option>
              <option value="landing" ${data.type === 'landing' ? 'selected' : ''}>Landing</option>
            </select>
          </div>

          <div class="field-group">
            <label>Altitude Range (meters):</label>
            <div class="altitude-inputs">
              <input type="number" id="selected-alt-min" value="${data.altitudeRange?.min || 0}" />
              <span>to</span>
              <input type="number" id="selected-alt-max" value="${data.altitudeRange?.max || 500}" />
            </div>
          </div>
        `;

      default:
        return '';
    }
  }

  private getInstructionsHTML(): string {
    if (this.editorState.selectedItem) {
      return `
        <div class="selected-instructions">
          <h4>✏️ Editing ${this.editorState.selectedItem.type}</h4>
          <ul>
            <li>Modify properties in the Selected section above</li>
            <li>Click "Save Changes" to apply your edits</li>
            <li>Click "Focus Camera" to center the view on this item</li>
            <li>Click "Delete" to remove this item</li>
            <li>Click anywhere else to deselect</li>
          </ul>
        </div>
      `;
    }

    switch (this.editorState.mode.type) {
      case 'select':
        return `
          <ul>
            <li><strong>Click on markers</strong> to select and edit them</li>
            <li>Selected markers will <strong>glow white with a pulsing ring</strong></li>
            <li>Use mode buttons to switch to placement tools</li>
            <li>Ctrl+T for takeoff mode</li>
            <li>Ctrl+L for landing mode</li>
            <li>Ctrl+S to save</li>
            <li>Ctrl+Shift+E to export JSON</li>
            <li>Ctrl+Shift+I to import JSON</li>
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
      btn.addEventListener('click', e => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode as any;
        this.onAction('modeChange', { type: mode });
        this.refresh();
      });
    });

    // Action buttons
    this.container.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        this.onAction(action || '');
      });
    });

    // Phase type selector
    const phaseTypeSelect = this.container.querySelector('#phase-type') as HTMLSelectElement;
    if (phaseTypeSelect) {
      phaseTypeSelect.addEventListener('change', e => {
        const subtype = (e.target as HTMLSelectElement).value;
        this.onAction('modeChange', { ...this.editorState.mode, subtype });
      });
    }

    // Location property inputs
    const titleInput = this.container.querySelector('#location-title') as HTMLInputElement;
    if (titleInput) {
      titleInput.addEventListener('input', e => {
        if (this.editorState.currentLocation) {
          this.editorState.currentLocation.title = (e.target as HTMLInputElement).value;
          this.onAction('locationChanged');
        }
      });
    }

    const descriptionInput = this.container.querySelector(
      '#location-description'
    ) as HTMLTextAreaElement;
    if (descriptionInput) {
      descriptionInput.addEventListener('input', e => {
        if (this.editorState.currentLocation) {
          this.editorState.currentLocation.description = (e.target as HTMLTextAreaElement).value;
          this.onAction('locationChanged');
        }
      });
    }

    const regionInput = this.container.querySelector('#location-region') as HTMLInputElement;
    if (regionInput) {
      regionInput.addEventListener('input', e => {
        if (this.editorState.currentLocation) {
          this.editorState.currentLocation.region = (e.target as HTMLInputElement).value;
          this.onAction('locationChanged');
        }
      });
    }

    // Selected item editing event handlers
    this.setupSelectedItemEventListeners();
  }

  private setupSelectedItemEventListeners(): void {
    if (!this.container || !this.editorState.selectedItem) return;

    // Delete selected item
    const deleteBtn = this.container.querySelector('[data-action="delete-selected"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.onAction('deleteSelected', { item: this.editorState.selectedItem });
      });
    }

    // Save selected item changes
    const saveBtn = this.container.querySelector('[data-action="save-selected"]');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSelectedItemChanges();
      });
    }

    // Deselect item
    const cancelBtn = this.container.querySelector('[data-action="deselect"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.onAction('deselectItem');
      });
    }

    // Focus camera on selected item
    const focusBtn = this.container.querySelector('[data-action="focus-selected"]');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        this.onAction('focusSelected', { item: this.editorState.selectedItem });
      });
    }

    // Basic property inputs
    const titleInput = this.container.querySelector('#selected-title') as HTMLInputElement;
    const descriptionInput = this.container.querySelector(
      '#selected-description'
    ) as HTMLTextAreaElement;

    if (titleInput) {
      titleInput.addEventListener('input', () => {
        this.markSelectedItemDirty();
      });
    }

    if (descriptionInput) {
      descriptionInput.addEventListener('input', () => {
        this.markSelectedItemDirty();
      });
    }

    // Item-specific field handlers
    this.setupItemSpecificEventListeners();
  }

  private setupItemSpecificEventListeners(): void {
    if (!this.container || !this.editorState.selectedItem) return;

    const item = this.editorState.selectedItem;

    switch (item.type) {
      case 'takeoff':
        this.setupTakeoffEventListeners();
        break;
      case 'landing':
        this.setupLandingEventListeners();
        break;
      case 'phase':
        this.setupPhaseEventListeners();
        break;
    }
  }

  private setupTakeoffEventListeners(): void {
    const difficultySelect = this.container?.querySelector(
      '#selected-difficulty'
    ) as HTMLSelectElement;
    const walkingTimeInput = this.container?.querySelector(
      '#selected-walking-time'
    ) as HTMLInputElement;
    const hazardsInput = this.container?.querySelector('#selected-hazards') as HTMLInputElement;

    if (difficultySelect) {
      difficultySelect.addEventListener('change', () => {
        this.markSelectedItemDirty();
      });
    }

    if (walkingTimeInput) {
      walkingTimeInput.addEventListener('input', () => {
        this.markSelectedItemDirty();
      });
    }

    if (hazardsInput) {
      hazardsInput.addEventListener('input', () => {
        this.markSelectedItemDirty();
      });
    }
  }

  private setupLandingEventListeners(): void {
    const typeSelect = this.container?.querySelector('#selected-landing-type') as HTMLSelectElement;
    const surfaceSelect = this.container?.querySelector('#selected-surface') as HTMLSelectElement;
    const widthInput = this.container?.querySelector('#selected-width') as HTMLInputElement;
    const lengthInput = this.container?.querySelector('#selected-length') as HTMLInputElement;

    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        this.markSelectedItemDirty();
      });
    }

    if (surfaceSelect) {
      surfaceSelect.addEventListener('change', () => {
        this.markSelectedItemDirty();
      });
    }

    if (widthInput) {
      widthInput.addEventListener('input', () => {
        this.markSelectedItemDirty();
      });
    }

    if (lengthInput) {
      lengthInput.addEventListener('input', () => {
        this.markSelectedItemDirty();
      });
    }
  }

  private setupPhaseEventListeners(): void {
    const phaseTypeSelect = this.container?.querySelector(
      '#selected-phase-type'
    ) as HTMLSelectElement;
    const altMinInput = this.container?.querySelector('#selected-alt-min') as HTMLInputElement;
    const altMaxInput = this.container?.querySelector('#selected-alt-max') as HTMLInputElement;

    if (phaseTypeSelect) {
      phaseTypeSelect.addEventListener('change', () => {
        this.markSelectedItemDirty();
      });
    }

    if (altMinInput) {
      altMinInput.addEventListener('input', () => {
        this.markSelectedItemDirty();
      });
    }

    if (altMaxInput) {
      altMaxInput.addEventListener('input', () => {
        this.markSelectedItemDirty();
      });
    }
  }

  private markSelectedItemDirty(): void {
    if (this.editorState.selectedItem) {
      this.editorState.selectedItem.isDirty = true;
      this.onAction('selectedItemChanged');
    }
  }

  private saveSelectedItemChanges(): void {
    if (!this.container || !this.editorState.selectedItem) return;

    const item = this.editorState.selectedItem;
    const data = item.data;

    // Get basic properties
    const titleInput = this.container.querySelector('#selected-title') as HTMLInputElement;
    const descriptionInput = this.container.querySelector(
      '#selected-description'
    ) as HTMLTextAreaElement;

    if (titleInput) data.title = titleInput.value;
    if (descriptionInput) data.description = descriptionInput.value;

    // Get item-specific properties
    this.saveItemSpecificChanges(item);

    // Mark as clean and notify
    item.isDirty = false;
    this.onAction('saveSelectedItem', { item });
  }

  private saveItemSpecificChanges(item: any): void {
    if (!this.container) return;

    const data = item.data;

    switch (item.type) {
      case 'takeoff':
        const difficultySelect = this.container.querySelector(
          '#selected-difficulty'
        ) as HTMLSelectElement;
        const walkingTimeInput = this.container.querySelector(
          '#selected-walking-time'
        ) as HTMLInputElement;
        const hazardsInput = this.container.querySelector('#selected-hazards') as HTMLInputElement;

        if (difficultySelect) {
          if (!data.safety) data.safety = {};
          data.safety.difficulty = difficultySelect.value;
        }

        if (walkingTimeInput) {
          if (!data.access) data.access = {};
          data.access.walkingTime = parseInt(walkingTimeInput.value) || 10;
        }

        if (hazardsInput) {
          if (!data.safety) data.safety = {};
          data.safety.hazards = hazardsInput.value
            .split(',')
            .map(h => h.trim())
            .filter(h => h.length > 0);
        }
        break;

      case 'landing':
        const typeSelect = this.container.querySelector(
          '#selected-landing-type'
        ) as HTMLSelectElement;
        const surfaceSelect = this.container.querySelector(
          '#selected-surface'
        ) as HTMLSelectElement;
        const widthInput = this.container.querySelector('#selected-width') as HTMLInputElement;
        const lengthInput = this.container.querySelector('#selected-length') as HTMLInputElement;

        if (typeSelect) data.type = typeSelect.value;
        if (surfaceSelect) data.surface = surfaceSelect.value;

        if (widthInput && lengthInput) {
          if (!data.size) data.size = {};
          data.size.width = parseInt(widthInput.value) || 100;
          data.size.length = parseInt(lengthInput.value) || 150;
        }
        break;

      case 'phase':
        const phaseTypeSelect = this.container.querySelector(
          '#selected-phase-type'
        ) as HTMLSelectElement;
        const altMinInput = this.container.querySelector('#selected-alt-min') as HTMLInputElement;
        const altMaxInput = this.container.querySelector('#selected-alt-max') as HTMLInputElement;

        if (phaseTypeSelect) data.type = phaseTypeSelect.value;

        if (altMinInput && altMaxInput) {
          if (!data.altitudeRange) data.altitudeRange = {};
          data.altitudeRange.min = parseInt(altMinInput.value) || 0;
          data.altitudeRange.max = parseInt(altMaxInput.value) || 500;
        }
        break;
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
      landingsEl.textContent = (
        this.editorState.currentLocation?.landingZones.length || 0
      ).toString();
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
