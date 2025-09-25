import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { 
  EditorState, 
  resetLocation, 
  undoLastAction, 
  clearLocalStorage, 
  getCurrentLocation,
  setCurrentLocation,
  deleteLocation,
  editLocation,
  saveToLocalStorage,
  exportLocationData,
  copyToClipboard
} from "./state";

interface EditorUIProps {
  state: EditorState;
}

const EditorUI: React.FC<EditorUIProps> = ({ state }) => {
  const [currentLocation, setCurrentLocationState] = useState(getCurrentLocation(state));
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('metadata');
  const [exportData, setExportData] = useState<{ metadata: string, takeoffs: string, landingSpots: string, flyzone: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState('');
  
  // Update UI when state changes
  useEffect(() => {
    setCurrentLocationState(getCurrentLocation(state));
  }, [state.currentLocationIndex, state.locations]);
  
  // Handle location selection
  const handleSelectLocation = (index: number) => {
    const scene = (window as any).__editorScene;
    if (scene) {
      setCurrentLocation(state, index);
      setCurrentLocationState(getCurrentLocation(state));
    }
  };
  
  // Handle location deletion
  const handleDeleteLocation = (index: number) => {
    const scene = (window as any).__editorScene;
    if (scene) {
      deleteLocation(state, index, scene);
      setCurrentLocationState(getCurrentLocation(state));
    }
  };
  
  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (currentLocation) {
      if (!editMode) {
        // Enter edit mode
        setEditTitle(currentLocation.title);
        setEditDescription(currentLocation.description);
      } else {
        // Save changes
        const scene = (window as any).__editorScene;
        if (scene && state.currentLocationIndex !== null) {
          editLocation(state, state.currentLocationIndex, {
            title: editTitle,
            description: editDescription
          });
          saveToLocalStorage(state);
        }
      }
      setEditMode(!editMode);
    }
  };
  
  // Handle reset button click
  const handleReset = () => {
    // Get the scene from the window object
    const scene = (window as any).__editorScene;
    if (scene) {
      resetLocation(state, scene);
      setCurrentLocationState(null);
    } else {
      console.error("Scene not available for reset");
    }
  };
  
  // Add the handleUndo function
  const handleUndo = () => {
    const scene = (window as any).__editorScene;
    if (scene) {
      undoLastAction(state, scene);
      setCurrentLocationState(getCurrentLocation(state));
    } else {
      console.error("Scene not available for undo");
    }
  };
  
  // Add a function to handle clearing localStorage
  const handleClearStorage = () => {
    const scene = (window as any).__editorScene;
    if (scene) {
      clearLocalStorage();
      resetLocation(state, scene);
      setCurrentLocationState(null);
    } else {
      console.error("Scene not available for clearing storage");
    }
  };
  
  // Add a function to handle export
  const handleExport = () => {
    const data = exportLocationData(state);
    setExportData(data);
    setShowExportModal(true);
  };
  
  // Add a function to handle copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (error) {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };
  
  // Render location list
  const renderLocationList = () => {
    return (
      <div className="location-list">
        <h3>Locations ({state.locations.length})</h3>
        {state.locations.length === 0 ? (
          <p>No locations created yet. Click on the map to create one.</p>
        ) : (
          <ul>
            {state.locations.map((location, index) => (
              <li 
                key={location.id} 
                className={state.currentLocationIndex === index ? 'active' : ''}
              >
                <span onClick={() => handleSelectLocation(index)}>
                  {location.title}
                </span>
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteLocation(index)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  
  // Render location details
  const renderLocationDetails = () => {
    if (!currentLocation) return null;
    
    if (editMode) {
      return (
        <div className="location-edit">
          <div className="form-group">
            <label>Title:</label>
            <input 
              type="text" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea 
              value={editDescription} 
              onChange={(e) => setEditDescription(e.target.value)} 
            />
          </div>
          <button className="edit-button" onClick={handleEditToggle}>
            Save Changes
          </button>
        </div>
      );
    }
    
    return (
      <div className="location-info">
        <div className="location-header">
          <h3>{currentLocation.title}</h3>
          <div className="button-row">
            <button className="edit-button" onClick={handleEditToggle}>
              Edit
            </button>
            <button className="export-button" onClick={handleExport}>
              Export
            </button>
          </div>
        </div>
        <p className="location-description">{currentLocation.description}</p>
        <p>Position: X: {currentLocation.position.x.toFixed(2)}, Y: {currentLocation.position.y.toFixed(2)}, Z: {currentLocation.position.z.toFixed(2)}</p>
        
        {/* Add GPS coordinates display */}
        {currentLocation.gps && (
          <p>GPS: Lat: {currentLocation.gps.latitude.toFixed(6)}, Lon: {currentLocation.gps.longitude.toFixed(6)}, Alt: {currentLocation.gps.altitude.toFixed(1)}m</p>
        )}
        
        <p>Takeoffs: {currentLocation.takeoffs.length}</p>
        <p>Landing Spots: {currentLocation.landingSpots.length}</p>
        <p>FlyZone Phases: {Object.keys(currentLocation.flyzone.phases).length}</p>
        <div className="button-group">
          <button className="undo-button" onClick={handleUndo}>Undo Last Action</button>
          <button className="reset-button" onClick={handleReset}>Reset Location</button>
        </div>
        <button className="clear-storage-button" onClick={handleClearStorage}>Clear Saved Data</button>
      </div>
    );
  };
  
  // Add a function to render the export modal
  const renderExportModal = () => {
    if (!showExportModal || !exportData) return null;
    
    const getActiveTabContent = () => {
      switch (activeTab) {
        case 'metadata':
          return exportData.metadata;
        case 'takeoffs':
          return exportData.takeoffs;
        case 'landingSpots':
          return exportData.landingSpots;
        case 'flyzone':
          return exportData.flyzone;
        default:
          return '';
      }
    };
    
    return (
      <div className="export-modal">
        <div className="export-modal-content">
          <h2>Export Location Data</h2>
          <div className="export-tabs">
            <button 
              className={`tab-button ${activeTab === 'metadata' ? 'active' : ''}`}
              onClick={() => setActiveTab('metadata')}
            >
              metadata.ts
            </button>
            <button 
              className={`tab-button ${activeTab === 'takeoffs' ? 'active' : ''}`}
              onClick={() => setActiveTab('takeoffs')}
            >
              takeoffs.ts
            </button>
            <button 
              className={`tab-button ${activeTab === 'landingSpots' ? 'active' : ''}`}
              onClick={() => setActiveTab('landingSpots')}
            >
              landingSpots.ts
            </button>
            <button 
              className={`tab-button ${activeTab === 'flyzone' ? 'active' : ''}`}
              onClick={() => setActiveTab('flyzone')}
            >
              flyzone.ts
            </button>
          </div>
          
          <div className="export-tab-content active">
            <div className="copy-container">
              <button 
                className="copy-button" 
                onClick={() => handleCopy(getActiveTabContent())}
              >
                {copyStatus || 'Copy to Clipboard'}
              </button>
            </div>
            <pre>{getActiveTabContent()}</pre>
          </div>
          
          <button 
            className="close-modal" 
            onClick={() => setShowExportModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="editor-ui">
      <h2>Location Editor</h2>
      {renderLocationList()}
      {renderLocationDetails()}
      <div className="editor-instructions">
        <p>Current Mode: <strong>{state.mode}</strong></p>
        {state.mode === 'flyzone' && (
          <p>FlyZone Phase Type: <strong>{state.flyZonePhaseType}</strong></p>
        )}
        <p>Click on the map to add items.</p>
      </div>
      {renderExportModal()}
    </div>
  );
};

export const createEditorUI = (state: EditorState) => {
  const rootElement = document.getElementById("editor-ui");
  if (!rootElement) {
    const newElement = document.createElement("div");
    newElement.id = "editor-ui";
    document.body.appendChild(newElement);
    const root = createRoot(newElement);
    root.render(<EditorUI state={state} />);
  } else {
    const root = createRoot(rootElement);
    root.render(<EditorUI state={state} />);
  }
}; 