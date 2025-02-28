import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import WebGL from "../../WebGL";
import App from "../../app";

import "../../index.css";

THREE.Cache.enabled = true;

const rootElement = document.getElementById("root");
if (WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(<App initialStory="animation" />);
} else {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
}
