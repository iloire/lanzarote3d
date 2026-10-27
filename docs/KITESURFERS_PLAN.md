# Kitesurfers on Famara beach: plan

Add a handful of kitesurfers riding off Famara beach in the home scene, set up for the day's
wind: **N-NW, about 337°**. Low poly, cheap, driven by a config block like the pilots.

## What it should look like

On a N-NW day Famara is cross-onshore: the beach runs roughly SW–NE and faces NW, so the wind
comes in at an angle off the sea. That decides how the kiters move.

- **They ride along the beach, not out to sea.** A kiter goes across the wind on a reach, about
  90–110° off it. With the wind from 337°, the two tacks head about **ENE (67°)** and **WSW
  (247°)**, nearly parallel to the shore. Each kiter goes back and forth on a leg a few hundred
  metres long, between about 50 and 300 m out from the sand.
- **The kite sits downwind.** It flies 20–25 m out on its lines, about 45° up, downwind of the
  rider (towards the SSE, so towards the beach) and a little ahead on the side they are heading.
  The rider leans back upwind against it. Every kite on the water points the same way: that is
  how a viewer reads the wind.
- **Jibes at each end.** The rider carves round downwind and the kite sweeps over the top
  (through the zenith) to the other side of the wind window, then they ride off on the other
  tack.
- **Now and then a jump.** The kite is sent up to the zenith, the rider rises 5–10 m and drifts
  downwind for about 3 s, then lands and rides on. Rare: one every 30–60 s per kiter.
- **A short wake** behind each board, reusing `wakeGeometry()` from `effects/BoatWake.ts`, so they
  read against the water from far away.

## Scale and count

World units are metres. A real kite spans about 9 m and a rider is 1.8 m, which is a dot from the
camera 1–3 km away. Draw them **about 3× life size**, as the gulls are (6 m wingspan against
1.3 m), with the factor in config so it can be tuned by eye. **6–8 kiters** in two or three
groups along the beach, in bright kite colours (reds, oranges, yellows, cyan; real kites are loud).

## The wind: one source of truth

The theme already has `weather.windDirectionDegreesFromNorth: 280` (W) in
`src/foundation/themes/index.ts`, driving the waves and cloud shadows. The kiters should read the
wind from the theme, not a second number, or the kites and the waves will disagree.

**Decision for you:** move the theme wind to **337** (N-NW). That turns the waves and cloud
shadows too. It suits the scene: N-NW to NW is the wind that holds the pilots up on the Famara
ridge. The alternative is a separate wind just for the kiters, which I'd rather not do.

Orientation, checked in the code: north is −z (`boat-group-types.ts`: "a boat at 0 points its
bow north (−z)"), so east is +x. The wind coming *from* 337° blows *towards* 157° (SSE), which
is +z and a little +x in the scene. To be confirmed on screen in step 1.

## Steps

1. **Find the beach in scene coordinates.** Famara beach runs between Caleta de Famara
   (`TOWN_FAMARA`) and the Noruegos houses (`TOWN_NORUEGOS`) in `shared/env/environment.ts`. Run
   the scene, take the waterline from a few points, and pick two or three ride legs (start and
   end points on the water, 50–300 m out). Check that they are in the camera's shot during the
   backdrop sway (the camera keeps "La Graciosa, Famara beach and the ocean" behind the pilots).
   If the legs come out more fiddly than a few points, use the coast field (`CoastField.ts`,
   "metres to the nearest beach") to keep riders in the band instead of hand-picked points.
2. **The motion, as pure maths: `home/kitesurfMotion.ts`.** Like `paragliderMotion.ts`: a class
   with `update(dt)` that moves a rider along their leg at about 10 m/s (20 knots), heading at
   the reach angle to the wind, jibes at the ends, and the occasional jump. It computes the
   rider's position, heading and lean, and the kite's position and roll from the rider, the wind
   and the line length. No three.js scene objects inside, so it can be unit tested.
3. **The model: `foundation/components/vehicles/water-sports/Kitesurfer.ts`.** Low poly: the kite
   is a strongly curved arc (a C, tips curling down to about 80°). The wings in `Glider.ts`
   already build an arced canopy (the roller's tips curl to 57°); reuse that if it bends that far,
   otherwise a small arc of its own. The rider is a few boxes on a board; the four lines are one
   `LineSegments` updated per frame. One group per kiter: rider and kite move separately, the
   lines join them.
4. **Config: `KITESURFERS` in `home/config.ts`.** Count, legs, speed, line length, scale, jump
   rate, colours; the wind from the theme. Documented in the file like `ROLLER_FLIGHT`. Plus
   `SHOW_KITESURFERS`, next to the other visibility flags.
5. **Wire into the home scene.** Load in `home/index.tsx` after the boats, update from the
   existing animation loop (no `requestAnimationFrame` of its own: the ideas doc lists those as a
   cost), dispose with the rest.
6. **Tests: `tests/elements/kitesurfMotion.test.ts`.** The ones worth having:
   - the kite is always downwind of the rider and at the line length from them;
   - the riding heading is at the reach angle to the wind, on both tacks;
   - a jibe moves the kite to the other side of the wind;
   - the rider never leaves their leg's band (no riding up the beach or out to sea);
   - a jump returns to the water.

   Prove each can fail by breaking the maths once.
7. **Check it on screen** with `dev-browser`: screenshots from the home camera and from close up,
   that the kites read as kites from far away, that they all lean the same way, and that the
   frame time does not move (8 groups and a few hundred triangles should not).
8. **Docs.** A line in `docs/HOME_ANIMATION_IDEAS.md`, the wind change in `docs/RENDERING.md` if
   the theme moves, and `CHANGELOG.md`.

## Shared files

Another change is in progress in `home/config.ts` and `home/paragliderMotion.ts` (uncommitted
right now). The kiters go in new files; in `config.ts` they only add a block at the end, staged
on its own.

## Out of scope for now

Spray, kites casting shadows, kiters crashing or relaunching, riders reacting to each other.
