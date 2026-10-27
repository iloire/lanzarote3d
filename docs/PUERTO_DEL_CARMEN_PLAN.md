# Puerto del Carmen scene: plan

Every scene so far looks at Famara on the north-west cliff. This one goes to the other side of the
island: Puerto del Carmen on the south-east coast. It shows white houses along the seafront and up
the slope behind the old town, and boats in the harbour, some moored at the quay and a few
moving outside it. One paraglider soars the hills above Playa Quemada, just to the west.

It is a new story, `?story=puerto-del-carmen`, built like `famara` (static, orbit controls) so it
can be looked at and tuned first. A camera animation comes in phase 2.

**Decisions (2026-10-27):**
- The scene is **private**: it is listed under "Private" in the menu (on localhost, or with dev
  mode on) and not shown to the public.
- The harbour is **the real one**, built from its OpenStreetMap outline, not a generic one.
- **One paraglider over Playa Quemada** is part of phase 1.

## Where it is on the model

The terrain is `lanzarote.glb` scaled by 20000 (`TerrainBase`): +x is east, −z is north, and
1 world unit is roughly 1.4 m. Tracing the southernmost land per 500-unit band of x in the mesh
gives this south coast:

| x | coast z | what it is |
|---|---|---|
| −7000 | 14040 | east end of Los Ajaches, Playa Quemada (the `pq` thermal is at −6227, 14055) |
| −5000 … 500 | ≈ 12600 | the straight coast: Puerto del Carmen, Los Pocillos, Matagorda |
| 1000 … 3000 | 12300 → 11440 | Playa Honda and the airport, where the coast turns north-east |
| 5000 … 9000 | 9900 → 8560 | Arrecife |

Puerto del Carmen's old harbour is about 6 km east of Playa Quemada, so its first estimate is
**x ≈ −2500, z ≈ 12650**, with the town running about 4 km east along the coast to x ≈ +500.
That is an estimate from the coastline, not a measurement, so step 1 checks it on screen.

## The real harbour

From OpenStreetMap (© OpenStreetMap contributors, ODbL), around the `man_made=harbour` node
"Puerto del Carmen" at 28.92117, −13.67441:

- **Breakwater**: it leaves the shore at about −13.6716 and runs west along latitude
  ≈ 28.9204 for about 400 m. It closes off the south side of the basin and has a wall on its
  seaward face (OSM ways 1334376135, 1334376172, 1334376151).
- **Entrance**: at the west end, between the breakwater tip and the shore. A green starboard
  beacon tower (flashing green, IALA-A) stands on the tip at 28.92029, −13.67609.
- **Basin**: about 320 m east–west and 110 m north–south, between the breakwater and the old
  town shore (coastline way 1334376064 west of the basin, 1334376067 on its north side).
- **Pontoons**: five finger piers run north from the breakwater side, each about 55 m long, at
  longitude −13.67375, −13.67405, −13.67437, −13.67474 and −13.67512 (ways 159173328, …336,
  …331, …342, …339).
- **Quay**: a pier along the north side at about 28.9214, from −13.6748 to −13.6735, with a short
  bridge to the shore (ways 159173350, 347428662, 1334376060). A short pier at the entrance
  (way 359380650) bends from 28.92036, −13.67617 north to 28.92104, −13.67573.

The whole harbour is about 230 × 80 world units, a few pixels of the heightmap, so the terrain
mesh only shows it as a straight piece of coast. The harbour model provides the shape.

**From latitude/longitude to the world**: a small `geoToWorld(lat, lon)` helper, a local flat
projection: x = (lon − lon₀) · cos(lat₀) · 111 320 m · k, z = −(lat − lat₀) · 110 574 m · k.
The origin (lat₀, lon₀ → x₀, z₀) and the scale k (≈ 0.7 units/m) are fitted in step 1 against
two points that can be seen on the model: the harbour and the east end of Los Ajaches at Playa
Quemada. The OSM coordinates are stored in config as they are, so the harbour can be retraced
without converting anything by hand. Existing scenes keep their hand-placed coordinates.

## What we already have

- **Houses**: `HouseGroupCreator` with five formations, terrain-height adaptation in
  `Environment.createHouseNeighborhood`, and `mergeStaticMeshes` to bake a town into a few draw
  calls. `DesertHouse` (white, cubic, flat roof) is already the Lanzarote look.
- **Boats**: `SmallSailBoat`, `FishingBoat`, `Yacht` and `SpeedBoat`, which float through
  `FloatingBehavior`, and `BoatGroupCreator` with `circle` and `random` formations.
- **Sea**: `OceanMaterial` bakes a coast field, so shallows and surf should appear at the new coast
  without extra work.
- **Scene shell**: `famara/index.tsx` (TerrainBase + theme + environment + orbit controls) is the
  template.

## What is missing

1. **No harbour.** There is no quay, breakwater or pier model.
2. **No moored boats.** `random` and `circle` scatter boats on open water; a harbour needs them
   in rows alongside a quay, all facing the same way.
3. **Houses can end up in the sea.** `getTerrainHeight` raycasts onto the whole plane, which also
   covers the seabed (y ≈ −10), so a cluster on the coast puts some houses below water. Positions
   on the seabed need dropping.
4. **Town spots are hardcoded** in `environment.ts` (`LANZAROTE_TOWNS`), all of them in the north.

## Steps

1. **Pin the location and fit `geoToWorld`.** Create the scene with the camera on the estimate
   and temporary markers at the harbour and at Playa Quemada. Compare them with a map: the harbour
   sits at the west end of the town, below the old quarter, with Montaña Tinasoria and the slope
   behind it. Fit the origin and scale until both markers sit right, then remove them. Put
   `geoToWorld` in `src/shared/geo.ts` with a unit test that the two anchors come back where
   they were fitted.
2. **Make the scene.** `src/applications/puerto-del-carmen/` with `index.tsx` and `config.ts`,
   copied from `famara`: theme, island, sea, sky, clouds, a gull flock over the harbour. Register
   it in `src/config/apps.json` as `puertodelcarmen`, route `/puerto-del-carmen`,
   `"visibility": "private"`, so it appears under "Private" in the menu. The first camera is over
   the sea, south of the harbour, at about 250 units high, looking north-west at the harbour, with
   the seafront running off to the right and the slope and volcanoes behind.
3. **Keep houses on land.** In `createHouseNeighborhood`, drop a house whose terrain height is
   below a small threshold (about 2 units), with the land plots and cacti that go with it.
   Famara's towns are inland, so they don't change. Add a unit test.
4. **Build the town from data.** `config.ts` lists the clusters as `TownConfig` entries: a dense
   `grid` for the old town above the harbour, `street` and `suburban` clusters strung along the
   seafront eastward, and a sparse `rural` fringe on the slope. Use mostly `DesertHouse` and
   `DesertHouseWithPool`, with a white-wall palette and green or blue doors and windows, the
   island's building rule. The palette goes in config so it can be tuned. Merge everything as
   `addTownsFromConfig` already does.
5. **Build the real harbour.** Add `scenery/harbour/Harbour.ts`, a low-poly static component
   driven by a data file, `puerto-del-carmen/harbour.json`, that holds the OSM lat/lon polylines
   above, each with a kind: `breakwater` (rock-grey, wide, about 3 units above the sea, with a
   higher wall on the seaward side), `quay` (concrete, lower), `pontoon` (thin, dark wood, just
   above the water) and `beacon` (the green tower on the tip). Each polyline is extruded as boxes
   along its segments after `geoToWorld`. The JSON schema is described in a README next to the
   file. Add the harbour to the Models catalog so it can be checked on the turntable, and merge
   it with the town.
6. **Moor the boats.** Add a `moored` formation to `boat-group-utils.ts`: boats at even spacing
   along a line segment, side by side, all with the same heading, with `enableMovement: false`
   so they only bob. Use one segment along each side of the five pontoons, with the boats'
   bows pointing north, and a row of fishing boats along the north quay. Mostly `SmallSailBoat`
   and `Yacht` at the pontoons and `FishingBoat` at the quay. Check the boat scale against
   the pontoon spacing (about 30 m, ≈ 20 units) so neighbours don't overlap. Outside the
   breakwater, three or four boats use the existing `random` formation with movement on (a
   speedboat, sailboats). Add a unit test for the `moored` positions and headings.
7. **One paraglider over Playa Quemada.** Load a `ParagliderVoxel` the way the Famara scenes do,
   flying a slow figure-of-eight on waypoints along the Los Ajaches ridge above Playa Quemada,
   near the existing `pq` thermal (−6227, 14055), at about the ridge height plus 150 units. Take
   the waypoints and wing colours from `config.ts`. From the default camera it is a small shape
   against the hills to the west, with the town and the harbour in the foreground.
8. **Check it and document it.** Screenshot it with `dev-browser`. Compare frame time and draw
   calls with `famara` using the performance monitor and `?fx=0`. Add the story to
   `docs/README.md` and `CHANGELOG.md`, with the OSM attribution for the harbour.

## Phase 2 (after the static scene looks right)

- **Camera animation**: start low on the water among the moored boats, glide out past the
  breakwater beacon and rise to show the whole seafront strip, then hand over to orbit
  controls. Same structure as `boats-animation/cameraAnimation.ts`.
- **A shot of the Playa Quemada pilot**: the camera follows the paraglider for a moment and then
  turns east down the coast to the harbour.
- **Boat wakes** (idea 9 in [HOME_ANIMATION_IDEAS.md](HOME_ANIMATION_IDEAS.md)) for the moving
  boats.
- **Making it public**, with a screenshot in the README grid.

## Notes for whoever implements it

`environment.ts`, `catalog.ts` and the cloud/rendering files have uncommitted changes from other
work in progress. Re-read them before editing, and stage only your own changes.
