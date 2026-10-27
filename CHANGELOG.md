# Changelog

All notable changes to the Lanzarote 3D project will be documented in this file.

## 2026-10-27 11:04 UTC

### Added
- **Roller pilots fly wingovers**: anyone on a roller flies the ridge loop 40 lower and 1.7× as fast (was 1.5×), weaving 60 to each side every 8 s, banking up to 60° as they turn back at each end, where they climb 30, and diving through the middle. `ROLLER_FLIGHT` in the home config holds the numbers; `ParagliderMotion` flies the wingover on top of the path

## 2026-10-27 10:59 UTC

### Changed
- **David flies an Ozone Delta 4**: blue at the front and red behind, split by a yellow line along the span that steps forward round a red bump in the middle, over a red underside (`DAVID_DELTA`)
- **Franz flies an Ozone Buzz Z6**: lime across the middle, then out towards each tip a thin white line, a grey band and blue tips, nose to tail, over a white underside (`FRANZ_BUZZ`)

## 2026-10-27 10:58 UTC

### Changed
- **The roller is slimmer**: its chord is cut by a sixth and its span stretched a little, so it reads as a long, slim wing; it keeps about 0.6 of the Rush's area

## 2026-10-27 10:54 UTC

### Changed
- **The roller is plainly the smaller wing**: 0.65 of the Rush's area, as a 16 m² roller is against the 24-26 m² wings flown here, on shorter lines and with fewer cells of the same width
- The model viewer has **Wings side by side**: the standard wing, the Rush and the roller in a row at the same scale

## 2026-10-27 10:53 UTC

### Changed
- **Miguel flies the pink roller** (`PURPLE_ROLLER`) instead of the green one, which Luc keeps

## 2026-10-27 10:50 UTC

### Added
- **Five more pilots on the Famara ridge**, from `3d-characters`, so ten fly the home scene: David on a blue Ozone Rush with a white swoosh, Luc on the green roller like Miguel's, Fabio on a pink Niviuk Ikuma (black tips edged by a thin white line, a white flash further in, a pale underside), Bernt on the same lime Rush as Magne's (on the shared loop, below Magne) and Franz on a sky-blue wing with pink tips. Each starts at its own point on the loop with its own offset, all below Magne's loop

### Changed
- **Ivan, Magne and Roos re-exported** from `3d-characters`: Ivan's gunmetal helmet with red panels, camera mount and devil horns, and Magne and Roos in the Charly No Limit full-face helmet

## 2026-10-27 10:41 UTC

### Fixed
- **The roller is flat**, as the real one is: its arc only shortens the span about 11% (it was nearly a half circle), and it is sized from Niviuk's data, flat aspect ratio 4.3 and three quarters of the Rush's area, instead of half the area on a stubby plan

## 2026-10-27 10:39 UTC

### Added
- **Wing models**: `GliderOptions.kind` picks the canopy's shape from `WING_SHAPES` in `Glider.ts`: `standard` (the default), `rush` (Ozone Rush: a touch more chord, deeper arc) and `roller` (Niviuk Roller, a speed wing: about half the area, thin flat section, short lines, a nearly rectangular plan with square tips and an even, almost half-circle arc). A roller flies 1.5× faster in the home scene and Puerto del Carmen (`gliderSpeedFactor`)
- **Wing designs from the real ones**: `GliderOptions.patches` paints straight bands on the top surface, `undersideColor` the lower surface and `stripeChord` how far back the tip stripes run. `ozoneRush()` and `niviukRoller()` in the home config draw each model's design in any colours
- Ivan flies a red Rush (navy swoosh, yellow hooks), Jehosua a black Rush with a red swoosh, Magne a lime Rush (deep blue swoosh, steel blue hooks), Miguel the green roller
- The model viewer (`?story=models`) shows the bare wings: standard, Ozone Rush, roller green and purple

### Changed
- The canopy profile has 12 points per rib instead of 8, so the bands keep their shape across the chord

## 2026-10-27 10:09 UTC

### Added
- **Magne joins the home pilots**: his voxel model from `3d-characters` (blue full-face helmet, blue jacket, black cocoon) under a lime Ozone Rush with navy stripes near the tips. He is the best of them, so he flies a loop of his own, the ridge loop raised 130 m and widened 1.5× (`liftLoop(130, 1.5)`): 1005–1067 m against the others' 875–977 m, 6.4 km a lap against 4.3 km, at least 267 m over the terrain, and farther out than the hang glider's
- **Glider stripes**: `GliderOptions.stripeColor` paints two stripes across the front of each wingtip, top and bottom; wings without it are unchanged
- A paraglider config can carry `waypoints` of its own instead of the shared ridge loop

## 2026-10-27 09:35 UTC

### Added
- **Puerto del Carmen opening shot**: 36 s from the paraglider over Playa Quemada, east down the coast, low past the green beacon on the breakwater, in among the moored boats and up to the overview of the town, where the orbit controls take over. A click or scroll ends it early; `?intro=0` skips it. Its keys are `INTRO_SHOT` in the scene's `config.ts`
- **Boat wakes**: every moving boat, in every scene, leaves a V of foam opening at the Kelvin angle (19.5°) and a wash astern, fading out three boat lengths behind

### Fixed
- **Moving boats sailed backwards**: the boat models point their bows along −z, but movement turned their +z (sail boats, fishing boats) or +x (yachts, speedboats) towards where they were going, so they went stern-first or crabbed sideways. `MovingBehavior` has a `-z` forward axis now and every boat uses it
- **Boats out at sea in Puerto del Carmen** were drawn at the other scenes' size, twice that of the moored ones; they now match

## 2026-10-27 09:18 UTC

### Added
- **Puerto del Carmen scene** (`?story=puerto-del-carmen`, private, in the menu's Private list): the island's south-east coast for the first time. White houses with green and blue trim in blocks along the seafront and packed above the harbour, the real harbour traced from OpenStreetMap (breakwater, west entrance with its green beacon, five pontoons, north quay; © OpenStreetMap contributors, ODbL), 30 boats moored along both sides of the pontoons and fishing boats at the quay, four more out at sea, gulls over the harbour, and one paraglider soaring the Los Ajaches slopes above Playa Quemada
- **`geoToWorld`** (`src/shared/geo.ts`): latitude/longitude to scene x/z, fitted on the model at Puerto del Carmen's harbour (0.74 units a metre)
- **`Harbour` component**: breakwaters, quays, pontoons and beacons built from polylines as one low-poly mesh; in the Models viewer
- **Moored boats**: `mooredBerths()` lines boats up along a pontoon or quay with a shared heading; `BoatConfig.heading` sets a boat's heading
- **Town styles**: a `TownConfig` can carry its own house mix, colours and plot size and colour (`HouseStyle`)

### Fixed
- **Houses in the sea**: a town on the coast put houses on the seabed under the water, because the island model carries on under the sea. Houses whose ground is below 2 units are now left out, with their plot, pool and garden
- **Boat headings were lost**: `FloatingBehavior` kept the rotation a boat had when loaded and swayed about it, so the random heading given afterwards was undone and every boat faced the same way

## 2026-10-27 09:10 UTC

### Changed
- **Cloud bases are slightly darker**: the underside colour (`clouds.base`) goes from `#8b98b0` to `#77849c`, about 12 % darker, like the grey base of a cumulus over a good thermal; the tops and sides are unchanged

## 2026-10-27 08:54 UTC

### Changed
- **The clouds are low-poly cumulus with flat bottoms, shaded like clouds**: they used to be loose piles of grey icosahedrons in four random greys, lit like rocks, and rotated so they stood as towers. Now each cloud is lobes stacked in narrowing layers and cut flat at a cloud base shared across the island, just above the thermals. Puffs are wide and low; the super thermal gets a tower. One shader shades every cloud: white where faces turn to the sun, blue-grey away from it, darker on the flat undersides, a silver edge when looking towards the sun, and warmer as the sun gets low. They fade into the horizon haze with the fog. Each cluster is one merged mesh and one draw call, and the breathing and bobbing moved from a JavaScript ticker into the vertex shader. The colours are theme fields (`clouds.light`, `shade`, `base`, `rim`, `brightness`); the unused `colors`, `density` and `opacity` are gone. The Models viewer gains a `cloud-tower`. Tests cover the flat base, the shapes, the normals and the heights

## 2026-10-27 08:14 UTC

### Docs
- **The README shows four more scenes and has a shorter intro**: the Hercules, Famara static, Town and the Models viewer sit in a grid of screenshots under the home one, taken with the menu and dev panels hidden. The home screenshot is retaken too: the old one showed the flat wings from before the pilots hung under arched canopies. The intro is now two lines and leaves out the pilots' names

## 2026-10-27 08:41 UTC

### Changed
- **The home camera keeps La Graciosa and the ocean behind the pilots**: after the intro it auto-rotated all the way round them, so for much of each turn the Famara cliff filled the frame. Now it sways gently, ±18° there and back in a minute, about a line from the lead pilot to La Graciosa turned 5° seaward, so Famara beach, the bay, Graciosa and open ocean stay in the background and the cliff only frames one side. It eases in from where the intro lands and stops when you take the controls, as the auto-rotate did. Tuned by `CAMERA_SWAY` and `LA_GRACIOSA` in `home/config.ts`

## 2026-10-27 07:57 UTC

### Changed
- **The home camera follows the lead pilot on a spring, not rigidly**: it used to add the pilot's every movement straight to the camera, bolting the two together and passing on the jitter of the pilot's own update loop. Now a critically damped spring (settling in 1.2 s) chases a point 2 s along the pilot's flight, so the camera eases into the pilot's moves, aims about 12 m ahead of them and swings into turns early, without overshooting. It also rolls with a quarter of the pilot's bank. Orbiting and zooming work as before, and the settings are `CAMERA_FOLLOW` in `home/config.ts`

## 2026-10-27 00:36 UTC

### Changed
- **The island ground is faceted low poly**: each triangle of the solid ground under the wireframe is now one flat colour, flat-lit, instead of a smooth height gradient, so the plateau and cliffs no longer read as one even brown. Per-face data (centre height, flatness, a seeded random) is baked once at load in `bakeFaceShading`; the shader brightens level faces, darkens steep ones and jitters each face's tone a little. Strengths are theme fields (`underlay.slopeShade`, default 0.25, and `underlay.faceJitter`, default 0.12), no cost per frame

## 2026-10-27 00:29 UTC

### Changed
- **The town buildings are rebuilt low poly and lighter from afar**: each building is one flat-shaded, vertex-coloured mesh sharing a single material, so a whole town merges into one draw call for its buildings (the Famara scene's town now merges into 18 meshes instead of 26). The towns use ULTRA_LOW, which is now just massing and roof, because no window survives that distance: 10 to 26 triangles a building, about 21 on average across the town mix, against about 25 for the old two-box versions
  - **Townhouse**: three storeys under a flat roof behind a parapet; closer up, a window grid, cornice, string course, doorstep, chimney, shutters, a balcony and a rooftop water tank
  - **House**: a two-storey hip-roofed main block with lower wings (flat roofs for the modern type); closer up, framed and shuttered windows, a porch canopy and a chimney
  - **Villa**: a broad ground floor whose roof is a terrace, with a hip-roofed upper floor set back on it; closer up, picture windows, a columned portico, a front terrace and palms
  - **Barn**: a gambrel roof; closer up, braced double doors, a hayloft door, side windows, a silo and hay bales
  - **Desert house**: two flat-roofed Lanzarote cubes; closer up, the white island chimney, a courtyard wall with a gate, a pergola and a palm
  - **Desert house with pool**: the same house with a pool on a deck behind it; closer up, a tiled coping, sun loungers and a parasol
  - Every LOD shares one builder that adds detail level by level: LOW doors and windows, MEDIUM frames, trim and chimneys, HIGH shutters, balconies and props. At HIGH the buildings are lighter than before, except the barn: 200, 220, 218, 126, 178 and 246 triangles, where the old ones had 324, 680, 276, 60, 936 and 3,096
  - The villa's unused `size` and `rooms` options are gone
- **Merging keeps vertex colours**: `mergeStaticMeshes` dropped every attribute but position, normal and uv, so vertex-coloured meshes merged into one flat colour; it now keeps `color` when the material uses vertex colours
- **Models scene `?lod=`**: `ultra_low`, `low`, `medium` or `high` sets the detail of buildings and cacti (HIGH by default)

## 2026-10-27 00:13 UTC

### Changed
- **Paraglider pilots swing under their wings**: wing and pilot used to bank as one rigid piece. Now the pilot hangs from the carabiners on a spring-damped pendulum: the wing rolls into a turn first, the pilot trails, swings out past it by about 10°, and settles in line with the banked wing within a few seconds; rolling out swings the pilot the other way. Speeding up along the path swings the pilot back and slowing down swings it forward. `ParagliderVoxel` exposes the pivot (`getPilotSwing()`), and `ParagliderMotion` drives it with two extra rotations per pilot. The hang glider is unchanged

## 2026-10-27 00:00 UTC

### Changed
- **The clouds share one animation loop**: each cloud ran its own `requestAnimationFrame`, about 40 of them, plus a 3-second timer that started two tweens per cloud part. Now one loop poses every cloud, and the bob and breathing are sines around the rest pose, so clouds no longer drift by an amount that depends on the frame rate and their parts no longer wander apart over time
- **The home loop steps by the frame's own timestamp, capped at 0.1 s**, so pilots no longer jump after you switch back to the tab, and the smoke trails reuse their vectors instead of allocating per frame
- **Production no longer runs an empty `requestAnimationFrame` loop**; it only ever ticked the dev FPS panel
- Together these halve the callbacks per frame on the home scene, 84 to 39; script time and frame rate are unchanged within noise. Numbers and the ideas list are in `docs/HOME_ANIMATION_IDEAS.md`

## 2026-10-26 23:54 UTC

### Changed
- **The boats are rebuilt low poly**: each hull is lofted through stations from transom to a raked stem and painted in bands, with a sheer line, topsides, a boot stripe at the waterline and antifouling below
  - **Small sail boat**: a cruiser with a teak deck, a coachroof with portlights, and a sloop rig of mast, boom, mainsail and jib with stays, shrouds and bow rails. The sails are now off-white (they were grey)
  - **Fishing boat**: a Canarian trawler in blue with white stripes. It has bulwarks round the working deck, a wheelhouse forward with a window band under an overhanging roof, radar, a mast with trawl booms, a stern A-frame, and fish crates, floats and nets aft. The mast is now light grey (it was brown)
  - **Speed boat**: a deep-V hull with a black stripe and white bottom, an open cockpit behind a wraparound windscreen, a helm console, bucket seats, a stern bench, bow rails and twin outboards
  - **Yacht**: a motor yacht with dark hull windows, a teak aft deck and swim platform, a glazed saloon, a flybridge edged in the trim colour with the helm under a hardtop and radar mast, a bow sunpad and rails all round
  - Each boat is one flat-shaded mesh in a single draw call: 344, 476, 572 and 686 triangles. The old boats were only a few boxes (18, 316, 104 and 364 triangles), so these are more detailed and somewhat heavier, but still low poly. Sizes and colour options are unchanged
- **One low-poly builder for planes and boats**: `lowPolyMesh.ts` moves to `components/base` and gains boxes and rods; the boats add `scenery/boats/lowPolyHull.ts` for hulls, rails and sails
- **The Models scene holds boats still**: the speed boat, yacht and sail boat sailed off on their movement patterns and out of frame, and floating sank every boat into the grid

## 2026-10-26 23:42 UTC

### Changed
- **The Cessna looks like a 172, still low poly**: a cowled nose with a spinner and a two-blade propeller, a cabin with a wraparound windscreen, side and rear windows, a high wing that tapers outboard and is braced by struts, a slim tailcone with the cheat line (`stripeColor`) running nose to tail, a swept fin with a dorsal fillet and a coloured cap, and fixed tricycle gear on spring legs with wheel fairings. Replaces a stack of boxes. It is one flat-shaded, vertex-coloured mesh, 660 triangles in 1 draw call where the old one had 1,148 in about 30. It keeps its 12-unit span but is shorter, 9.6 long instead of 13, which matches a real 172
- **The aircraft share one low-poly builder**: `vehicles/aircraft/lowPolyMesh.ts` does the lofting, the airfoil surfaces, struts, spinners and propellers, and holds the one shared material. The Hercules now uses it too and looks the same

## 2026-10-26 23:38 UTC

### Changed
- **The Hercules looks like a C-130, still low poly**: a blunt radome nose with a tinted windscreen, round-sided fuselage sweeping up at the tail over a darker loading ramp, main-gear sponsons, a high wing with a constant-chord centre section and tapered outer panels, four nacelles with chin intakes, six-sided spinners and pitched four-blade props with banded tips (`stripeColor`), and a tall fin with a dorsal fillet. Replaces a stack of boxes and cylinders. It is one flat-shaded, vertex-coloured mesh, 768 triangles in 1 draw call where the old one had 2,068 in about 60. The gear is retracted because the plane is only ever seen flying, and it is a little larger: 27 × 36 units, up from 30 wide

## 2026-10-26 23:36 UTC

### Changed
- **The hang glider is a real flex wing and flies in the home scene again**: a billowed delta sail with a dark leading edge band on swept leading edges, keel, crossbar, kingpost and a triangular control frame, braced by flying and landing wires, with the pilot prone in a pod harness and hands on the basebar. It is 10 m across like the paragliders; the old one was a straight extruded airfoil ten times their size. It flies the ridge loop raised 110 m and widened by a quarter, at twice the paragliders' speed, and banks into turns with them. Its config is just scale, speed and loop; the unused wing design types and wing options are gone

## 2026-10-26 23:25 UTC

### Added
- **Models scene** (`?story=models`, private, in the dev menu): every model the scenes place, one at a time on a turntable, framed to its size, with its dimensions and triangle count. Pick from the list or step with ← / →, space toggles the spin, and `?model=<id>` links straight to one. Paragliders, Cessna and Hercules come from the home scene's config, so they look as they do there; the catalog is `src/applications/models/catalog.ts`
- **`Gulls` `spread` option** (default 1, unchanged in the scenes) scales how far a flock scatters and drifts, and the flock's bounding box now includes the circles the shader flies, so the viewer can frame it

### Changed
- **Paraglider wings have a real paraglider shape**: the canopy is lofted through cambered airfoil ribs on an arc that stays flat in the middle and curls down at the tips, with an elliptical planform, a swept leading edge, billowing cells and dark inlets. `wingColor2`, set per pilot but never drawn, now colours the wingtips. Lines cascade from A, B and C rows into junctions and risers, and the brakes fan from the outer trailing edge to the pilot's hands. The old wing was a lopsided staircase of boxes with six lines a side
- **Removed the paraglider brake controls** (`ParagliderVoxel.left()`/`right()`, `Glider.breakLeft()`…) and the unused glider options (`breakColor`, `lineFrontColor`, `lineBackColor`, `carabinersSeparationMM`, `bandLength`): nothing called them since the flyable game went

## 2026-10-26 23:24 UTC

### Added
- **GitHub Actions CI** (`.github/workflows/ci.yml`) on every push to `master` and every pull request: `npm ci`, Jest, lint, format check, type-check and the production build, with the git-crypt `.env` removed first since CI has no key. Its badge heads the README

### Changed
- **Prettier is checked once, by Prettier**: `eslint-plugin-prettier` is gone, so lint no longer reports formatting a second time as errors; `npm run format` / `format:check` now cover `tests/`, the root config files and the CI workflow as well as `src/`, and those files are formatted. `package-lock.json` is ignored

### Fixed
- **The boats and famara animation files follow the Prettier style** — four were committed unformatted — and `loadParagliders` no longer takes an `animationDurationMs` it never read, the one lint error on master

## 2026-10-26 23:16 UTC

### Changed
- **The entry setup runs once**: `src/index.tsx` alone imports `index.css` and turns on `THREE.Cache` (`app.tsx` repeated both), `getStoryName()` loses three branches that all returned `home`, and the `export default {}` webpack placeholder is gone

### Removed
- **Dead types and helpers**: `foundation/types/components.ts`, `config.ts`, `systems.ts` and their barrel (none of their interfaces were used; `VehicleConfig` was only re-exported), the unused LOD helpers and tables in `foundation/types/lod.ts` (only the `LevelOfDetail` enum and `getLODFromLegacy` are used), `getCharacterAssetPath` / `createCharacterFolder`, `isThreeComponent`, `PartialTheme` and the registry's `getApp`

## 2026-10-26 23:08 UTC

### Removed
- **Unused dependencies**: `ajv`, `react-ga4`, `stylus`, `stylus-loader`, `@testing-library/react`, `jsdom`, `source-map-loader`, `file-loader`, and the Babel toolchain (`babel-loader`, `@babel/*`, `.babelrc`) that only fed the dead `.jsx` rule. Also `.yarnrc.yml`, since the project installs with npm

### Fixed
- **Jest maps CSS imports to `identity-obj-proxy`**: the key was misspelled `moduleNameMapping`, so Jest ignored it and any test importing a component with a stylesheet would have crashed. `jest-environment-jsdom` is now on 29, matching `jest`, instead of 30
- **Webpack config holds only rules that do something**: the `.jsx` babel rule (no `.jsx` files, and it named a plugin that was never installed), the stylus rule (no `.styl` files) and the overwritten `showcaseApps` export are gone; images use webpack 5's `asset/resource` instead of the deprecated `file-loader`

### Changed
- **Every page loads one shared `main.bundle.js`** instead of its own copy: the five app entries all pointed at `src/index.tsx`, so the build emitted five identical ~1 MB bundles and a visitor moving between scenes downloaded the same code again under another name. Each scene's code still loads as its own lazy chunk

## 2026-10-26 23:01 UTC

### Changed
- **The scene menu has two sections**: the public scenes, plus a "Private" section in dev mode. The always-empty Tools and private Experiences sections are gone, as are the duplicate `showDev`/`showPublic` props, the `tool` category and the unused `getAppsByCategory`/`getVisibleApps` registry helpers. Desktop and mobile layouts render the same section list

### Fixed
- **Home is listed first in the menu** — its priority 0 was treated as missing and sorted it last

## 2026-10-26 22:51 UTC

### Added
- **`?dev=1` turns on dev mode** in this browser (`?dev=0` turns it off): the menu lists the private scenes (famara, town) and the sidebar shows on every scene, home included. `enableDevMode()` / `disableDevMode()` are now defined on localhost too, where they used to be missing. The logic lives in `src/devMode.ts`

## [Unreleased] - 2026-10-26 23:05 UTC

### Removed
- **Themes.** The default look is the only one: the menu's Themes buttons, `ThemeManager` (switching and the saved choice), the Golden Hour, Arctic Winter, Storm, Autumn and Natural presets, and the per-app `theme` field (static Famara asked for a misspelt `artic` that never applied) are gone. `ThemeEngine` still applies `DEFAULT_THEME`; the presets are in git history if one is wanted back

## [Unreleased] - 2026-10-26 22:50 UTC

### Changed
- **The home scene's pilots fly.** Ivan, plus Miguel, Jehosua and Roos from the 3d-characters repo, ridge-soar one closed loop along the Famara cliff (`RIDGE_LOOP` in `src/applications/home/config.ts`), each from its own point on it. The intro camera flies in to Ivan wherever he has got to and then follows him round
- **Paragliders bank into turns** by the coordinated-turn angle for their speed, and the pilot swings gently under the wing (`src/applications/home/paragliderMotion.ts`)
- **Glider lines are faint dark grey** instead of bright yellow brake lines, on every scene
- **The home title is a small wordmark in the bottom-left corner** instead of a large title across the top
- `FlyingBehavior` takes `waypointStartProgress` and can `snapToWaypointCurve()` before it starts

## [Unreleased] - 2026-10-26 22:40 UTC

### Fixed
- **The sitemap and robots.txt pointed crawlers at lanzaroteparagliding.com**, but they are served from 3d.lanzaroteparagliding.com, where this project is deployed. Every URL now uses the subdomain, matching the canonical and og tags. The README names the production domain and the landing page's `?embed=1` embed

## [Unreleased] - 2026-10-26 22:33 UTC

### Removed
- **The external embed package** (`external-embed/`, the `build-external-embed` / `run-external-embed` scripts, and the `data-story` root attribute that only embeds used). If a site still needs it, restore it from commit eda71a8
- **`archive/video/`**, which held one old video

## [Unreleased] - 2026-10-26 22:27 UTC

### Removed
- **The `island` and `boats` scenes.** Five scenes remain: `home`, `famara-animation`, `boats-animation`, `famara` and `town`
- **Models and systems no scene uses any more**:
  - Models: Dome, Hospital, the coconut, date, fan and palm trees, Igloo, TownSquare, PineTree, the Paraglider and Tandem rigs and TandemPilot, Airliner, Jet, Truck, PatrolBoat, Wing, and the whole car stack (Car, AutonomousCar, MovableCarComponent, the car group creator, TerrainFollowingBehavior)
  - Game leftovers: WindIndicator and the "game" UserAnalytics tracker
  - Dead branches of `Environment` and the boat and house group creators: marina, patrol and racing fleets, exclusion zones, and suburban, urban and rural neighbourhoods that were never called
- **Satellite terrain mode**: no theme enabled it and its texture atlas was missing. It went with `satellite-textures.ts`, the tile download and atlas scripts, and `public/`, whose textures nothing served
- **Unreferenced assets, about 10 MB**: all audio (the game's vario tones and ambience), the old UI icons, `birds.glb`, the Draco island, unused textures, the character `.vox`/`.stl` sources (they live in the `3d-characters` repo), unlinked favicons, and a template `site.webmanifest`
- **Outdated docs**: the year-old technical-debt, refactoring and planning docs, the satellite tile doc, a FlyingBehavior doc whose defaults and API were wrong, a website-background guide built on a stub library, the components README and the OrbitControlsHelper examples, the assets README, both TODO files, and the README's game notebook (feature wishlist, fix list, credits for the audio)

### Fixed
- **The external embed rendered Home, not Famara.** Every bundle shares one entry, which reads the scene from the URL. An embed page can now name its scene with `<div id="root" data-story="…">`, and `build-external-embed` clears stale bundles from `external-embed/dist` first
- **`boats-animation` read its metadata from the `boats` registry entry.** It now uses its own entry
- **`npm run lint:check` / `format:check` only checked part of `src`.** The globs were unquoted, so `sh` expanded `src/**/*` one level deep. They are quoted now, and the whole of `src` is formatted and passes ESLint (case-block scoping, `var`, and unused code removed rather than silenced)
- **`assets/sitemap.xml`** no longer lists the deleted `island` and `island-flying` pages

### Changed
- **`docs/COMPONENT_COMPOSITION.md` is rewritten** to describe the base classes that exist and the two ways of building a component. **`docs/README.md`** is a short index of the docs that remain

## [Unreleased] - 2026-10-26 21:49 UTC

### Removed
- **Every story except `home`, `famara-animation`, `boats-animation`, `island`, `famara`, `boats` and `town`**, because the project is now just a few polished Lanzarote animations and models. Gone: the dev tools (`workshop-demo`, `flying-behavior-test`, `camera-switcher-demo`, `procedural-terrain`, `tile-mapper`, `satellite-terrain`, `terrain-gps`, `terrain`, `voxel`), the single-part demos (`head`, `helmet`, `pilot`, `paraglider`, `glider`), the vehicle demos (`cars`, `car`, `truck`, `plane`, `planes`), the scenery demos `buildings`, `roads`, `clouds` and `boat`, and the half-built `flyzones` app
- **45 source files that none of the remaining stories reach**: novelty helmets, flock birds, the audio system, `ParagliderPhysics` and its input controller, the procedural terrain generator and noise, trajectory tracking, unused camera controllers, `NonRenderingAppBase`, the showcase stats helpers, `ThemeSelector`, and the barrel `index.ts` files that only re-exported them
- **Custom app entries**: the `entry`/`webpackEntry` options in `apps.json`, which only tile-debug used. Every story now loads from `applications/<route>/`

## [Unreleased] - 2026-10-26 21:36 UTC

### Removed
- **Stories `island-flying`, `paraglider-voxel`, `hangglider`, `animals`, `editor` and `tile-debug`**, which were rough demos and tools, not part of the project's focus on a few polished Lanzarote animations and models. Their only dependencies went with them: the Crow/Eagle/Vulture bird models, the unregistered flyzone visualizer, `FlyzoneAPI` and its types, the flyzone API docs, and `webpack.flyzones.js` (which pointed at a `src/apps/` folder that no longer exists). The Hangglider and ParagliderVoxel models stay because Home and Famara use them

## [Unreleased] - 2026-10-26 21:17 UTC

### Changed
- **Ivan flies the Home, Famara and Boats scenes** instead of Adri: red and white helmet, blue jacket, black pod. His model is now exported from his own `.vox` (3d-characters `tools/vox-to-obj.mjs`); the old `ivan.obj` was a copy of Adri's, so the `IVAN` character used to render as Adri. He's exported in Adri's frame, so he sits in the harness exactly where she did, and his `defaultScale` now matches hers (0.01)

## [Unreleased] - 2026-10-26 21:04 UTC

### Performance
- **Full resolution on Retina screens**: from a pixel ratio of 1.5 up the scene pass takes 2 MSAA samples instead of 4, which looks the same and saves 3–5 ms of a ~25 ms frame at 2880×1800 (M3 Pro). That brings the home scene under the adaptive threshold, so it now keeps DPR 2 instead of dropping resolution. When frames still run long, the adaptive quality sheds samples (4 → 2 → 0) before it lowers the pixel ratio

## [Unreleased] - 2026-10-26 20:41 UTC

### Performance
- **Island scenes render 1.6–3.3× faster**: the wireframe is shaded into the solid ground from barycentric coordinates instead of being drawn as 350k GL line segments into the 4× multisampled scene target. On the home scene (M3 Pro, 1440×900) a frame took 74 ms looking at the whole island and 36–44 ms closer in; it now takes about 22 ms from every view, and the lines look the same. The solid ground now casts the sun's shadow instead of the lines

## [Unreleased] - 2026-10-26 20:31 UTC

### Changed
- **Brown wireframe** in the default theme (`#8a6248`, a few shades above the basalt ground) instead of near-white, so the grid sits in the landscape rather than on top of it
- **Softer wireframe**: over the solid ground the lines are translucent and fade with distance (`terrain.underlay.lineOpacity` / `farLineOpacity`, 0.45 → 0.12 by 9 km), so the far island no longer turns into a white sheet of lines. Their brightness is capped before blending: lit far past white in HDR, they otherwise blended back to white at any opacity

## [Unreleased] - 2026-10-26 19:59 UTC

### Added
- **Filmic look for every island scene** (`src/foundation/rendering/`, see `docs/RENDERING.md`): ACES tone mapping, 4× MSAA on the scene pass only, bloom on the sun and its glints, a colour grade with vignette, an environment map lit by the sky, and fog in the sky's own horizon colour, so the sea and the far island fade into one haze. `?fx=0` renders without it
- **A real sea**: wave normals driven by the theme's wind, turquoise shallows, surf rolling onto the beaches and foam at the water's edge, worked out from a coast-distance field baked from the island at load; whitecaps; drifting cloud shadows on the sea and the ground
- **Solid ground under the wireframe**: sand at the waterline, basalt, then rust towards the peaks; it receives the sun's shadows
- **Gulls circling in thermals** replace the old bird model in the Famara scenes: one instanced draw call, banking and wingbeats in the vertex shader
- Themes take `water.shallowColor` / `shallowDistance`, `terrain.underlay` and an `atmosphere` block (exposure, fog, bloom, grade, cloud shadows)

### Changed
- **Home fly-in** follows one spline at a speed that never jumps (the old two-phase move stalled halfway), then drifts slowly round the pilots until touched
- **Follow camera** is a chase camera: behind the target's heading, sized to the target, easing only its offset
- The sun's shadow covers a 6 km box following the camera instead of the whole island, so shadows are sharper; they're soft grey rather than black
- The pixel ratio adapts to frame time (1.5 at most when embedded)

### Fixed
- **Island Flying rendered black**: OrbitControls had been handed the sky's own sun vector as its target
- Themes are now applied to the sky, sea and island in every terrain scene; Home applied its theme before they existed

## [Unreleased] - 2026-10-04 10:09 UTC

### Removed
- **Home scene shows only its title**: the scene cards, the "Are you ready to play?" tagline and the music button are gone, along with the music file (`assets/Looking-for-a-new-beginning.ogg`). `NavigationBoxes` is now `TitleOverlay`, which mounts just the voxel title

## [Unreleased] - 2026-10-03 23:25 UTC

### Fixed
- **Scenes render about ten times faster**: the home scene issued about 8,100 draw calls a frame and now issues about 900 (measured in headless Chromium, where it went from 0.25 to 2.8 fps)
  - The sun's point light no longer casts shadows. A point light renders its shadow map six times (a cube), drawing every shadow caster in the scene again for each face, and the directional light already casts the scene's shadows
  - Towns are baked into one mesh per material after they are placed (`mergeStaticMeshes` in `src/foundation/utils/mergeStatic.ts`): about 6,300 house, plot, pool and cactus meshes become about 30
  - Smoke trails draw every puff as an instance of one mesh instead of a mesh per puff, which takes several hundred draw calls a frame off Island Flying. Puffs keep a fixed opacity; the fade-out set the opacity of the one material all puffs shared, so it flickered rather than faded
- **Debug arrows hidden**: the velocity and heading arrows on the aircraft in the home and Famara scenes were switched on

## [Unreleased] - 2026-10-03 22:48 UTC

### Changed
- **Home scene offers the other animations instead of outside links**: the Tandem card and the Conditions / Pilot Guide cards are gone (lanzaroteparagliding.com now carries those links), replaced by four cards that open the public scenes on this site: Famara, Boats, Island and Island Flying. The list lives in `SCENE_LINKS` in `src/applications/home/config.ts`, and each card takes its page from the app's route in `src/config/apps.json`

## [Unreleased] - 2026-10-03 16:19 UTC

### Changed
- **Pages are addressed on `3d.lanzaroteparagliding.com`**: canonical, social URLs and the share image point at the build's own subdomain instead of `lanzaroteparagliding.com/3d/…`; the landing page there embeds and links to the subdomain directly rather than proxying it, and redirects the old `/3d/…` and `/<page>.html` addresses to it

## [Unreleased] - 2026-09-30 12:22 UTC

### Added
- **Embed mode for the home scene**: `?embed=1` hides the title, music button and navigation cards, so the scene can sit inside the lanzaroteparagliding.com landing page

### Changed
- **Pages are addressed under `/3d/`**: canonical and social URLs point at `/3d/…`, where this build is served once the landing page takes the root domain
- **Tandem card carries campaign parameters**: it links to the operator's booking page with `utm_*` tags instead of `?ref=home`, so bookings from the 3D scene can be attributed
- **npm is the only package manager**: scripts call `npm run` instead of `yarn`, `yarn.lock` is removed, and `package-lock.json` is resynced (it was missing `dotenv-webpack`)

## [1.6.0] - 2025-10-02 00:00 UTC

### Added
- **Comprehensive LOD (Level of Detail) System**: Implemented a flexible 4-level LOD system for optimal rendering performance
  - Created LevelOfDetail enum with ULTRA_LOW, LOW, MEDIUM, HIGH levels
  - Defined polygon budgets: ULTRA_LOW (10-100), LOW (100-500), MEDIUM (500-2000), HIGH (2000+)
  - Distance thresholds for automatic LOD selection (500, 200, 50 units)
  - Utility functions for LOD selection, budget validation, and level management
  - Abstract LODComponent base class for easy LOD implementation
  - Backward compatibility with legacy lowPoly boolean parameter

- **LOD-Enabled Buildings**: Migrated 9 building components to 4-level LOD system for optimal performance
  - **TownSquare LOD levels**:
    - ULTRA_LOW (~30-50 polys): Single plane + simple box monument
    - LOW (~60-150 polys): Simple ground + basic monument + 4 benches
    - MEDIUM (~500-800 polys): Basic pattern + benches + simplified decorations
    - HIGH (~1000-5500 polys): Full detail with grid pattern, flowers, lamps
  - **Dome LOD levels**:
    - ULTRA_LOW (~20-40 polys): Simple cylinder + 4-segment sphere
    - LOW (~100-200 polys): 8-segment hemisphere + basic furniture
    - MEDIUM (~600-1000 polys): 12-segment geodesic with 6×12 panels
    - HIGH (~2000-3000 polys): Full geodesic with 8×16 panels
  - **House LOD levels** (supports Small/Medium/Large/Modern types):
    - ULTRA_LOW (~20-50 polys): Single box + roof
    - LOW (~100-300 polys): Main wing + roof + simple door
    - MEDIUM (~500-1000 polys): All wings + roofs + simple windows (no frames)
    - HIGH (~2000+ polys): Full detail with frames, modern features
  - **Villa LOD levels**:
    - ULTRA_LOW (~20-50 polys): Single box + roof
    - LOW (~100-300 polys): Main building + roof + 2 columns
    - MEDIUM (~500-1000 polys): Main + wings + roofs + simple windows
    - HIGH (~2000+ polys): Full luxury with pool, terrace, cylindrical columns
  - **Barn LOD levels**:
    - ULTRA_LOW (~24 polys): Box body + flat roof
    - LOW (~36 polys): Body + angled roof + door
    - MEDIUM (~60 polys): Body + roof + door + 2 windows
    - HIGH (~60 polys): Full detail with trim
  - **Townhouse LOD levels**:
    - ULTRA_LOW (~20-50 polys): Single box + roof
    - LOW (~100-200 polys): Body + simple roof + door
    - MEDIUM (~500-800 polys): Body + roof + peak + simplified windows
    - HIGH (~1500-2000 polys): Full detail with frames, cornices, chimney
  - **DesertHouse LOD levels**:
    - ULTRA_LOW (~20-50 polys): Box + flat roof
    - LOW (~100-200 polys): Body + roof + door + 1 window
    - MEDIUM (~500-800 polys): Body + parapet + door + 3 windows
    - HIGH (~1500-2000 polys): Full adobe detail with cactus, courtyard, shade
  - **DesertHouseWithPool LOD levels**:
    - ULTRA_LOW (~30-60 polys): Simple house + pool boxes
    - LOW (~150-300 polys): House structure + pool
    - MEDIUM (~800-1200 polys): House + pool + minimal landscaping
    - HIGH (~2500+ polys): Full detail with async-loaded components, all amenities
  - **Hospital LOD levels**:
    - ULTRA_LOW (~24 polys): Single box + roof
    - LOW (~72 polys): Main body + simple cross + 3 windows
    - MEDIUM (~144 polys): Main + wings + cross + 6 windows
    - HIGH (~2500-3000 polys): Full medical facility with helipad, emergency entrance

### Changed
- **Building Architecture**: Migrated 9 building components from SimpleThreeComponent to LODComponent
  - Buildings: TownSquare, Dome, House, Villa, Barn, Townhouse, DesertHouse, DesertHouseWithPool, Hospital
  - Replaces lowPoly boolean with levelOfDetail enum for finer control (4 levels)
  - Dynamic LOD switching support via setLOD() method
  - Built-in polygon counting for monitoring/debugging
  - LOD-specific material/geometry naming prevents resource conflicts
  - Maintains full backward compatibility with existing code using lowPoly
  - Total changes: +1684 insertions, -557 deletions across 7 building files
  - Performance benefits: Reduced polygon count for distant buildings improves frame rate
  - Supports explicit LOD control via levelOfDetail parameter for fine-tuned performance

- **Buildings Showcase Application**: Updated to display all 4 LOD levels for comprehensive visualization
  - Changed from 2-row layout (normal vs low-poly) to 4-row layout (all LOD levels)
  - Shows 44 building instances total: 11 building types × 4 LOD levels each
  - Row 1: ULTRA_LOW (10-100 polys), Row 2: LOW (100-500 polys), Row 3: MEDIUM (500-2000 polys), Row 4: HIGH (2000+ polys)
  - Stats overlay shows 4-column comparison with color-coded polygon counts and percentage savings
  - Removed legacy building imports in favor of new LOD-enabled classes
  - Camera positioned higher (0, 80, 100) to view all 4 rows simultaneously
  - Expanded ground size to 1200×200 units for better layout
  - Each building labeled with name and polygon count for easy comparison

## [1.5.10] - 2025-10-01 15:00 UTC

### Added
- **Low-Poly Building Options**: Added lowPoly option to TownSquare and Dome buildings for performance optimization
  - TownSquare lowPoly mode reduces from ~1000-5500 to ~60-150 polygons
  - Dome lowPoly mode reduces from ~1000-3000 to ~356 polygons
  - Low-poly versions maintain visual structure while dramatically reducing geometry
  - TownSquare low-poly: simple ground plane, minimal monument, 4 basic benches (no flowers/lamps/grid pattern)
  - Dome low-poly: simple hemisphere (16 segments), basic bed, door frame, floor
  - Both buildings follow the same pattern as other buildings (lowPoly option instead of separate components)
  - Example: `new TownSquare({ lowPoly: true })` or `new Dome({ lowPoly: true })`

### Fixed
- **HouseGroupCreator Position Errors**: Fixed undefined position errors when creating houses
  - Fixed addLandPlot() and addPoolToHouse() to use houseMesh.position instead of invalid position parameter
  - Fixed createNeighborhood() to handle cases where positions.length < houses.length due to exclusion zones
  - Added position validation check before creating houses
  - Added warning log when houses can't be placed due to exclusion zones
  - Prevents "Cannot read properties of undefined (reading 'x')" errors
- **Performance Metrics NaN Values**: Fixed NaN percentage display in town application performance UI
  - Added division by zero protection in PerformanceUI.updatePerformanceInfo()
  - Added null/undefined checks for all polygon breakdown values
  - Fixed town application polygon counting to include roads, parks, and squares properties
  - Added pattern matching for roads, parks, and squares in updatePolygonCount()
  - Now correctly displays "0.0%" instead of "NaN%" for empty categories

### Refactored
- **Building Content Methods**: Separated low-poly and high-poly content creation for better code organization
  - TownSquare now has `createLowPolyContent()` and `createHighPolyContent()` methods
  - Dome now has `createLowPolyDome()` and `createHighPolyDome()` methods
  - Main `createContent()` method delegates to appropriate method based on lowPoly flag
  - Improves code readability and maintainability

## [1.5.9] - 2025-10-01 14:45 UTC

### Fixed
- **PilotVoxel Asset Resolution**: Fixed character asset resolution to happen before validateOptions is called
  - Created static prepareOptions() method to resolve character assets before super() call
  - Moved asset resolution from instance method to static method to avoid accessing undefined state
  - Fixed validateOptions() to work correctly during construction when pilotOptions isn't set yet
  - Updated paraglider-voxel app to use CharacterType enum instead of direct file imports
  - Removed redundant manual asset imports in favor of CharacterRegistry
  - Character switching now properly prepares options before reloading

## [1.5.8] - 2025-10-01 14:30 UTC

### Added
- **addTown Helper Function**: Created new environment helper to easily populate towns of different types and sizes
  - Added addTown() method to Environment class with configurable options for type, size, and lowPoly mode
  - Supports five town types: village, rural, suburban, town, and city with appropriate house counts and formations
  - Three size options (small, medium, large) that scale house counts proportionally
  - Automatically maps town type to appropriate formation (village→random, rural→rural, suburban→suburban, town→street, city→grid)
  - Updated addHouses() to use addTown internally for better code reusability
  - Updated famara application to use addTown helper directly instead of addHouses
  - Examples: addTown(center, terrain, { type: 'village', size: 'small' }) creates 5 houses in random formation
  - Examples: addTown(center, terrain, { type: 'city', size: 'large' }) creates 30 houses in grid formation

## [1.5.7] - 2025-10-01 13:17 UTC

### Refactored
- **Remove LegacyPilotVoxel**: Replaced legacy implementation with modern AsyncThreeComponent-based PilotVoxel
  - Updated ParagliderVoxel to use modern PilotVoxel instead of LegacyPilotVoxel
  - Changed import from LegacyPilotVoxel to PilotVoxel in ParagliderVoxel.ts
  - Updated type references and instance variables to use PilotVoxel
  - Removed LegacyPilotVoxel.ts file (44 lines removed)
  - Removed LegacyPilotVoxel export from characters/index.ts
  - Modern PilotVoxel provides better architecture with async loading, resource management, character registry support, and proper lifecycle management

### Fixed
- **SubmarineHarness Scaling**: Made all dimensions proportional to DEFAULT_HEIGHT parameter for dynamic resizing
  - Changed DEFAULT_HEIGHT from 450 to 200 for shorter, sleeker profile
  - Changed DEFAULT_DEPTH from 800 to 1200 for longer pod-like appearance
  - All Y positions now calculated relative to height parameter (centerY = -height * 2.0)
  - All geometry sizes use proportional multipliers (width * 0.13, height * 0.32, depth * 0.0625, etc)
  - Lowered center position to -height * 2.0 to make pilot head more visible above harness
  - Harness now properly scales when DEFAULT_HEIGHT is adjusted
  - Window sizes, fins, panels, carabiners, and thruster all scale proportionally

## [1.5.6] - 2025-10-01 13:05 UTC

### Fixed
- **Pilot Options Not Applied**: Fixed Pilot constructor to properly pass metadata and options as separate parameters
  - Changed super() call from single object to two parameters: metadata and options
  - Metadata object now contains only name and version
  - Options object contains all Pilot-specific configuration including headType, helmetType, harnessType, colors, etc.
  - Options spreading (...options) now correctly overrides defaults
  - Pilot showcase now properly displays different head types, helmet types, and harness types for each pilot

## [1.5.5] - 2025-10-01 13:01 UTC

### Refactored
- **Birds to FlockBirds Rename**: Renamed wildlife/Birds.ts to wildlife/FlockBirds.ts for more precise naming
  - Renamed file from Birds.ts to FlockBirds.ts using git mv
  - Updated class name from Birds to FlockBirds throughout the file
  - Updated all imports in environment.ts from Birds to FlockBirds
  - Updated type declarations (birds property) from Birds to FlockBirds
  - Updated wildlife/index.ts to export FlockBirds and maintain backwards compatibility with Birds alias
  - No breaking changes - legacy Birds export still available for backwards compatibility

## [1.5.4] - 2025-10-01 13:08 UTC

### Added
- **Multiple Harness Types for Pilot**: Created OpenHarness and SubmarineHarness variants to provide visual diversity
  - Created OpenHarness.ts with minimal strap-based harness design (climbing gear style)
  - Created SubmarineHarness.ts with enclosed pod-like harness design (submarine/spaceship style)
  - Added HarnessType enum (Cocoon, Open, Submarine) to Pilot component
  - Extended PilotOptions with harnessType, harnessColor1, and harnessColor2 parameters
  - Updated Pilot.createBody() to instantiate correct harness based on harnessType option
  - OpenHarness features thin shoulder straps, chest strap, leg straps, small seat board, and minimal reserve handle
  - SubmarineHarness features enclosed hull, transparent windows, stabilizer fins, thruster details, and emergency hatch
  - Pilot showcase now displays 5 pilots with different harness types: Cocoon (Default), Open (Default), Submarine (Warrior), Open (Skeleton), Submarine (Devil)

## [1.5.3] - 2025-10-01 12:54 UTC

### Fixed
- **Pilot Head Loading**: Fixed missing head from Pilot component by properly handling async PilotHead loading
  - Changed `createContent()` to `createObject()` override to support async operations
  - Made `createHead()` method async to properly await PilotHead.load()
  - PilotHead now loads correctly instead of returning empty object from synchronous getObject() call
  - Pilot heads (Default, Warrior, Skeleton, Devil) now render properly with helmets and customization options

## [1.5.2] - 2025-10-01 12:43 UTC

### Added
- **Hercules to Famara Animation**: Added Hercules military transport plane to Famara animation application
  - Added `HerculesConfig` type to config.ts with flight pattern, speed, and positioning parameters
  - Created `herculesConfig` constant with figure-eight flight pattern at 1200m altitude
  - Added `SHOW_HERCULES` visibility toggle flag
  - Implemented `loadHercules` function in vehicleLoader with FlyingBehavior integration
  - Updated AnimationApp class with Hercules mesh and flying behavior properties
  - Hercules starts flying 4 seconds after animation completes with figure-eight pattern
  - Proper disposal of Hercules mesh and flying behavior on cleanup
  - Vehicle count now includes Hercules in load success message

### Fixed
- **Type Errors**: Fixed TypeScript compilation errors
  - Changed Birds.load gui parameter type from `typeof GuiHelper` to `any` to fix type mismatch
  - Changed environment.ts addBirds and addHangGlider gui parameter types to `any` to fix incompatible type errors

## [1.5.1] - 2025-10-01 12:16 UTC

### Fixed
- **Town Generation Exclusion Zones**: Implemented exclusion zones to prevent buildings from being placed over town squares and parks
  - Added `ExclusionZone` interface to house-group-types with center and radius properties
  - Extended `HouseGroupConfig` to support exclusion zones array
  - Updated `calculateHousePositions` in house-group-utils to respect exclusion zones for all formation types (street, cul-de-sac, grid, suburban, rural, random)
  - Added `setExclusionZones` method to HouseGroupCreator class
  - All neighborhood creation methods now pass exclusion zones to house positioning logic
  - Town application defines exclusion zones for all 3 town squares (radius 100) and 3 parks (radius 85)
  - Buildings now avoid overlapping with Central Square (0,0,0), West Square (-600,0,0), Market Square (600,0,-300), and all parks

## [1.5.0] - 2025-09-30 UTC

### Refactored
- **Vehicle Folder Organization**: Reorganized vehicles into type-based folder structure
  - Created `aircraft/` folder for planes (Airliner, Cessna, Hercules, Jet)
  - Created `ground/` folder for ground vehicles (Car, AutonomousCar, Truck)
  - Created `aerial-sports/` folder for aerial sports (Paraglider, ParagliderVoxel, Hangglider, Tandem)
  - Created `components/` folder for vehicle parts (Wing, HangGliderWing, Glider)
  - Unified exports through main vehicles/index.ts
  - Updated all import paths throughout codebase (33 files affected)
  - Benefits: better organization, cleaner imports, easier navigation

- **Pilot Component Architecture**: Migrated from legacy to modern Pilot implementation
  - Removed legacy Pilot class from vehicles/components/Pilot.ts (175 lines removed)
  - All vehicles now use modern Pilot from characters/Pilot.ts
  - Updated Hangglider and Paraglider to use flattened PilotOptions API
  - Simplified pilot application options structure
  - Modern Pilot extends SimpleThreeComponent with proper resource management
  - Eliminated code duplication between legacy and modern implementations

### Added
- **Hercules Aircraft**: Added military transport plane to vehicle collection
  - Four-engine turboprop design with military color scheme
  - Displayed in planes application alongside Jet, Airliner, and Cessna
  - Configurable body, wing, propeller, and window colors
  - Scale option for size adjustment

### Added
- **ProceduralRoad for famara-animation**: Added procedural road connecting neighborhoods
  - Modified Environment.addHouses() to return neighborhood center positions
  - Integrated ProceduralRoad in famara-animation using returned house positions
  - Road connects 4 neighborhoods: suburban area, Famara coastal village, Noruegos rural settlement, and Teguise town center
  - Road configuration: 8 meters wide, 150 segments for smooth curves, light gray surface with center and edge lines
  - Added intermediate waypoint for improved road routing
  - Opacity support: Roads now support transparency with configurable opacity (0.2 in animation for subtle effect)

- **ProceduralRoad opacity support**: Added transparency options to road component
  - New `opacity` parameter (0-1, default: 1.0) for material transparency
  - New `transparent` boolean parameter to enable transparency rendering
  - Updated material caching to include opacity settings

- **Default theme**: Added "Default" theme to themes menu
  - Provides neutral, clean styling with light gray wireframe terrain
  - Set as the default theme when users first load the application
  - Allows users to return to basic styling after trying other themed looks
  - Features: white/gray clouds, light wireframe terrain, medium blue water, fog enabled
  - ThemeManager now always applies default theme on first load (no longer shows "no theme")
  - Theme selector highlights active theme with solid color background and thicker border
  - Default theme button shows medium gray color (#616161) instead of green

### Fixed
- **Roads demo height offset slider**: Fixed GUI slider range from 0-2 to 0-10 to match configured heightOffset of 5
  - Roads now properly render above terrain in the demo application

### Improved
- **Famara-animation camera transitions**: Enhanced camera animation smoothness
  - Phase 1: Upgraded from smoothstep to cubic easing (ease-in-out cubic) for gentler acceleration/deceleration
  - Phase 2: Upgraded from quadratic to quartic easing (ease-out quartic) for ultra-smooth, buttery deceleration
  - Target tracking: Implemented exponential smoothing with progressive increase for natural camera behavior
  - Made look transitions more gradual (reduced from 0.6 to 0.5 in phase 1, 1.5 to 1.2 in phase 2)
  - Result: Significantly smoother, more cinematic camera movement with no jarring transitions

### Removed
- **FlightControls**: Removed unused FlightControls and DEFAULT_FLIGHT_KEYBINDINGS exports
  - FlightControls was exported but never used in the codebase
  - Cleaned up src/foundation/systems/controls/index.ts
  - Deleted src/foundation/systems/controls/FlightControls.ts

### Refactored
- **Hangglider Component**: Simplified architecture by removing AutoFlier inheritance
  - No longer extends AutoFlier (removes tight coupling to path-following)
  - Now a simple component that returns THREE.Group
  - Use FlyingBehavior composition for autonomous flight when needed
  - Updated applications:
    - famara-animation: Uses scale option in constructor
    - flying-behavior-test: Removed emptyPath parameter
    - hangglider app: Added addGuiControls() call
    - environment.ts: Removed updateWrapSpeed() calls (no longer path-following)
  - More flexible: Can be used as static model or with behavior composition

- **HangGliderWing Component**: Removed legacy export wrapper
  - Simplified export to use modern SimpleThreeComponent directly
  - Removed HangGliderWingLegacy wrapper class
  - All applications now use the modern API

### Added
- **CameraTargetController**: Modern camera system with multi-target support
  - Generic THREE.Object3D targeting (no Flier dependency)
  - Four camera modes: Follow, FirstPerson, Orbit, Static
  - Smooth transitions between targets using animation interpolation
  - React UI component for target selection
  - lil-gui integration for fine-tuning
  - 80% less code than deprecated CameraController

#### New Features
- **Multi-Target Management**: Add/remove targets dynamically with names and metadata
- **Camera Modes**:
  - Follow: Chase camera behind target with configurable distance/height
  - FirstPerson: Inside target view with directional awareness
  - Orbit: Circular orbit around target (OrbitControls integration)
  - Static: Fixed camera position
- **React UI Component** (`CameraTargetUI.tsx`):
  - Collapsible panel with target selection buttons
  - Camera mode selector grid
  - Color-coded target buttons
  - Visual indicator for active target
  - Smooth hover effects and transitions

#### New Applications
- **Camera Switcher Demo** (`/camera-switcher-demo`): Comprehensive demonstration
  - Flying Cessna with autonomous flight behavior
  - Static ground and hill markers
  - Interactive target switching via UI
  - All camera modes showcased
  - Both React UI and lil-gui controls

### Enhanced
- **StoryOptions Interface**: Changed camera type from CameraController to THREE.PerspectiveCamera
  - Increases flexibility for different camera implementations
  - Backward compatible with proper type checking
  - Legacy apps use runtime type checking for CameraController features

- **Type Safety**: Added proper fallbacks for legacy camera features
  - flier-pg app uses runtime checking for animateTo method
  - Graceful degradation for cameras without legacy methods

### Deprecated
- **CameraController**: Marked as deprecated with migration guide
  - Replaced by CameraTargetController
  - Will be removed in future major version
  - Deprecation notice includes migration instructions
  - Technical debt item created for removal

### Documentation
- Comprehensive JSDoc comments in CameraTargetController
- React UI component usage examples
- Demo application showing best practices

## [1.4.0] - 2025-09-30 UTC

### Added
- **EngineFlyingBehavior**: Autonomous flight behavior for powered aircraft
  - Forward-looking terrain avoidance: Casts rays ahead to detect hills and initiates climbs proactively
  - Cruise altitude maintenance: Maintains preferred altitude when not avoiding obstacles
  - Multi-directional scanning: Checks center, left, and right (±17°) for comprehensive terrain awareness
  - Configurable parameters: cruise altitude, climb rate, terrain clearance, look-ahead distance
  - Extends FlyingBehavior with engine-specific characteristics

### Enhanced
- **FlyingBehavior Base Class**: Changed visibility of methods from private to protected
  - Enables proper inheritance for EngineFlyingBehavior
  - Methods made protected: updateFlight, getDesiredDirection, calculateObstacleAvoidance, calculateBoundaryForce, calculateTerrainAvoidance, updateSpeedReduction, logDebugInfo, constrainHeight, orientToDirection, updateDebugArrows

- **Famara Application**: Added Cessna aircraft with autonomous flight
  - Cessna flies autonomously around Famara beach area
  - Uses EngineFlyingBehavior with island-aware settings (2000 radius, 250 cruise altitude)
  - Avoids terrain with 100-unit clearance, looks ahead 200 units
  - Flies at 8.0 speed with smooth 0.6 turn rate
  - Proper cleanup in dispose method

### Documentation
- Updated behavior inheritance patterns for flight systems
- Clarified distinction between wind-dependent (gliders) and engine-powered (planes) flight

## [1.3.0] - 2025-09-30 UTC

### Added
- **Aircraft Components**: Three new procedural aircraft types
  - **Jet**: Military-style jet with swept wings, twin engines, and glowing exhausts
  - **Airliner**: Commercial passenger aircraft with wide body, windows, and detailed features
  - **Cessna**: General aviation single-engine aircraft with high-wing configuration and landing gear
  - All aircraft use procedural geometry with configurable colors and scales
  - Resource-managed materials for efficient memory usage
  - Shadow casting and receiving support

#### New Applications
- **Plane** (`/plane`): Single military jet aircraft showcase
  - Interactive camera controls
  - Rotation and scale adjustments via GUI
  - Clean workshop environment with ground plane
- **Planes** (`/planes`): Complete aircraft comparison showcase
  - All three aircraft types displayed side-by-side
  - Polygon count analysis for each aircraft
  - Labeled display with triangle counts
  - Interactive GUI controls for all aircraft

### Enhanced
- **Vehicle System**: Extended vehicles index with aircraft exports
  - Added Jet, Airliner, and Cessna to vehicle exports
  - TypeScript type exports for all new aircraft options
- **Configuration**: Updated apps.json with new aircraft applications
  - Plane application (priority 35)
  - Planes application (priority 36)
  - Both set to private visibility for development testing

## [1.2.1] - 2025-09-29 14:30 UTC

### Added
- **FlyingBehavior System**: Complete autonomous flight behavior system
  - Advanced obstacle avoidance using distance-based force calculations
  - Boundary detection with progressive return forces to prevent area escape
  - Terrain height awareness using raycasting for minimum altitude maintenance
  - Multiple flight patterns: FREE_ROAM, CIRCULAR, FIGURE_EIGHT, PERCH_AND_FLY
  - Smooth direction changes with configurable turn speed and orientation
  - Built-in animation loop with proper disposal and lifecycle management
  - Alternative to path-based AutoFlier with dynamic environmental awareness

#### New Applications
- **Flying Behavior Test** (`/flying-behavior-test`): Comprehensive test environment
  - Hangglider with autonomous flight demonstration
  - Strategic wall obstacle placement for avoidance testing
  - Real-time GUI controls for behavior parameter adjustment
  - Flight state debugging and logging capabilities
  - Registered in apps.json configuration system

### Enhanced
- **Animals Showcase**: Complete procedural bird geometry implementation
  - Replaced GLB model loading with Three.js shape-based bird creation
  - Enhanced bird appearance with wing shapes, eyes, natural beak colors
  - Improved bird colors: Crow (0x404040), Vulture (0x808080) for better visibility
  - Fixed "black squares" issue in animals showcase
  - Removed unused GLB loading methods and dependencies
  - Wing animation now works with procedural geometry shapes

### Refactored
- **Showcase Configuration**: Removed outdated indirection layer
  - Eliminated showcase-config.ts with hardcoded app mappings
  - Updated showcase-entry.tsx to use direct bundle name resolution
  - Simplified story name resolution without configuration duplication
  - Maintains same functionality with reduced code complexity

## [1.2.0] - 2025-01-27 15:30 UTC

### Added
- **Flyzone Management System**: Complete new system for paragliding location management
  - Interactive flyzone editor with terrain-based placement
  - Weather-based takeoff recommendation engine
  - Wind analysis and scoring algorithms
  - 3D visualization with color-coded markers
  - Professional pilot tools for flight planning

#### New Applications
- **Flyzone Editor** (`/flyzone-editor`): Advanced terrain-based editor for creating and editing flyzone locations
  - Click-to-place takeoff and landing locations
  - Interactive flyzone boundary definition
  - Wind condition configuration interface
  - Real-time GPS coordinate display
  - Terrain-aware placement validation

- **Flyzone Visualizer** (`/flyzone-visualizer`): Weather analysis and takeoff recommendations
  - Real-time wind condition input
  - Ranked takeoff recommendations (0-100 scoring)
  - Pilot skill level filtering
  - Safety warnings and flying advice
  - Interactive 3D wind visualization

#### New Components
- **FlyzoneAPI**: Complete backend API with localStorage persistence
  - CRUD operations for flyzone locations
  - Weather analysis and recommendation engine
  - GPS coordinate conversion utilities
  - Wind condition scoring algorithms

- **FlyzoneMarkers**: 3D marker system for visual representation
  - Takeoff location markers with wind direction indicators
  - Landing zone boundaries with approach vectors
  - Flight phase volumes with altitude ranges
  - Color-coded scoring visualization

- **WindVisualization**: Dynamic wind flow visualization
  - 3D wind direction arrows across terrain
  - Particle system for wind flow animation
  - Speed-based color coding
  - Real-time wind condition updates

#### Data Structures
- Comprehensive TypeScript interfaces for all flyzone entities
- GPS and Three.js coordinate conversion
- Wind condition analysis and safety information
- Media attachment support for images and videos

#### User Interface
- Professional pilot-focused UI design
- Weather condition input controls
- Real-time takeoff recommendations
- Detailed location analysis panels
- Responsive mobile-friendly design

### Enhanced
- **App Registry**: Added flyzone management apps to central registry
  - Flyzone Editor registered as priority tool
  - Flyzone Visualizer for weather analysis
  - Updated location editor marked as legacy

### Documentation
- **FLYZONE_MANAGEMENT.md**: Complete system documentation
- **API.md**: Comprehensive API reference with examples
- Usage examples and integration guidelines

### Technical
- localStorage-based data persistence (production-ready for offline use)
- Three.js integration for 3D terrain interaction
- Real-time wind analysis calculations
- Professional color palettes and visual design
- Performance optimization for large datasets

## [1.1.0] - Previous

### Enhanced Boat System
- Renamed `Boat.ts` to `SmallSailBoat.ts`
- Added `FishingBoat`, `Yacht`, and `SpeedBoat` classes
- Enhanced environment system with boat variety and randomization
- Improved boat showcase with proper spacing and camera positioning

### Color Palette Improvements
- Replaced random bright colors with professional palettes in helmet demos
- Added military, gray, and steel color themes
- Fixed head demo rendering issues with massive grids

### Architecture
- Converted FlyZones and LocationEditor apps to extend TerrainBase
- Added terrain access for better integration
- Updated import paths and inheritance chains

### Previous Features
- Three.js-based 3D paragliding simulation
- Multiple demo applications and workshop tools
- Terrain, weather, and environment systems
- Bird and hang glider animations
- Theme engine with multiple visual styles