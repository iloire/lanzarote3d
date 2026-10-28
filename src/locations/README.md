# Locations

A location is a place the terrain scenes can be set in: its terrain model and how latitude and
longitude map onto it (`types.ts`). `TerrainBase` loads Lanzarote unless an app sets another.

- **Lanzarote** (`lanzarote.ts`) is hand-modelled in `3d/lanzarote.blend`; its anchor was fitted
  by hand (`shared/geo.ts`) and its regions live in `shared/env/terrain-regions.json`.
- **Rio de Janeiro** (`rio-de-janeiro.json` + `.ts`) and **Tenerife** (`tenerife.json` + `.ts`,
  Adeje: Taucho takeoff to La Caleta, El Teide behind) are built from elevation data, below.

## A place built from elevation data

One JSON file describes it, and both sides read it: `3d/dem-to-glb.py` builds the terrain from it
and `dem.ts` turns it into a `Location`, so the anchor never needs fitting.

```sh
uv run 3d/dem-to-glb.py src/locations/rio-de-janeiro.json assets/locations/rio-de-janeiro.glb
```

The script downloads the Copernicus GLO-30 tiles it needs (public AWS bucket, cached in
`3d/dem-cache/`, ~45 MB a tile), samples them on a grid and writes a slim GLB in world units.
Ground at or below 0 m becomes sea floor under the water plane.

| Field                   | Meaning                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `name`            | `?location=<id>` in the relax app; `name` is shown in logs                                                                                                                                                                                                                                                                                                                                                      |
| `bbox`                  | `south`, `north`, `west`, `east` in degrees. Its centre is the world origin                                                                                                                                                                                                                                                                                                                                     |
| `spacing`               | Grid spacing in metres. Keep rows × cols ≤ 65,535 (16-bit indices); the script stops if not                                                                                                                                                                                                                                                                                                                     |
| `unitsPerMetre`         | World units per metre across the ground. 0.772 matches Lanzarote, so gliders and birds keep their size                                                                                                                                                                                                                                                                                                          |
| `verticalExaggeration`  | Heights are multiplied by this (Lanzarote's model is about 2.9×)                                                                                                                                                                                                                                                                                                                                                |
| `places`                | Named points, `at: [lat, lon]` — launch, landing, peaks                                                                                                                                                                                                                                                                                                                                                         |
| `soaringLoop.waypoints` | `[lat, lon, metres above sea level]`, the closed loop the relax app's gliders fly. Keep ≥ 100 m above ground                                                                                                                                                                                                                                                                                                    |
| `camera`                | `at` and `lookAt`, `[lat, lon, metres]`, where the relax app watches from                                                                                                                                                                                                                                                                                                                                       |
| `clouds`                | `{ at: [lat, lon], kind: "puff" \| "tower", scale }`, cumulus sites; the base height comes from the theme                                                                                                                                                                                                                                                                                                       |
| `regions`               | Ground colour patches, `{ name, at: [lat, lon], radius (m), color, strength 0–1 }`, the same format as `terrain-regions.json`                                                                                                                                                                                                                                                                                   |
| `camera.orbit`          | Degrees either side of the starting view the viewer may orbit; 60 unless given, 180 = all the way round                                                                                                                                                                                                                                                                                                         |
| `towns`                 | `{ name, at: [lat, lon], houseCount, formation: "street" \| "grid" \| "suburban" \| "rural" \| "random", spacing? }`, houses (with gardens, pools and palms) settled onto the terrain                                                                                                                                                                                                                           |
| `scatter`               | `{ kind: "pine" \| "rock" \| "cardon" \| "broadleaf" \| "tower" \| "favela" \| "resort", at: [lat, lon], radius (m), count, minAltitude?, maxAltitude?, heading? }`, things dropped onto the ground within that height band (never in the sea); one instanced mesh per kind. Buildings (`tower`, `favela`, `resort`) take their own size and colour and line up with `heading`, degrees from east towards north |
| `landmarks`             | `{ name, kind, at: [lat, lon], heading?, top? }`, the same format as `shared/env/landmarks.json`; `top` sets it on the highest ground within that many units. Rio has the Cristo Redentor (`kind: "cristo"`)                                                                                                                                                                                                    |

`about` keys are notes for people and are ignored.

The relax app has a switcher at the bottom, one link per place (`?location=<id>`), in the order
of `RELAX_SCENES` in `applications/relax/scenes.ts`.

The relax app keeps the viewer near the gliders, so the terrain's edges never show: panning up to
3,000 units from the start, zooming out to 1.5× the starting distance, orbiting `camera.orbit`
degrees either way, panning over the ground like a map, and neither the camera nor the point it looks at ever under 40 units above the ground. Size the
bbox so the camera's view still has land behind the subject (Tenerife reaches north to El Teide
for that).

The 30 m radar model rounds off sharp summits: Pedra Bonita comes out at 696 m (real 693 m), but
Corcovado and the Sugarloaf lose 70–80 m. The `verticalExaggeration` more than makes up for it.
