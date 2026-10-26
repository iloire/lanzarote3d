# Lanzarote 3D

[![CI](https://github.com/iloire/lanzarote3d/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/iloire/lanzarote3d/actions/workflows/ci.yml)

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

Scenes are picked with `?story=`: `home`, `famara-animation`, `boats-animation`, `famara`,
`town` and `models`. Add `?fx=0` to render without post-processing, to
compare looks and frame times. Dev builds expose `window.__lz` for profiling (see RENDERING.md).

## Checking it

```bash
npm run lint:check
npm run format:check
npm run type-check
npm run test:ci    # Jest
```

`npm run format` rewrites files into the Prettier style that `format:check` expects.

GitHub Actions (`.github/workflows/ci.yml`) runs Jest, then all three checks and the production
build, on every push to `master` and every pull request.

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

### Dev mode: every scene in the menu

Production menus list only the public scenes, and the home scene hides its sidebar. Dev mode lists
the private scenes too (`famara`, `town`, `models`) and shows the sidebar everywhere.

- **Turn on:** open any page with `?dev=1`, e.g. `https://3d.lanzaroteparagliding.com/?dev=1`
- **Turn off:** `?dev=0`

It sticks in this browser (`localStorage.lanzarote_dev_mode`) until turned off, and the console logs
"🔓 Dev mode enabled" on load. `enableDevMode()` / `disableDevMode()` in the console do the same,
followed by a reload; run them on the scene's own page, not on a page that embeds it in an iframe.

At `localhost` the private scenes are always listed; home still hides its sidebar unless `?dev=1`.
Private scenes also open directly without dev mode: `?story=famara`, `?story=town`.

### Model viewer

`?story=models` (Models in the dev menu) shows every model the scenes use, one at a time on a
turntable, with its size and triangle count: pick one from the list, step with ← / →, space toggles
the spin, `?model=<id>` links to one. A new model goes in `src/applications/models/catalog.ts`.

To show the sidebar on home without listing private scenes:
`localStorage.setItem('lanzarote_show_menu', 'true')` (remove the key to undo), then reload.

## Source art

`3d/` holds the island's sources: the height map (`.xcf` / `.png`) and a Blender scene of the island (`lanzarote.blend`). The scenes load `assets/foundation/models/environment/lanzarote.glb`. The pilots are voxel models from the `3d-characters` repo, exported to `.obj`.

## Credits / inspiration

- [https://github.com/dragonir/3d](https://github.com/dragonir/3d)
