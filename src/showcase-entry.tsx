import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import WebGL from "./WebGL";
import App from "./app";

import "./index.css";

THREE.Cache.enabled = true;

// Get the story name from the filename
const scriptTag = document.currentScript as HTMLScriptElement;
const bundleName = scriptTag?.src.match(/([^\/]+)\.bundle\.js$/)?.[1] || 'animation';

const rootElement = document.getElementById("root");
if (WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(<App showAppSelection={true} showPublic={true} showDev={false} showExperiments={false} initialStory={bundleName} />);
  console.log(`${bundleName} started`);
} else {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
}