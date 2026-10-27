# Rendering: how the island scenes get their look

Every scene built on `TerrainBase` (Home, the Famara and Boats animations, and static Famara)
draws through one shared pipeline. The code lives in
`src/foundation/rendering/`, and the theme (`DEFAULT_THEME` in `src/foundation/themes/index.ts`)
tunes it.

## The frame

`RenderPipeline.render(camera)` is called once per frame through `TerrainBase.renderFrame()`:

1. **Scene pass, MSAA, half float** (`MsaaScenePass`). This is the only multisampled
   target. It takes 4 samples below a pixel ratio of 1.5 and 2 from 1.5 up (`samplesFor`):
   on a Retina screen the pixels are small enough that 2× gives the same edges, and at
   2880×1800 on an M3 Pro 4× cost 3–5 ms more of a ~22 ms frame. When the composer's own ping-pong buffers
   were multisampled, every full-screen pass paid for a resolve and the frame time doubled
   (17.2 ms against 8.3 ms on an M3 Pro). The copy out also drops NaN/Inf pixels and
   clamps blown-out highlights, because bloom would otherwise smear one bad pixel into a
   black hole across the frame.
2. **Bloom** (`UnrealBloomPass`) on linear HDR, above `bloomThreshold`: the sun, sun glints
   on the sea, and the lit cloud tops.
3. **Output**: ACES filmic tone mapping and conversion to sRGB.
4. **Grade**: saturation, contrast, warm highlights against cool shadows, and a vignette.

The post passes themselves are cheap; what costs is multisampling. MSAA makes every
primitive in the scene pass expensive, which is why the wireframe is shaded rather than
drawn as lines (see the ground, below). Pass `?fx=0` to render without the pipeline, to
compare looks and frame times.

Every frame the pipeline also:

- ticks the shared clock (`sharedUniforms.uTime`) that moves the sea, the cloud shadows
  and the gulls;
- moves the sun's shadow box (±3 km, snapped to whole texels) to follow the camera,
  instead of spreading one 2048² map across the whole island;
- adapts its quality when frames average over 22 ms: first it sheds MSAA samples (4 → 2 → 0),
  because they cost more than pixels, and only then drops the pixel ratio by 0.25 at a time.
  Once frames are under 17.5 ms, with a 10 s cooldown after each drop, it climbs back in the
  reverse order: pixel ratio first, then samples up to `samplesFor` that ratio. The pixel
  ratio's ceiling is the device's ratio (at most 2), or 1.5 when the scene is embedded
  (`?embed=1`).

## The sky lights everything

`refreshSky()` runs on load and whenever the sun moves:

- **Environment map**: the sky is rendered through PMREM into `scene.environment`, so
  every `MeshStandardMaterial` (the sea, the ground) is lit by the real sky colour.
- **Fog colour = the horizon**: the sky is sampled a few degrees above the horizon,
  looking across the sun. That colour becomes the `FogExp2` colour, and the sky shader
  is patched to fade into the same colour below about 8° (`Sky.setHaze`). The sea and
  the far end of the island fade into the haze without a hard line at the horizon.
- The sprite lens flare is turned off. It reads the framebuffer, which doesn't work from
  a multisampled target, and bloom gives the sun its glow anyway.

## The sea (`OceanMaterial`)

The sea is still a single quad. It's a `MeshStandardMaterial` patched in `onBeforeCompile`,
so physically based lighting supplies the reflection of the sky and the sun glint. The
patch adds:

- **Wave normals**: three long swells along the wind, plus fbm chop. The normals are
  computed per pixel and faded with distance, so the far sea doesn't shimmer.
- **Shallows and surf** from the **coast field** (`CoastField.ts`). At load, the island is
  drawn from directly above into a 2048-pixel mask (white above sea level). A two-pass
  chamfer distance transform then turns the mask into "metres to the nearest beach"
  (about 23 m per texel, capped at 2.5 km). The sea shades from turquoise to deep blue
  across `shallowDistance`, with surf lines rolling in over the last ~140 m and foam at
  the water's edge.
- **Whitecaps** that grow with the wind speed, and **cloud shadows** drifting downwind.

## The ground (`Island.ts`)

The ground is a solid **underlay** that also draws the wireframe. It's tinted from sand at
the waterline, through the main ground colour, to the peak colour at altitude, and it
casts and receives the sun's shadows.

It's low poly: flat-shaded, and every triangle is one colour. `bakeFaceShading` gives the
three corners of each face the same face height, flatness (the y of its unit normal) and
seeded random, once at load. The shader tints by that face height, brightens level faces
and darkens steep ones by `underlay.slopeShade`, and varies each face's tone at random by
up to `underlay.faceJitter`, so neighbours differ and the cliffs read as rock.

The lines are shaded into the underlay rather than drawn as GL lines. The underlay keeps
its own non-indexed copy of the island in which every triangle corner carries a barycentric
coordinate, so the fragment shader knows its distance to each edge in pixels (`fwidth`) and
mixes in the theme's line colour and emissive over about one anti-aliased pixel. The island's
own line material is hidden while an underlay is shown; raycasts still use its indexed mesh
and BVH. Drawn as GL lines, 350k segments went into the 4× multisampled scene target, and
on an M3 Pro (1440×900) the frame took 74 ms looking at the whole island and 36–44 ms
closer in; shaded, it takes about 22 ms from every view.

The lines fade with distance: from `lineOpacity` near the camera to `farLineOpacity` between
600 m and 9 km. Without the fade, the far end of the mesh is so dense that the lines merge
into a sheet.

A theme without an underlay still draws the GL lines, with the same fade and
their brightness capped (`LINE_MAX_BRIGHTNESS`) before they blend. Each underlay vertex is
pushed 0.3 % further along its view ray, so roads and anything else drawn on the ground stay
in front of it. Polygon offset can't do this, because the logarithmic depth buffer overrides
it.

## Clouds (`Cloud.ts`, `Clouds.ts`, `cloudMaterial.ts`)

Low-poly cumulus with flat bottoms, all at one cloud base just above the main thermals' tops.
There's a cluster of 2 to 6 clouds over each main thermal and three more in between. The
super thermal's cluster is led by a tower. `buildCloudGeometry` stacks icosahedron lobes in
layers that narrow as they rise. Puffs have 2–3 layers and towers 6–7, and lobes over 150
units get the finer 80-face icosahedron. It then clamps everything below the base to y = 0,
so the bottom layer is cut flat. Each cluster is merged into one non-indexed mesh, which
makes one draw call and gives every face its own flat normal.

The clouds aren't lit by the scene's lights. They all share one `ShaderMaterial` that shades
them itself:

- `light` on faces turned to the sun, `shade` on faces turned away;
- `base` on the flat underside and the lowest third;
- a `rim` silver lining when the camera looks towards the sun;
- `setCloudSun` (called from `refreshSky`) warms everything as the sun nears the horizon;
- the scene's fog, so distant clouds fade into the horizon haze.

Each vertex carries its lobe's centre and phase and its cloud's phase. The vertex shader
uses these to make the lobes breathe (±5 %) and each cloud bob (±40 units), so no CPU work
runs per frame. The Models viewer shows a single `cloud` and `cloud-tower`.

## Life

`Gulls` (`components/wildlife/Gulls.ts`) puts flocks circling in thermals into one
`InstancedMesh`. That's one draw call for every bird. The orbit, the slow climb, banking
into the turn and the wingbeat (bursts of flapping between glides) all run in the vertex
shader from per-instance parameters, so nothing runs on the CPU per frame. The Famara
scenes share `FAMARA_GULL_FLOCKS` from `shared/env/environment.ts`.

## Camera

- **Home fly-in**: a centripetal Catmull-Rom spline through the three waypoints, walked by
  arc length with `Easing.approach`. That curve starts and ends at rest, peaks a third
  of the way in, and then arrives slowly. After it lands, the camera follows the lead pilot on
  a critically damped spring (`home/cameraFollow.ts`, tuned by `CAMERA_FOLLOW`): it aims a
  little ahead along the pilot's flight and rolls with a quarter of the pilot's bank. It keeps
  La Graciosa, Famara beach and the ocean behind the pilots, swaying ±18° about a line just
  seaward of Graciosa (`CAMERA_SWAY`, `LA_GRACIOSA`) rather than circling round to the cliff,
  until someone takes the controls.
- **Follow mode** (`CameraTargetController`) is a chase camera. It sits behind the
  target's direction of travel, its distance is sized from the target's meshes, and it
  eases only its offset, so it moves with the target instead of trailing behind it.

## Theme schema

Everything here is driven from `DEFAULT_THEME` in `src/foundation/themes/index.ts`, the only theme
(the alternative presets and the menu picker were removed). All the new fields are optional.

```ts
clouds: {                    // defaults: DEFAULT_CLOUDS in cloudMaterial.ts
  light: '#ffffff', shade: '#b4c0d4', base: '#77849c', rim: '#fff3dc',
  brightness: 1.35,          // scales all four
},
water: {
  color: '#08304a',          // deep water
  shallowColor: '#23a9a6',   // over the sand near the beaches
  shallowDistance: 700,      // how far out the shallows reach (world units ≈ metres)
},
terrain: {
  underlay: {
    color: '#34302d', peakColor: '#3f2f27', sandColor: '#b39668',
    lineOpacity: 0.45,       // wireframe near the camera
    farLineOpacity: 0.12,    // ...fading to this by 9 km
  },
},
atmosphere: {                // defaults: DEFAULT_ATMOSPHERE in RenderPipeline.ts
  exposure: 0.72,
  fogColor: '#…',            // omit to use the sky's own horizon colour
  fogDensity: 0.000026,
  bloomStrength: 0.3, bloomRadius: 0.6, bloomThreshold: 1.2,
  vignette: 0.35, saturation: 1.12, contrast: 1.06, warmth: 0.04,
  cloudShadow: 0.25,
},
weather: { windDirectionDegreesFromNorth: 280, speedMetresPerSecond: 5 }, // drives waves and cloud shadows
```

## Measuring

Dev builds expose `window.__lz = { renderer, pipeline }`. `renderer.info.render` counts the
whole frame, because the pipeline resets it once per frame rather than once per pass, and
`pipeline.getStats()` returns the current pixel ratio, MSAA samples and average frame time.
