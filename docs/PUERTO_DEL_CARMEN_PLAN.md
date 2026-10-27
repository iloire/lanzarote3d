# Puerto del Carmen scene: plan

Every scene so far looks at Famara on the north-west cliff. This one goes to the other side of the
island: Puerto del Carmen on the south-east coast. It shows white houses along the seafront and up
the slope behind the old town, and boats in the harbour, some moored at the quay and a few
moving outside it.

It is a new story, `?story=puerto-del-carmen`, built like `famara` (static, orbit controls) so it
can be looked at and tuned first. A camera animation comes in phase 2.

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

1. **Pin the location.** Create the scene with the camera on the estimate and a temporary
   marker. Compare it with a map: the harbour sits at the west end of the town, below the old
   quarter, with Montaña Tinasoria and the slope behind it. Move the coordinates until it
   looks right, then remove the marker.
2. **Make the scene.** `src/applications/puerto-del-carmen/` with `index.tsx` and `config.ts`,
   copied from `famara`: theme, island, sea, sky, clouds, a gull flock over the harbour. Register
   it in `src/config/apps.json` as `puertodelcarmen`, route `/puerto-del-carmen`, private until
   it looks good. The first camera is over the sea, south of the harbour, at about 250 units high,
   looking north-east along the seafront with the slope and volcanoes behind.
3. **Keep houses on land.** In `createHouseNeighborhood`, drop a house whose terrain height is
   below a small threshold (about 2 units), with the land plots and cacti that go with it.
   Famara's towns are inland, so they don't change. Add a unit test.
4. **Build the town from data.** `config.ts` lists the clusters as `TownConfig` entries: a dense
   `grid` for the old town above the harbour, `street` and `suburban` clusters strung along the
   seafront eastward, and a sparse `rural` fringe on the slope. Use mostly `DesertHouse` and
   `DesertHouseWithPool`, with a white-wall palette and green or blue doors and windows, the
   island's building rule. The palette goes in config so it can be tuned. Merge everything as
   `addTownsFromConfig` already does.
5. **Build the harbour.** Add `scenery/harbour/Harbour.ts`, a low-poly static component: a
   breakwater arm that bends round, a quay with steps, a few bollards and a small beacon at the
   tip. It is a handful of boxes made with the `lowPolyMesh` builders, and its size, arm angle
   and colours come from options. Add it to the Models catalog so it can be checked on the
   turntable. It is merged with the town.
6. **Moor the boats.** Add a `moored` formation to `boat-group-utils.ts`: boats at even spacing
   along a line segment (the quay), side by side, all with the same heading, with
   `enableMovement: false` so they only bob. Mostly `FishingBoat` and `SmallSailBoat` with a
   couple of `Yacht`s. Outside the breakwater, three or four boats use the existing `random`
   formation with movement on (a speedboat, sailboats). Add a unit test for the `moored` positions
   and headings.
7. **Check it and document it.** Screenshot it with `dev-browser`. Compare frame time and draw
   calls with `famara` using the performance monitor and `?fx=0`. Add the story to
   `docs/README.md` and `CHANGELOG.md`. Once it is public, add a screenshot to the README grid.

## Phase 2 (after the static scene looks right)

- **Camera animation**: start low on the water among the moored boats, glide out past the
  breakwater beacon and rise to show the whole seafront strip, then hand over to orbit
  controls. Same structure as `boats-animation/cameraAnimation.ts`.
- **Paragliders from Playa Quemada**: the `pq` thermals are just west, so one or two pilots
  over Los Ajaches would tie the scene back to the rest of the project.
- **Boat wakes** (idea 9 in [HOME_ANIMATION_IDEAS.md](HOME_ANIMATION_IDEAS.md)) for the moving
  boats.

## Open questions

- Should the scene be **public in the menu** straight away, or private until phase 2?
- How accurate should the **harbour** be: a generic breakwater and quay, or the real outline
  of Puerto del Carmen's harbour traced from a map?
- Paragliders over Playa Quemada in phase 1, or keep the first version to town and harbour?

## Notes for whoever implements it

`environment.ts`, `catalog.ts` and the cloud/rendering files have uncommitted changes from other
work in progress. Re-read them before editing, and stage only your own changes.
