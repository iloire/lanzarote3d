const GuiHelper = {
  addLocationGui: (gui, name: string, obj: any) => {
    const pgGui = gui.addFolder(name);
    pgGui
      .add(obj.position, "x", -20, 20)
      .name(name + ".position.x")
      .listen();
    pgGui
      .add(obj.position, "y", -20, 20)
      .name(name + ".position.y")
      .listen();
    pgGui
      .add(obj.position, "z", -20, 20)
      .name(name + ".position.z")
      .listen();
    pgGui
      .add(obj.rotation, "x", -20, 20)
      .name(name + ".rotation.x")
      .listen();
    pgGui
      .add(obj.rotation, "y", -20, 20)
      .name(name + ".rotation.y")
      .listen();
    pgGui
      .add(obj.rotation, "z", -20, 20)
      .name(name + ".rotation.z")
      .listen();
  },
};

export default GuiHelper;
