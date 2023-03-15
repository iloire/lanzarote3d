export type GuiHelperOptions = {
  max: number;
  min: number;
};

const GuiHelper = {
  addLocationGui: (
    gui,
    name: string,
    obj: any,
    options: GuiHelperOptions = { min: -20, max: 20 }
  ) => {
    const { min, max } = options;
    const pgGui = gui.addFolder(name);
    pgGui
      .add(obj.position, "x", min, max)
      .name(name + ".position.x")
      .listen();
    pgGui
      .add(obj.position, "y", min, max)
      .name(name + ".position.y")
      .listen();
    pgGui
      .add(obj.position, "z", min, max)
      .name(name + ".position.z")
      .listen();
    pgGui
      .add(obj.rotation, "x", -Math.PI, Math.PI)
      .name(name + ".rotation.x")
      .listen();
    pgGui
      .add(obj.rotation, "y", -Math.PI, Math.PI)
      .name(name + ".rotation.y")
      .listen();
    pgGui
      .add(obj.rotation, "z", -Math.PI, Math.PI)
      .name(name + ".rotation.z")
      .listen();
  },
};

export default GuiHelper;
