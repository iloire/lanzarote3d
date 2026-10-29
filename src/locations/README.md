# Locations

A location is a place the terrain scenes can be set in: its terrain model and how latitude and
longitude map onto it (`types.ts`). `TerrainBase` loads Lanzarote unless an app sets another.

- **Lanzarote** (`lanzarote.ts`) is hand-modelled in `3d/lanzarote.blend`; its anchor was fitted
  by hand (`shared/geo.ts`) and its regions live in `shared/env/terrain-regions.json`.
- **Rio de Janeiro** (`rio-de-janeiro.json` + `.ts`), **Tenerife** (`tenerife.json` + `.ts`,
  Adeje: Taucho takeoff to La Caleta, El Teide behind), **El Hierro** (`el-hierro.json` + `.ts`,
  the whole island: ridge soaring on the cliff of El Golfo above Frontera) and **Castejón de Sos**
  (`castejon-de-sos.json` + `.ts`, the Ésera valley in the Pyrenees: the Liri takeoff under
  Gallinero, El Turbón to the south) are built from elevation data, below. **New York**
  (`new-york.json` + `.ts`, Midtown) and **Paris** (`paris.json` + `.ts`, round the Eiffel
  Tower) are cities: flat ground from the same script, and their buildings as voxels from
  OpenStreetMap, [below](#a-city). **Giza** (`giza.json` + `.ts`) is the
  plateau from elevation data with its monuments built by their own script, [below](#giza).

## A place built from elevation data

One JSON file describes it, and both sides read it: `3d/dem-to-glb.py` builds the terrain from it
and `dem.ts` turns it into a `Location`, so the anchor never needs fitting.

```sh
uv run 3d/dem-to-glb.py src/locations/rio-de-janeiro.json assets/locations/rio-de-janeiro.glb
```

The script downloads the Copernicus GLO-30 tiles it needs (public AWS bucket, cached in
`3d/dem-cache/`, ~45 MB a tile), samples them on a grid and writes a slim GLB in world units.
Ground at or below 0 m becomes sea floor under the water plane.

| Field                          | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `name`                   | `?location=<id>` in the relax app; `name` is shown in logs                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `region`                       | Heading the place is listed under in the relax app's place picker ("Canary Islands", "Pyrenees")                                                                                                                                                                                                                                                                                                                                                                                         |
| `bbox`                         | `south`, `north`, `west`, `east` in degrees. Its centre is the world origin                                                                                                                                                                                                                                                                                                                                                                                                              |
| `spacing`                      | Grid spacing in metres. Keep rows × cols ≤ 65,535 (16-bit indices); the script stops if not                                                                                                                                                                                                                                                                                                                                                                                              |
| `unitsPerMetre`                | World units per metre across the ground. 0.772 matches Lanzarote, so gliders and birds keep their size                                                                                                                                                                                                                                                                                                                                                                                   |
| `verticalExaggeration`         | Heights are multiplied by this (Lanzarote's model is about 2.9×)                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `places`                       | Named points, `at: [lat, lon]` — launch, landing, peaks                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `soaringLoop.waypoints`        | `[lat, lon, metres above sea level]`, the closed loop the relax app's gliders fly. Keep ≥ 100 m above ground                                                                                                                                                                                                                                                                                                                                                                             |
| `camera`                       | `at` and `lookAt`, `[lat, lon, metres]`, where the relax app watches from                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clouds`                       | `{ at: [lat, lon], kind: "puff" \| "tower", scale }`, cumulus sites; the base height comes from the theme unless `cloudBase` is set                                                                                                                                                                                                                                                                                                                                                      |
| `regions`                      | Ground colour patches, `{ name, at: [lat, lon], radius (m), color, strength 0–1 }`, the same format as `terrain-regions.json`                                                                                                                                                                                                                                                                                                                                                            |
| `camera.zoomOut`, `camera.pan` | How far the viewer may take the camera: times the starting distance it may zoom out (1.5), world units it may pan (3000). Orbiting is always all the way round                                                                                                                                                                                                                                                                                                                           |
| `cloudBase`                    | Cumulus base in metres above sea level; the theme's (Lanzarote's) unless given. Castejón de Sos sets 3,100 m, above its peaks                                                                                                                                                                                                                                                                                                                                                            |
| `towns`                        | `{ name, at: [lat, lon], houseCount, formation: "street" \| "grid" \| "suburban" \| "rural" \| "random", spacing? }`, houses (with gardens, pools and palms) settled onto the terrain                                                                                                                                                                                                                                                                                                    |
| `scatter`                      | `{ kind: "pine" \| "rock" \| "cardon" \| "broadleaf" \| "tower" \| "favela" \| "resort" \| "village", at: [lat, lon], radius (m), count, minAltitude?, maxAltitude?, heading? }`, things dropped onto the ground within that height band (never in the sea); one instanced mesh per kind. Buildings (`tower`, `favela`, `resort`) take their own size and colour and line up with `heading`, degrees from east towards north; `village` houses (Pyrenean stone under slate) face any way |
| `landmarks`                    | `{ name, kind, at: [lat, lon], heading?, top? }`, the same format as `shared/env/landmarks.json`; `top` sets it on the highest ground within that many units. Rio has the Cristo Redentor (`kind: "cristo"`)                                                                                                                                                                                                                                                                             |
| `flatLand`                     | Metres: lay all land flat at this height instead of the DEM's (a city, whose surface model carries its rooftops)                                                                                                                                                                                                                                                                                                                                                                         |
| `city`                         | `{ voxel, gridHeading, defaultHeight, facades?, roof?, taxis?, eiffelTower? }`: build the buildings with `3d/city-to-glb.py`, below                                                                                                                                                                                                                                                                                                                                                                                             |
| `paramotor`                    | Abel flies his paramotor alone, which needs no ridge, chased by the camera along his path                                                                                                                                                                                                                                                                                                                                                                                                |
| `paramotorSpeed`               | Times a wing's speed the paramotor flies (2 unless given). The app gives every leg of the loop the same time, so keep legs about the same length                                                                                                                                                                                                                                                                                                                                         |
| `flatten`                      | `{ name, at: [lat, lon], size: [east-west, north-south] (m), height?, below? }`: squares of ground laid flat at `height` metres, else at the median round their edge, only where the surface model is lower than `below`. For what the scene models itself (a town's rooftops, a monument)                                                                                                                                                                                              |
| `plain`                        | `{ color, height }`: an inland place has no sea; its land runs on flat to the horizon at `height` metres                                                                                                                                                                                                                                                                                                                                                                                |
| `pyramids`, `sphinx`, …        | Giza's monuments, [below](#giza)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

`about` keys are notes for people and are ignored.

## A city

A city's buildings come from OpenStreetMap, as voxels:

```sh
uv run 3d/dem-to-glb.py src/locations/new-york.json assets/locations/new-york.glb
uv run 3d/city-to-glb.py src/locations/new-york.json assets/locations/new-york-city.glb
```

The first lays the ground flat (`flatLand`); the second fetches the bbox's buildings and building
parts from the Overpass API once (cached in `3d/osm-cache/`, named by the bbox), rasterises them
onto a grid of `city.voxel` metres turned `city.gridHeading` degrees east of north (Manhattan's
avenues run 29°), so blocks sit square on the streets, each cell taking its tallest building
(`height`, else `building:levels` × 3.5 m, else `city.defaultHeight`), and meshes them as blocks:
merged roofs and walls only where neighbours differ, coloured per vertex. Canopies, bridges and
overhangs (`min_height`) are left out, so the street under them stays open. The location's `.ts`
exports the GLB, and the relax scene (`city` in `scenes.ts`) adds it.

Each wall carries its window style in a `_WINDOWS` vertex attribute (none on roofs, punched windows
in masonry, glass curtain walls on towers of 120 m and more) and the node's extras carry the grid
(`origin`, `size`, `street`, `avenue`, `unitsPerMetre`, `ground`, `up`), so
`foundation/rendering/cityWindows.ts` draws a window per voxel and storey lined up with the blocks.

The open land between the buildings becomes a street layer, painted a pixel a cell on one quad
just over the ground (a second node, `Streets`): sidewalks a cell wide round every building, grass
on OpenStreetMap's parks, gardens and pitches, water on its ponds, roadway elsewhere, and zebra
crossings outside each junction (where an avenue's and a street's open runs of 40 cells or more
cross). Off the land it's clear. Every run of roadway 60 cells or more long gets lanes, one or two
a side, which the extras carry as `lanes` ([x0, z0, x1, z1] in world units) for
`shared/env/cityTraffic.ts` to drive cars on: one instanced mesh, a third of them yellow cabs
unless `city.taxis` sets the share (Paris has none). Parks and water are fetched and cached like
the buildings; a multipolygon's member ways are joined into rings (the Seine is one), and road
bridges over water are painted as roadway, 7 cells wide.

A city sets its own colours with `city.facades` (`{ low?, mid?, tall? }`, lists of sRGB colours
for buildings under 30 m, under 120 m and taller; New York's brownstone, limestone and glass
otherwise) and `city.roof` (`{ colour, share }`, how much of the roof is that colour and how much
its facade's; `#4a4a4a` and 0.55 otherwise). Paris is cream limestone under 85% zinc grey.

`city.eiffelTower` (`{ at: [lat, lon] }`) builds the Eiffel Tower there, square on the grid (so
set `gridHeading` to its faces, 44°): a lattice of 1.5 m voxels to its real profile (the
half-widths, floor heights and arches are constants at the top of `eiffel()` in the script),
meshed as merged strips into a third node, `Tower`, one bronze colour. OpenStreetMap's pillars and
pavilions under it are cleared.

Parks get woods (OSM `natural=wood|scrub`, `landuse=forest`) on a darker ground, footways a cell
wide and drives two (OSM `highway` ways, painted only inside parks), and grass whose green and
hue vary over about 120 m and 25 m. All of the ground is darker at the foot of the buildings, up
to 45% where every cell within 3 is built on. Rock outcrops (`natural=bare_rock|rock`) are meshed
with the buildings, 1.2 m high at their edge and 1.4 m higher each cell further in, without windows.
Trees stand on the park cells clear of paths, rocks and buildings, densely in the woods and in
clumps on the lawns; the extras carry them as `trees` ([x, z, scale] per tree, flat) for
`shared/env/cityTrees.ts`, one instanced mesh of voxel trees, a few in autumn colours. The city,
its streets, the trees and the cars all take the sun's shadows, and the window shader darkens
walls towards the street.

`fog` (metres at which the fog has hidden half the view) thickens the theme's fog, so the city's
far edge fades out instead of ending. `look` changes the light from the theme's:
`{ timeOfDay?, ambient?, fogColor? }`, the hour for the sun (later is lower here), the share of the
flat ambient light to keep (less makes the shade read), and the fog's colour instead of the
horizon's.

It also prints how far the `soaringLoop` clears the rooftops within 10 m either side, along the same
Catmull-Rom curve the app flies. In a city the loop can fly the streets: on the turned grid an
avenue is a run of open columns, so waypoints on one column keep the curve straight down it.

## Giza

```sh
uv run 3d/dem-to-glb.py src/locations/giza.json assets/locations/giza.glb
uv run 3d/giza-to-glb.py src/locations/giza.json assets/locations/giza-monuments.glb
```

The ground is the surface model, at New York's 6 units a metre and no height stretch so the
pyramids keep their true shape. The model smears each pyramid into a 30 m-blurred hill, so
`dem-to-glb.py` lays a pad flat under each of `pyramids` (its base plus 40 m a side, at the
median height round the pad's edge), and the `flatten` pads do the same for the Sphinx's
enclosure and the town. `giza-to-glb.py` reads the same ground, so everything stands on it.

`pyramids` lists each one: `at`, `base` (metres, or `[east-west, north-south]`), `height` (to its
lost apex) and `standing` (what is left), `courses`, `color`; then what makes it itself:
`casing` (metres up from which the smooth casing survives, raggedly: Khafre's cap), `granite`
(metres of red granite casing at the foot: Menkaure; Khafre's first course), `gash` (`[from, to]`
metres, the scar in Menkaure's north face), `ruined` (more ragged: Khufu's queens), `steps` (a step
pyramid of that many steps instead: G3-b, G3-c, Khentkawes) and `mast` (the mast marking Khufu's
apex). Courses are thicker low down, with a thicker band every 20-35 courses, and each step sits
in from the slope by a little, a different amount on each face and course; each face is cut in
eight pieces along, so the casing's edge can be ragged.

`sphinx` (`at`, `heading`) places the Sphinx, sculpted from blocks: body in two layers of stone,
restoration masonry round its foot, haunch and tail, forelegs and paws with the Dream Stele between
them, the nemes headdress and the face. `causeways` (`from`, `to`, `width`, `height`) are ramps
laid down the slope. `ruins` raises every other OpenStreetMap building on the plateau (fetched like
a city's, cached in `3d/osm-cache/`): heights by name in `heights`, mastabas and ruins 2.5-6.5 m
with leaning walls, buildings in the valley or with storeys plain and modern; `skip` leaves out
pits and tunnels.

`town` makes up Nazlet el-Samman, which OpenStreetMap barely maps: on a grid of `voxel` metres,
inside `areas` but clear of `clear` (the Sphinx's temples) and only where its `flatten` pad laid
the ground flat, streets every 60-110 m each way, and between them plots two to seven storeys high
in brick, concrete and plaster, meshed and windowed like a city (`city-to-glb.py`'s mesher, and
`cityWindows.ts`).

The monuments carry `_STONE` per vertex (metres along the face, course, how strongly the joints
show), and `foundation/rendering/stoneCourses.ts` draws the blocks: a joint between courses and
every 1.2-2.2 m along them, offset course to course, each block its own shade, worn at its edges.

The script prints how far the loop clears everything within 10 m of it, pyramids, ruins and town.

The relax app has a place picker at the bottom: the current place with `<` and `>` to step to the
previous and next, and a list of every place grouped by `region`, with a search box (accents and
case ignored; Enter goes to the first match). Every place is a link (`?location=<id>`), so it
can be shared. Places and regions keep the order of `RELAX_SCENES` in
`applications/relax/scenes.ts`; Lanzarote's region is set there.

The relax app keeps the viewer near the gliders, so the terrain's edges barely show: panning and
zooming out only as far as `camera.pan` and `camera.zoomOut` allow (Lanzarote, the whole island
with sea all round, is free), orbiting all the way round everywhere, panning over the ground like a map, and neither the camera nor the point it looks at ever under 40 units above the ground. Size the
bbox so the camera's view still has land behind the subject (Tenerife reaches north to El Teide
for that).

The 30 m radar model rounds off sharp summits: Pedra Bonita comes out at 696 m (real 693 m), but
Corcovado and the Sugarloaf lose 70–80 m. The `verticalExaggeration` more than makes up for it.
