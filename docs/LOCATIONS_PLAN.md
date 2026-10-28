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

### 4. The relax app

- ~~Started as a private route of the Lanzarote build, `relax.html?location=lanzarote |
rio-de-janeiro`: five gliders on the place's loop, camera swaying ±20° over 90 s, drag to take
  over (`src/applications/relax/`)~~ ✅
- ~~Location switcher: one link per place at the bottom, the current one lit~~ ✅
- ~~Camera limits so no terrain edge shows: pan ≤ 3,000 units, zoom out ≤ 1.5× the start,
  orbit ±60° unless the place allows more, camera and its target kept 40 units above the
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
