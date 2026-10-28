# Lanzarote 3D docs

- **[RENDERING.md](RENDERING.md)**: the render pipeline, sea, ground, gulls and camera, and the
  theme fields that tune them.
- **[SEA_SHADER_TUTORIAL.html](SEA_SHADER_TUTORIAL.html)**: a beginner's walkthrough of the ocean
  shader, layer by layer, with a live demo. Open it in a browser.
- **[COMPONENT_COMPOSITION.md](COMPONENT_COMPOSITION.md)**: how the models are built, from the
  component base classes to the two ways of building a component.
- **[HOME_ANIMATION_IDEAS.md](HOME_ANIMATION_IDEAS.md)**: ideas for a livelier home scene that stays
  low poly and fast, and the speed fixes with before/after numbers.

The scenes are in `src/applications/<story>/`, registered in `src/config/apps.json`, and picked with
`?story=`: `home`, `famara-animation`, `boats-animation`, `famara`, `puerto-del-carmen` and
`town`. [PUERTO_DEL_CARMEN_PLAN.md](PUERTO_DEL_CARMEN_PLAN.md) is the plan for the Puerto del
Carmen scene; its harbour data is described in
[`src/applications/puerto-del-carmen/README.md`](../src/applications/puerto-del-carmen/README.md).

- **[LOCATIONS_PLAN.md](LOCATIONS_PLAN.md)**: other paragliding places (Tenerife, Rio de Janeiro)
  built from elevation data, and the relax site that shows them; the data format is in
  [`src/locations/README.md`](../src/locations/README.md).

For running, checking and deploying the project, see [../README.md](../README.md).
