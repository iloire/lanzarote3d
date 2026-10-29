# Locations: the same visuals, somewhere else

Goal: a calm "pick a place and relax" experience that reuses this repo's sea, sky, lighting,
gliders and birds over other paragliding sites. Lanzarote is the first location, Rio de Janeiro
(Pedra Bonita over São Conrado) the second.

Branch: `feature/locations`, in the worktree `~/code/lanzarote3d-locations`.

## Decisions

- **One repo, two builds.** The engine, the sea, the gliders and the Lanzarote data are shared.
  The Lanzarote site keeps deploying exactly as today (`npm run deploy-prod` →
  3d.lanzaroteparagliding.com, same S3 bucket + CloudFront). The relax app is a second webpack
  entry with its own `dist-relax/` and, later, its own deploy script and domain.
- **Each build bundles only what it imports.** Location terrain is loaded with a dynamic
  `import()`, so the Lanzarote site never downloads Rio and the relax app only fetches the
  place being viewed.
- **Lanzarote's story stays in the Lanzarote apps.** Magne, Bernt, birthdays and the guirres
  are not part of a location; the relax app uses only terrain + generic scene pieces.
- **Split into separate repos/packages only after Rio works**, when the engine boundary is
  proven. Not before.

## Where Lanzarote is hard-coded today

| What                           | Where                                                                    |
| ------------------------------ | ------------------------------------------------------------------------ |
| Terrain mesh                   | `Island.ts` imports `assets/foundation/models/environment/lanzarote.glb` |
| Terrain scale/offset           | `TerrainBase.loadEnvironment`: `scale = 20000`, `position = [0, -10, 0]` |
| Lat/lon → world                | `src/shared/geo.ts`: `LANZAROTE_ANCHOR`, `ISLAND_ANCHOR`                 |
| Ground colours                 | `src/shared/env/terrain-regions.json` via `terrainRegions.ts`            |
| Towns, roads, landmarks, boats | `src/shared/env/environment.ts`, `landmarks.json`, `roads.json`          |
| Page titles/descriptions       | `webpack.config.js` (`Lanzarote - …`)                                    |

## Phases

### 0. Branch and worktree

- ~~Create `feature/locations` worktree; share the git-crypt key with the main checkout~~ ✅

### 1. A `Location` type, Lanzarote moved into it (no visible change)

- ~~`src/locations/types.ts`: `Location` = `{ id, name, terrainModel, terrainScale,
terrainPosition, anchor, regions }` — only what `TerrainBase` reads today~~ ✅
- ~~`src/locations/lanzarote.ts` points at today's data (glb, `ISLAND_ANCHOR`,
  `TERRAIN_REGIONS`); the data files stay where they are~~ ✅
- ~~`Island.load(model, manager)` takes the GLB URL instead of importing Lanzarote's; the unused
  `IslandLegacy` default export is gone. The class keeps its name to keep the diff small~~ ✅
- ~~`TerrainBase` has `protected location = LANZAROTE`, so every existing app is untouched~~ ✅
- ~~Check: the five terrain routes render the same before/after (`dev-browser`; only the
  random clouds and houses differ), typecheck, lint, format green~~ ✅
- Views, ridges, sun and wildlife join `Location` in phase 4, when the relax app needs them.
- Note: `tests/rendering/cloudGeometry.test.ts` (3 tests) already fails on `master`; unrelated.

### 2. Terrain pipeline for new places

- ~~`3d/dem-to-glb.py`: Copernicus GLO-30 tiles (public AWS bucket, cached in `3d/dem-cache/`)
  sampled on a regular grid → slim GLB (positions + 16-bit indices) in world units, 0.772 per
  metre like Lanzarote, heights stretched by `verticalExaggeration`; ground ≤ 0 m becomes sea
  floor under the water~~ ✅
- ~~No generated anchor file: the script and `src/locations/dem.ts` read the same location JSON,
  and the anchor is the centre of its bbox~~ ✅ Schema in `src/locations/README.md`.
- ~~Check: summits spot-checked against the DEM and OSM — Pedra Bonita 696 m (real 693), beach
  4 m, lagoon 1 m; steep domes lose 70–80 m to the 30 m radar model~~ ✅
- Not done: rebuilding Lanzarote from the DEM to compare with the hand-made model. Not needed
  while Lanzarote keeps its own model.

### 3. Rio de Janeiro

- ~~`src/locations/rio-de-janeiro.json`: bbox −23.04…−22.935, −43.4…−43.145 (Barra to the
  Sugarloaf, Pico da Tijuca on the north edge), 100 m grid, 1.5× heights~~ ✅
- ~~Regions: Tijuca forest green, granite tops grey (Pedra da Gávea, Dois Irmãos, Corcovado,
  Sugarloaf), Barra and the Zona Sul grey~~ ✅
- ~~Soaring loop on Pedra Bonita's east face, 580–670 m, ≥ 100 m over the ground; launch, landing
  and peaks from OSM (Nominatim)~~ ✅
- ~~Camera high over the sea off São Conrado; cumulus over Tijuca, Corcovado and Pedra Branca~~ ✅
- ~~Rainforest over Tijuca and the massifs below their bare tops; high-rises in São Conrado,
  Leblon, Ipanema, Copacabana, Lagoa, Botafogo and Barra; Rocinha and Vidigal up their
  hillsides; houses in Joá and Itanhangá; full orbit~~ ✅
- ~~Cristo Redentor on Corcovado: low-poly soapstone figure on its pedestal, at 2× like the
  Lanzarote landmarks, facing the bay; in the models catalog too~~ ✅ (a grey region there read as haze on the hillside, so it was
  dropped), Cristo on Corcovado, frigatebirds and black vultures.

### 3b. Tenerife (curated)

- ~~`src/locations/tenerife.json` → `assets/locations/tenerife.glb`: Adeje, Los Cristianos to El
  Teide (28.05…28.32, −16.8…−16.58), 100 m grid, heights unstretched (Teide reads 3,692 m)~~ ✅
- ~~Taucho takeoff and La Caleta landing from OSM (Overpass `free_flying:site`); loop over the
  slope around the takeoff at 1,000–1,100 m, ≥ 187 m clear~~ ✅
- ~~Camera on the line from El Teide through the loop, so Teide stands behind the gliders;
  pine belt green, Las Cañadas and the cones dark~~ ✅
- ~~Towns from OSM (Adeje, Fañabé, Costa Adeje, Playa de las Américas, La Caleta, Armeñime,
  Playa Paraíso, Callao Salvaje, Taucho, Ifonche); pines in the Corona Forestal, cardones and
  boulders on the dry slopes, rocks in Las Cañadas (`shared/env/scatter.ts`, instanced)~~ ✅
- ~~Full orbit so the viewer can turn to the beach; panning held within 3,000 units~~ ✅
- ~~Costa Adeje, Fañabé and Las Américas as resort blocks: long white hotels and apartments of
  three to six floors under terracotta roofs~~ ✅

### 3d. El Hierro (curated)

- ~~`src/locations/el-hierro.json` → `assets/locations/el-hierro.glb`: the whole island with sea
  all round (27.61…27.88, −18.19…−17.86), 125 m grid to stay within 16-bit indices, heights 1.5×
  so El Golfo's 1,300 m cliff reads~~ ✅
- ~~Takeoffs on the rim (Dos Hermanas, El Salvador, Montaña Colorada, Pico de la Naranja) and the
  two landings in Frontera from OSM (Overpass `free_flying:site`); ridge loop along the
  north-facing cliff at 1,200–1,350 m, ≥ 162 m clear~~ ✅
- ~~Camera high over El Golfo looking south at the cliff; free zoom out (8×) and pan like
  Lanzarote; cloud base 1,700 m~~ ✅
- ~~El Pinar's pines, laurel along the rim, lava round La Restinga; Frontera, Valverde, El Pinar,
  La Restinga and the hamlets~~ ✅

### 3c. Castejón de Sos (curated)

- ~~`src/locations/castejon-de-sos.json` → `assets/locations/castejon-de-sos.glb`: the Ésera
  valley from El Turbón to Benasque (42.4…42.63, 0.4…0.62), 100 m grid, heights unstretched~~ ✅
- ~~Liri and Rials takeoffs and the Castejón landing from OSM (Nominatim); loop in front of the
  Liri takeoff (2,312 m) at 2,400–2,560 m, ≥ 139 m clear~~ ✅
- ~~Camera over the valley above Arasán, looking down onto the takeoff with Gallinero behind;
  cloud base 3,100 m (`cloudBase`), above the peaks~~ ✅
- ~~Meadow green over the valley, pine and fir on the slopes, limestone tops on Gallinero and El
  Turbón; Castejón, Benasque, Cerler and the Ésera hamlets as stone houses under slate (a
  `village` scatter kind)~~ ✅

### 3e. New York (curated)

- ~~`src/locations/new-york.json`: Midtown Manhattan river to river, 34th Street to 79th
  (40.744…40.781, −74.012…−73.96), at 6 units a metre (about 8× Lanzarote) so the voxel
  paramotors, as big as they are, fit the 27–30 m avenues~~ ✅
- ~~Ground from the DEM laid flat (`flatLand`, 6 m): the Copernicus model is a surface model and
  would carry the rooftops; the rivers stay water~~ ✅
- ~~Buildings from OpenStreetMap (Overpass, cached in `3d/osm-cache/`) by `3d/city-to-glb.py`:
  16,797 footprints, 95% with a real height, as 3 m voxels on a grid turned 29° to the street
  grid, merged roofs and walls only where neighbours differ, coloured per vertex (brownstone and
  brick low, limestone mid, glass high); 209k triangles, 8.8 MB~~ ✅
- ~~Paramotors instead of paragliders (`paramotor`): first five pilots, now only Abel, fly a loop
  at 106 m up 5th Avenue, round over the bottom of Central Park, down 6th Avenue and back across
  Bryant Park; the script checks the loop's curve keeps 10 m either side clear (41 m over the
  Library, the lowest)~~ ✅
- ~~Camera low over Bryant Park looking up the avenues; Central Park and Bryant Park green~~ ✅
- ~~Windows drawn in the shader on the voxel grid (punched in masonry, curtain walls on towers)~~ ✅
- ~~Only Abel's paramotor, chased along his own path (`pathTrail.ts`), at twice a wing's speed~~ ✅
- ~~Street layer (roads, sidewalks, crosswalks, parks, ponds) as one textured quad, cars on its lanes~~ ✅
- ~~Fog to fade the city's far edge (`fog`)~~ ✅
- Not done: Central Park's trees, the rest of Manhattan.

### 3f. Giza (curated)

- ~~The plateau from the Copernicus surface model at 15 m, at New York's 6 units a metre and no
  height stretch, so the pyramids keep their true shape; `flatten` pads lay flat the ground under
  each pyramid (its base plus 40 m, at the median round its edge: Khufu 61.6 m, Khafre's terrace
  70.7 m), the Sphinx's enclosure and the town, whose rooftops the model carries~~ ✅
- ~~`3d/giza-to-glb.py`: the three pyramids and their seven satellites course by course (203 on
  Khufu), each course a step a little in from the slope; Khafre's casing cap, its granite first
  course, Menkaure's granite casing and north-face gash, the step pyramids G3-b and G3-c,
  Khentkawes' two-step tomb, Khufu's summit mast~~ ✅
- ~~The Sphinx from blocks, the three causeways, and every other OpenStreetMap footprint on the
  plateau raised (some 1,100: the mastaba fields, temples, the Wall of the Crow)~~ ✅
- ~~Nazlet el-Samman, which OpenStreetMap barely maps, made up: 11,000 plots of brick and
  concrete on a 3 m grid, meshed and windowed with New York's mesher and window shader~~ ✅
- ~~A stone shader draws each course's blocks (`stoneCourses.ts`)~~ ✅
- ~~Abel's paramotor tour at 12.5 m/s (`paramotorSpeed`), an oval along the line of the
  pyramids, morning sun, a sand plain to the horizon instead of the sea (`plain`)~~ ✅
- Not done: palms and fields in the valley, the Grand Egyptian Museum to the north, camels.

### 3g. Paris (curated)

- ~~`src/locations/paris.json`: the Eiffel Tower and round it, Trocadéro to the École Militaire
  (48.8485…48.868, 2.2795…2.3095), at 6 units a metre like New York, ground laid flat at 35 m~~ ✅
- ~~9,047 buildings from OpenStreetMap as 3 m voxels on a grid turned 44°, square to the tower's
  faces, the Champ de Mars and the quays; cream limestone under zinc roofs (`city.facades`,
  `city.roof`), no yellow cabs (`city.taxis`)~~ ✅
- ~~The Eiffel Tower built by `city-to-glb.py` (`city.eiffelTower`): 1.5 m voxels to its real
  profile, hollow legs braced in X, the arches, three floors, cabin and spire; 67k triangles~~ ✅
- ~~The Seine from its multipolygon (relation members joined into rings), road bridges over it~~ ✅
- ~~Abel's paramotor laps the tower at 125 m, 110 m off its axis, so the chase keeps it in view~~ ✅

### 3h. Mont-Saint-Michel (curated)

- ~~`src/locations/mont-saint-michel.json`: the bay from the Carolles cliffs to the polders
  (48.595…48.765, −1.66…−1.40), 3 units a metre, true heights~~ ✅
- ~~Flats, channels, sandbanks, creeks and salt meadows made by `3d/mont-saint-michel-to-glb.py`
  (the DEM has the bay at sea level), with a bay texture for the ground and the water's depth~~ ✅
- ~~The Mount from OpenStreetMap plus a drawn abbey church and spire; Tombelaine; stone, windows,
  slate and gilding in the shader~~ ✅
- ~~A tide that floods in faster than it ebbs, over the sand and round the Mount, wet sand drying
  after it, the open sea following; a gauge on screen; `?tide=` to start anywhere in it~~ ✅
- ~~Sheep on the salt meadows, a guided walk across the sand that leaves ahead of the water,
  paramotors circling the spire, the camera orbiting the Mount at golden hour~~ ✅
- Not done: gliders off the Carolles cliffs; shuttles on the bridge; the walkers jump back to
  the start when their path wraps.

### 4. The relax app

- ~~Started as a private route of the Lanzarote build, `relax.html?location=lanzarote |
rio-de-janeiro`: five gliders on the place's loop, camera swaying ±20° over 90 s, drag to take
  over (`src/applications/relax/`)~~ ✅
- ~~Location switcher: one link per place at the bottom, the current one lit~~ ✅
- ~~Camera limits so no terrain edge shows: pan ≤ 3,000 units, zoom out ≤ 1.5× the start,
  orbit free all the way round in every place, camera and its target kept 40 units above the
  ground, panning along the ground~~ ✅
- ~~Its own build from the same webpack config: `SITE=relax` → `dist-relax/`, only the apps
  whose `site` in `apps.json` is `relax`, opening on the relax scene with no menu. The Lanzarote
  build leaves out the relax app and `assets/locations/`~~ ✅
- ~~`npm run start:relax`, `npm run build:relax`; CI builds both sites~~ ✅
- Deploy script once the domain is chosen.
- Later: time of day from the location's sun.

### 5. Anywhere: a place generated in the browser

- Curated places stay the showcase; this adds a generated mode on top. A generated place uses
  the same location JSON shape, so a good one can be saved as curated.
- Elevation from AWS Terrain Tiles (terrarium PNGs, global ~30 m, CORS open — checked);
  Copernicus stays build-time only (its bucket has no CORS). ~8 tiles / ~200 KB for a Rio-sized
  area; `dem-to-glb.py`'s grid logic ported to TypeScript, building the geometry directly.
- Search a place with Nominatim (CORS open; 1 req/s and attribution, so Photon or a paid
  geocoder if traffic grows).
- Automatic: height stretch from the area's relief, clouds over high ground, camera on the low
  side, gliders thermalling over the point at ground + 300 m, clearance checked on the grid.
- Colours from height and slope first.
- Follow-ups: ridge loops at real launch sites (paraglidingearth.com database; check its API
  terms), real ground colours (ESA WorldCover or averaged Sentinel-2 imagery; check licences),
  lakes and rivers from OSM water outlines.

### 6. Land it

- ~~Lanzarote site: `npm run build` output and routes unchanged (same files as `master`, no
  `relax.html`, no other places' terrain); `deploy-prod` untouched~~ ✅
- ~~README + `docs/README.md` updated (locations, the second build, the DEM script);
  CHANGELOG entry~~ ✅
- ~~Merge to `master`, push, remove the worktree and delete the branch~~ ✅

## Open questions

- Domain and name for the relax app.
- Rio's light: a morning sea-breeze look or golden hour?
