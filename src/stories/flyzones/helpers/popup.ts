import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Media, Location } from '../locations';
import * as THREE from 'three';

export const createLabel = (title: string) => {
  const labelDiv = document.createElement('div');
  labelDiv.className = 'marker-label';
  labelDiv.textContent = title;
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 600, 0);
  return label;
};

export const createPopupContent = (title: string, description: string, mediaItems: Media[]) => {
  const mediaContent = mediaItems.map(mediaItem => 
    mediaItem.type === 'image' 
      ? `<img src="${mediaItem.url}" alt="${mediaItem.title || ''}">`
      : `<video controls><source src="${mediaItem.url}" type="video/mp4"></video>`
  ).join('');

  return `
    <div class="popup-content">
      <h2>${title}</h2>
      <p>${description || 'No description available'}</p>
      <div class="media-container">
        ${mediaContent}
      </div>
      <button class="close-popup">Close</button>
    </div>
  `;
};

export const createPopupHandler = (params: {
  type: string,
  title: string,
  description: string,
  mediaItems: Media[],
  position: THREE.Vector3,
  location: Location | undefined,
  popupContainer: HTMLDivElement,
  navigateTo: (position: THREE.Vector3, location?: Location) => void
}) => {
  const { type, title, description, mediaItems, position, location, popupContainer, navigateTo } = params;

  return () => {
    if (type === 'takeoff' || type === 'landing') {
      showDetailPopup(title, description, mediaItems, popupContainer);
    } else {
      navigateTo(position, location);
    }
  };
};

export const showDetailPopup = (title: string, description: string, mediaItems: Media[], popupContainer: HTMLDivElement) => {
  popupContainer.style.display = 'block';
  popupContainer.innerHTML = createPopupContent(title, description, mediaItems);

  const closeButton = popupContainer.querySelector('.close-popup');
  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      popupContainer.style.display = 'none';
    });
  }
};

export const setupPopupContainer = () => {
  const existingContainer = document.querySelector('.location-popup');
  if (existingContainer) {
    existingContainer.remove();
  }

  const container = document.createElement('div');
  container.style.display = 'none';
  container.className = 'location-popup';
  document.body.appendChild(container);
  return container;
}; 