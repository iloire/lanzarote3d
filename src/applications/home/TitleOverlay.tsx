import React from 'react';
import { createRoot } from 'react-dom/client';
import './title-overlay.css';

const VoxelTitle: React.FC = () => (
  <div className="voxel-title-container">
    <h1 className="voxel-title">
      <span className="voxel-title-main">Lanzarote</span>
      <span className="voxel-title-sub">Paragliding</span>
    </h1>
  </div>
);

/**
 * Mounts the voxel title over the scene. Returns a function that removes it.
 */
export const createTitleOverlay = (): (() => void) => {
  const container = document.createElement('div');
  container.id = 'title-overlay';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<VoxelTitle />);

  return () => {
    root.unmount();
    container.remove();
  };
};
