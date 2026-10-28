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

| What | Where |
| --- | --- |
| Terrain mesh | `Island.ts` imports `assets/foundation/models/environment/lanzarote.glb` |
| Terrain scale/offset | `TerrainBase.loadEnvironment`: `scale = 20000`, `position = [0, -10, 0]` |
| Lat/lon → world | `src/shared/geo.ts`: `LANZAROTE_ANCHOR`, `ISLAND_ANCHOR` |
| Ground colours | `src/shared/env/terrain-regions.json` via `terrainRegions.ts` |
| Towns, roads, landmarks, boats | `src/shared/env/environment.ts`, `landmarks.json`, `roads.json` |
| Page titles/descriptions | `webpack.config.js` (`Lanzarote - …`) |

## Phases

### 0. Branch and worktree
- ~~Create `feature/locations` worktree; share the git-crypt key with the main checkout~~ ✅

### 1. A `Location` type, Lanzarote moved into it (no visible change)
- `src/locations/types.ts`: `Location` = `{ id, name, country, loadTerrain(), terrainScale,
  terrainOffset, anchor: GeoAnchor, regions: GroundRegion[], sun: { lat, lon }, views:
  CameraView[], ridges: Ridge[] /* where gliders soar */, wildlife }`.
- `src/locations/lanzarote/index.ts` re-exports today's data (anchors, regions, glb import).
  Data files move only if it keeps the diff small; otherwise they stay and are imported.
- `Island` becomes a generic `Terrain` taking the model URL; `TerrainBase` takes a `Location`
  (default Lanzarote), so every existing app keeps working untouched.
- Check: every existing route renders pixel-identical (screenshots before/after with
  `dev-browser`), unit tests + lint + typecheck green.

### 2. Terrain pipeline for new places
- `3d/dem-to-glb.py`: bbox in → Copernicus GLO-30 DEM (free, AWS open data) cropped and
  resampled to a grid → triangles below 0 m dropped (sea) → GLB in the same slim format as
  `3d/slim-glb.py` (positions + 16-bit indices), scaled so world units match Lanzarote's
  (`unitsPerMetre` 0.74) — gliders and birds stay the right size.
- Writes the matching `GeoAnchor` alongside, so no hand fitting.
- Check: run it on Lanzarote's bbox and compare coastline/peaks with the hand-made model.

### 3. Rio de Janeiro
- Bbox around Pedra Bonita, Pedra da Gávea, São Conrado, Dois Irmãos and the Tijuca forest,
  out to Corcovado and the lagoon (≈ −22.94…−23.03, −43.36…−43.18; confirm on OSM).
- Regions: Tijuca rainforest dark green, granite domes bare grey, beaches pale sand, built-up
  flats grey-ochre.
- Ridge: launch at the Pedra Bonita ramp, soaring the face towards São Conrado, landing on
  Praia do Pepino. Exact coordinates taken from OSM, not guessed.
- Landmarks (later, low-poly): Cristo on Corcovado, Pedra da Gávea's profile is the terrain itself.
- Wildlife: frigatebirds and black vultures instead of gulls/guirres.

### 4. The relax app
- `src/relax/index.tsx` + `webpack.relax.config.js` → `dist-relax/`.
- Picker (Lanzarote, Rio) → one slow scene per place: drifting camera along the ridge, a few
  gliders, sea, birds, time-of-day from the location's sun. No UI chrome once it starts.
- `npm run start:relax`, `npm run build:relax`. Deploy script once the domain is chosen.

### 5. Land it
- Lanzarote site: `npm run build` output and routes unchanged; `deploy-prod` untouched.
- README + `docs/README.md` updated (locations, the second build, the DEM script);
  CHANGELOG entry.
- Merge to `master`, push, remove the worktree and delete the branch.

## Open questions
- Domain and name for the relax app.
- Rio's light: a morning sea-breeze look or golden hour?
