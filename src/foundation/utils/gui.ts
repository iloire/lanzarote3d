import * as THREE from "three";

export type GuiHelperOptions = {
  max: number;
  min: number;
};

const GuiHelper = {
  addRotationGui: (
    gui,
    name: string,
    rotation: THREE.Euler,
    options: GuiHelperOptions = { min: -2 * Math.PI, max: 2 * Math.PI }
  ) => {
    const { min, max } = options;
    const g = gui.addFolder(name);
    g.add(rotation, "x", min, max)
      .name(name + ".rotation.x")
      .listen();
    g.add(rotation, "y", min, max)
      .name(name + ".rotation.y")
      .listen();
    g.add(rotation, "z", min, max)
      .name(name + ".rotation.z")
      .listen();
    g.open(false);
  },

  addPositionGui: (
    gui,
    name: string,
    pos: THREE.Vector3,
    options: GuiHelperOptions = { min: -100, max: 100 }
  ) => {
    const { min, max } = options;
    const g = gui.addFolder(name);
    g.add(pos, "x", min, max)
      .name(name + ".position.x")
      .listen();
    g.add(pos, "y", min, max)
      .name(name + ".position.y")
      .listen();
    g.add(pos, "z", min, max)
      .name(name + ".position.z")
      .listen();
    g.open(false);
  },

  addLocationGui: (
    gui,
    name: string,
    obj: THREE.Object3D,
    options?: GuiHelperOptions
  ) => {
    GuiHelper.addPositionGui(gui, name + " position", obj.position, options);
    GuiHelper.addRotationGui(gui, name + " rotation", obj.rotation);
  },
};

export default GuiHelper;
