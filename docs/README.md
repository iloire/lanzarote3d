# Lanzarote 3D docs

- **[RENDERING.md](RENDERING.md)**: the render pipeline, sea, ground, gulls and camera, and the
  theme fields that tune them.
- **[COMPONENT_COMPOSITION.md](COMPONENT_COMPOSITION.md)**: how the models are built, from the
  component base classes to the two ways of building a component.

The scenes are in `src/applications/<story>/`, registered in `src/config/apps.json`, and picked with
`?story=`: `home`, `famara-animation`, `boats-animation`, `famara` and `town`.

For running, checking and deploying the project, see [../README.md](../README.md).
