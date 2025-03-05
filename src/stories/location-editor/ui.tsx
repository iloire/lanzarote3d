import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { EditorState, resetLocation } from "./state";

interface EditorUIProps {
  state: EditorState;
}

const EditorUI: React.FC<EditorUIProps> = ({ state }) => {
  const [location, setLocation] = useState(state.currentLocation);
  
  // Update UI when state changes
  useEffect(() => {
    setLocation(state.currentLocation);
  }, [state.currentLocation]);
  
  // Handle reset button click
  const handleReset = () => {
    // Get the scene from the window object
    const scene = (window as any).__editorScene;
    if (scene) {
      resetLocation(state, scene);
      setLocation(null);
    } else {
      console.error("Scene not available for reset");
    }
  };
  
  if (!location) {
    return (
      <div className="editor-ui">
        <h2>Location Editor</h2>
        <p>Click on the map to create a new location.</p>
      </div>
    );
  }
  
  return (
    <div className="editor-ui">
      <h2>Location Editor</h2>
      <div className="location-info">
        <h3>Location: {location.title}</h3>
        <p>Position: X: {location.position.x.toFixed(2)}, Y: {location.position.y.toFixed(2)}, Z: {location.position.z.toFixed(2)}</p>
        <p>Takeoffs: {location.takeoffs.length}</p>
        <p>Landing Spots: {location.landingSpots.length}</p>
        <p>FlyZone Phases: {Object.keys(location.flyzone.phases).length}</p>
        <button className="reset-button" onClick={handleReset}>Reset Location</button>
      </div>
      <div className="editor-instructions">
        <p>Current Mode: <strong>{state.mode}</strong></p>
        {state.mode === 'flyzone' && (
          <p>FlyZone Phase Type: <strong>{state.flyZonePhaseType}</strong></p>
        )}
        <p>Click on the map to add items.</p>
      </div>
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