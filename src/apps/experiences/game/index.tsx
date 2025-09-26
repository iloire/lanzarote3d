import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import WebGL from '../../../WebGL';
import App from '../../../app';

import '../../../index.css';

THREE.Cache.enabled = true;

const rootElement = document.getElementById('root');
if (WebGL.isWebGLAvailable()) {
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App initialStory="game" />);
  }
} else {
  const warning = WebGL.getWebGLErrorMessage();
  if (rootElement) {
    rootElement.appendChild(warning);
  }
}
