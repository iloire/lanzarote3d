# Home scene: animation ideas

Ideas for making the home scene (`src/applications/home/`) more alive while it stays low poly and
fast. Nearly all of them are transform maths or a few shader lines, with no new geometry to
speak of. Ordered by impact for the cost within each section.

Top picks: **1** (pendulum pilot), **5** (spring camera with roll) and **7** (cloud shadows).

## Make the flying feel alive

1. ~~**Let the pilot swing under the wing.** `ParagliderMotion` banks wing and pilot as one rigid
   piece. Split them and hang the pilot from a spring-damped pendulum below the canopy: the wing
   rolls in first, the pilot swings out, overshoots and settles; speeding up or slowing down
   pitches them fore and aft. Two extra rotations per pilot.~~ ✅ The pilot hangs from a pivot at
   the carabiners (`ParagliderVoxel.getPilotSwing()`), the real hinge between wing and harness,
   so the risers stay attached. A roll pendulum (about a 3 s period, damping ratio 0.22) lags the
   bank by up to 10° and swings out about as far past it before settling. A pitch pendulum is
   driven by the speed measured along the path, which varies because the curve isn't
   arc-length parameterised. Covered by `tests/elements/paragliderMotion.test.ts`.
2. **Make the canopy breathe.** A small vertex-shader offset along the span
   (`sin(time + aSpan * k)`) so the cells billow and the tips flex. GPU only, no CPU cost; the
   gulls already do the same with `aWing`.
3. **Vary what the pilots do.** All four fly the same ridge loop. `generateThermals()` already
   gives thermal positions: a pilot could peel off, circle up in a thermal and glide back to the
   ridge, and now and then one could throw a wingover. Only a different set of waypoints.
4. **Hang glider weight shift.** The pilot's body slides against the bank inside the control
   frame.

## Camera

5. ~~**Follow the lead on a spring, not rigidly.** The loop adds the lead's movement straight to
   the camera, so it is bolted to the pilot. A critically damped follow with a little look-ahead
   into turns, plus a slight camera roll as the pilot banks, would feel filmed.~~ ✅
   `CameraFollow` (`home/cameraFollow.ts`) chases a point 2 s along the lead's flight on a
   critically damped spring that settles in 1.2 s, so at a steady speed the camera aims about
   12 m ahead of the pilot and swings into turns early; it rolls with a quarter of the lead's
   bank. The camera and orbit target move by the spring's step, so orbiting and zooming still
   work, and the roll is undone after each frame so OrbitControls never sees it. Tuned in
   `CAMERA_FOLLOW` in `home/config.ts`. Still open: `applyFloatingMotion` moves the camera
   about 0.04 units, so it does nothing visible.
6. **A shot director.** After the intro, cut or blend every 15–20 s between a few framings: chase
   behind the lead, the hang glider passing overhead, low along the cliff as a pilot goes by,
   gulls in the foreground.

## Atmosphere

7. **Cloud shadows on the terrain.** Multiply a scrolling noise texture into the terrain lighting,
   moving with the wind; the clouds drift the same way. One texture lookup, a big gain in scale.
8. **Wind streaks along the ridge.** About 20 instanced, additive line quads flowing up the Famara
   cliff, showing why the pilots stay up.
9. **Shore foam and boat wakes.** A foam band in `OceanMaterial` where water meets terrain, and a
   V-shaped quad behind each boat. Wakes ✅: `addBoatWake()` in `effects/BoatWake.ts` puts one
   behind every moving boat; the shore foam is still open.
10. **Golden-hour light.** A warm low sun, a cool fill and height fog suit flat shading; a slowly
    shifting sun angle keeps the shading changing.

## Speed fixes

Found while reading the scene.

- ~~**Every `Cloud` runs its own `requestAnimationFrame`**, and its bob
  (`position.y = position.y + sin(...) * 0.1`) adds up per frame, so how far a cloud drifts
  depends on the frame rate. Every 3 s each cloud part also starts two tweens towards a random
  ±5–10 % of its _current_ scale and position, a random walk that lets parts wander off.~~ ✅
  All clouds now share one loop, and their bob and breathing are sines around the rest pose.
- ~~**`app.tsx` runs an empty `requestAnimationFrame` loop forever** in production; it only
  updates stats in development.~~ ✅ It runs in development only.
- ~~**The home loop times frames with `Date.now()` and never clamps the step**, so pilots and bank
  jump after switching back to the tab.~~ ✅ It uses the frame timestamp, capped at 0.1 s.
- ~~**The smoke-trail block allocates two `Vector3`s per frame per aircraft.**~~ ✅ Scratch vectors.
- **Shadows use `PCFSoftShadowMap` at pixel ratio 2.** A shadow camera fitted around the pilots
  rather than the whole island would be sharper and cheaper. Not done: it changes the look, so it
  wants its own change.
- **The boats and aircraft still run one `requestAnimationFrame` each**
  (`MovingBehavior`, `FloatingBehavior`, `FlyingBehavior`), about 38 a frame. Next candidate.

### Before and after

Production builds of the home scene, 1280×800 in Chromium, measured for 20 s once the intro has
finished, three runs each, alternated. Medians:

|                         | Before         | After          |
| ----------------------- | -------------- | -------------- |
| rAF callbacks per frame | 84             | 39             |
| Script time per frame   | 1.68 ms        | 1.62 ms        |
| Frame time p50 / p95    | 17.3 / 19.7 ms | 16.9 / 19.8 ms |

The frame rate is held by the display either way, and script time moves within the noise between
runs: the scene's frame cost is in rendering, not JavaScript. What the change buys is half the
callbacks, clouds that no longer drift apart, and no jump on returning to the tab.
