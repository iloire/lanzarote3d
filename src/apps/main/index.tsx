import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import WebGL from "../../WebGL";
import App from "../../app";

import "../../index.css";

THREE.Cache.enabled = true;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const storyParam = urlParams.get("story") || "animation";

const rootElement = document.getElementById("root");
if (WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(<App initialStory={storyParam}  showAppSelection={true}/>);
} else {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
}
