import * as THREE from "three";
import rStats from "rStats";
import glStats from "glStats";
import threeStats from "threeStats";

export default class PerfStats {
  rS: any;
  container: any;

  constructor(renderer: THREE.WebGLRenderer, className: string) {
    const tS = new threeStats(renderer);
    const glS = new glStats();

    this.rS = new rStats({
      CSSPath: "https://spite.github.io/rstats/",
      userTimingAPI: true,
      values: {
        frame: { caption: "Total frame time (ms)", over: 16 },
        fps: { caption: "Framerate (FPS)", below: 30 },
        calls: { caption: "Calls (three.js)", over: 3000 },
        raf: { caption: "Time since last rAF (ms)" },
        rstats: { caption: "rStats update (ms)" },
      },
      groups: [
        { caption: "Framerate", values: ["fps", "raf"] },
        {
          caption: "Frame Budget",
          values: ["frame", "texture", "setup", "render"],
        },
      ],
      fractions: [{ base: "frame", steps: ["move", "render"] }],
      plugins: [tS, glS],
    });
    this.container = document.getElementsByClassName(className);
    this.container[0].style.display = "none";
  }

  hide() {
    this.container[0].style.display = "none";
  }

  show() {
    this.container[0].style.display = "";
  }

  isVisible() {
    return this.container[0].style.display === "";
  }

  startTick(name: string) {
    if (!name) {
      throw new Error("invalid name");
    }
    this.rS(name).start();
  }

  endTick(name: string) {
    if (!name) {
      throw new Error("invalid name");
    }
    this.rS(name).end();
  }

  frameStart() {
    this.startTick("frame");
    this.rS("rAF").tick();
    this.rS("FPS").frame();
  }

  frameEnd() {
    this.endTick("frame");
  }

  renderStart() {
    this.startTick("render");
  }

  renderEnd() {
    this.endTick("render");
  }

  wrapFunction(name: string, fn: () => void) {
    this.startTick(name);
    fn();
    this.endTick(name);
  }

  update() {
    this.rS().update();
  }
}
