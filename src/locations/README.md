# Locations

A location is a place the terrain scenes can be set in: its terrain model and how latitude and
longitude map onto it (`types.ts`). `TerrainBase` loads Lanzarote unless an app sets another.

- **Lanzarote** (`lanzarote.ts`) is hand-modelled in `3d/lanzarote.blend`; its anchor was fitted
  by hand (`shared/geo.ts`) and its regions live in `shared/env/terrain-regions.json`.
- **Rio de Janeiro** (`rio-de-janeiro.json` + `.ts`) is built from elevation data, below.

## A place built from elevation data

One JSON file describes it, and both sides read it: `3d/dem-to-glb.py` builds the terrain from it
and `dem.ts` turns it into a `Location`, so the anchor never needs fitting.

```sh
uv run 3d/dem-to-glb.py src/locations/rio-de-janeiro.json assets/locations/rio-de-janeiro.glb
```

The script downloads the Copernicus GLO-30 tiles it needs (public AWS bucket, cached in
`3d/dem-cache/`, ~45 MB a tile), samples them on a grid and writes a slim GLB in world units.
Ground at or below 0 m becomes sea floor under the water plane.

| Field | Meaning |
| --- | --- |
| `id`, `name` | `?location=<id>` in the relax app; `name` is shown in logs |
| `bbox` | `south`, `north`, `west`, `east` in degrees. Its centre is the world origin |
| `spacing` | Grid spacing in metres. Keep rows × cols ≤ 65,535 (16-bit indices); the script stops if not |
| `unitsPerMetre` | World units per metre across the ground. 0.772 matches Lanzarote, so gliders and birds keep their size |
| `verticalExaggeration` | Heights are multiplied by this (Lanzarote's model is about 2.9×) |
| `places` | Named points, `at: [lat, lon]` — launch, landing, peaks |
| `soaringLoop.waypoints` | `[lat, lon, metres above sea level]`, the closed loop the relax app's gliders fly. Keep ≥ 100 m above ground |
| `camera` | `at` and `lookAt`, `[lat, lon, metres]`, where the relax app watches from |
| `clouds` | `{ at: [lat, lon], kind: "puff" \| "tower", scale }`, cumulus sites; the base height comes from the theme |
| `regions` | Ground colour patches, `{ name, at: [lat, lon], radius (m), color, strength 0–1 }`, the same format as `terrain-regions.json` |

`about` keys are notes for people and are ignored.

The 30 m radar model rounds off sharp summits: Pedra Bonita comes out at 696 m (real 693 m), but
Corcovado and the Sugarloaf lose 70–80 m. The `verticalExaggeration` more than makes up for it.
