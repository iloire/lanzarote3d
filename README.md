# Lanzarote 3D

A 3D, voxel-styled Lanzarote you can watch paragliders fly over, in the browser. The island is a
real height map drawn as a wireframe over sunlit ground, with a living sea, gulls in thermals,
towns, boats and planes, and voxel pilots soaring the Famara cliffs. The home scene flies in to Ivan,
Miguel, Jehosua and Roos ridge-soaring a loop along the Famara cliff and follows Ivan round it;
Famara and Boats are standalone camera animations, and the static
Famara and Town scenes show the landscape and the models up close.

![Ivan, Miguel and Jehosua soaring the Famara cliffs on the home scene](docs/screenshots/home.png)

Built with three.js, React and webpack. How a frame is drawn (the filmic pipeline, the sea, the
shaded wireframe, adaptive quality) is in [docs/RENDERING.md](docs/RENDERING.md); the rest of the
docs are indexed in [docs/README.md](docs/README.md).

## Running it

```bash
npm install
npm run dev        # webpack dev server on http://localhost:8080, opens the home scene
```

Scenes are picked with `?story=`: `home`, `famara-animation`, `boats-animation`, `famara` and
`town`. Add `?fx=0` to render without post-processing, to
compare looks and frame times. Dev builds expose `window.__lz` for profiling (see RENDERING.md).

## Checking it

```bash
npm run lint:check
npm run format:check
npm run type-check
npm run test:ci    # Jest
```

## Deploying

Production is [3d.lanzaroteparagliding.com](https://3d.lanzaroteparagliding.com): an S3 bucket
(`lanzaroteparagliding-placeholder`) behind CloudFront, deployed with the AWS CLI's
`lanzaroteparagliding` profile. The lanzaroteparagliding.com landing page embeds the home scene with
`?embed=1`, which hides the title overlay.

```bash
brew install awscli                                  # once
aws configure --profile lanzaroteparagliding         # once: access key, secret, region
aws s3 ls --profile lanzaroteparagliding             # check the profile works

npm run deploy-prod
```

`deploy-prod` builds into `dist/`, tags the commit `PROD-<date>_<time>` (locally), empties the
bucket, uploads `dist/` and invalidates the CloudFront cache. Two things to know:

- It builds the **working tree**, uncommitted changes included. Deploy from a clean checkout of
  `master` to ship exactly what's committed.
- The bucket is **empty for the length of the upload**, so the site can briefly 404.

`npm run run-prod` builds and serves `dist/` locally on port 8080, to check a production build
before deploying.

## Development notes

### Dev mode in production

By default, only public apps are visible in production. To access private/hidden apps and dev tools in production:

**Enable dev mode:**
1. Open browser console on the production site
2. Run: `enableDevMode()`
3. Reload the page

**Disable dev mode:**
```javascript
disableDevMode()
```

**Manual control:**
```javascript
// Enable
localStorage.setItem('lanzarote_dev_mode', 'true')

// Disable
localStorage.removeItem('lanzarote_dev_mode')
```

When dev mode is enabled in production, you'll see "🔓 Secret dev mode enabled" in the console and have access to the private scenes (famara, town).

### Show the sidebar on the home scene

The sidebar is hidden by default on the home app for a cleaner presentation. To force-show it:

**Enable:**
```javascript
localStorage.setItem('lanzarote_show_menu', 'true')
```

**Disable:**
```javascript
localStorage.removeItem('lanzarote_show_menu')
```

Reload the page after changing this setting.

## Archived branches

Kept on the remote for reference only. They are not meant to be merged.

- **`flier-cursor`** (March to September 2025, 87 commits): an experiment to replace the hand-rolled flight model with a rigid-body simulation in `cannon-es`. It has a glider and pilot joined by segmented ropes with lift applied at 16 points across the wing (`src/stories/physics/`), a `PhysicsFlier` class for the flier story, a standalone airplane sandbox (`src/stories/cannon.tsx`), a flight HUD, a force-vector visualizer and design notes in `src/docs/`. It was never finished: drag and brake forces are switched off and the constants are tuned by hand. The flyable game it served has since been removed from `master`, which now only plays scripted scenes; the branch still uses the old `src/stories/` layout.

## Source art

`3d/` holds the island's sources: the height map (`.xcf` / `.png`) and a Blender scene of the island (`lanzarote.blend`). The scenes load `assets/foundation/models/environment/lanzarote.glb`. The pilots are voxel models from the `3d-characters` repo, exported to `.obj`.

## Credits / inspiration

- [https://github.com/dragonir/3d](https://github.com/dragonir/3d)
