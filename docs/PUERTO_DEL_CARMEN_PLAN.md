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

1. ~~**Pin the location and fit `geoToWorld`.**~~ ✅ `src/shared/geo.ts`, with
   `LANZAROTE_ANCHOR` at the harbour (−3600, 12600) and 0.74 units a metre, which puts Puerto
   Calero and the turn of the coast at Matagorda where the model has them. The model's coast is
   too coarse for a second anchor to sharpen it, so the harbour's own placement in `config.ts`
   (`HARBOUR_PLACEMENT`) is tuned on screen instead: centre (−3500, 12795), turned 0.24 rad so the
   breakwater's root meets the coast. Tested in `tests/utils/geo.test.ts`.
2. ~~**Make the scene.**~~ ✅ `src/applications/puerto-del-carmen/`, registered as
   `puertodelcarmen`, private. The camera starts at (−2950, 170, 13300), over the sea south-east of
   the harbour, looking north-west at it with the town and the volcanoes behind.
3. ~~**Keep houses on land.**~~ ✅ `removeHousesAtSea()` in `house-group-utils.ts`, called from
   `createHouseNeighborhood`, drops houses whose ground is below 2 units, with their plot, pool
   and garden (now all tagged with their house's position). Tested in
   `tests/utils/removeHousesAtSea.test.ts`.
4. ~~**Build the town from data.**~~ ✅ `TOWN` in `config.ts`: tight 3 × 3 `grid` blocks for the
   old town, blocks of nine along the seafront and a row behind, and a `rural` fringe up the
   slope. `HouseStyle` (`types`, `palette`, `plot`) on a `TownConfig` gives it white
   `DesertHouse`s with green and blue trim on small grey and sand plots. The `random` and
   `suburban` formations crowd houses together at this density, so blocks replaced them.
5. ~~**Build the real harbour.**~~ ✅ `Harbour` component and `harbour.json`, schema in the README
   next to it. The breakwater is a crown on a lower apron of armour rock rather than having a
   seaward wall. 312 triangles, in the Models viewer, merged with the town.
6. ~~**Moor the boats.**~~ ✅ `mooredBerths()` instead of a new formation: berths along a
   segment, centred, offset to one side, bows pointing along it. 30 boats on the pontoons
   (sail boats, yachts and speedboats at about twice life size) and fishing boats on the north
   quay, four more out at sea. `BoatConfig.heading` sets a boat's heading; this also fixed every
   boat's heading being undone by `FloatingBehavior`. Tested in
   `tests/utils/mooredBerths.test.ts`.
7. ~~**One paraglider over Playa Quemada.**~~ ✅ `loadParagliders()` now takes the loop to fly;
   the pilot flies `PLAYA_QUEMADA_LOOP` (a closed loop, not a figure-of-eight) at 440–470 over
   the slopes and the bay. It is about 3.5 km west of the harbour, so it is **not in the default
   view**: orbit west to see it. A shot of it is in phase 2.
8. ~~**Check it and document it.**~~ ✅ Over two frames it draws 123 calls and 389k triangles
   against 108 calls and 975k for `famara`; both hold 120 fps. In `docs/README.md` and
   `CHANGELOG.md` with the OSM attribution.

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
