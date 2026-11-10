# Christmas mode

From 1 December to Reyes (6 January), island time, the scenes dress for Christmas. The switch
is `isChristmas()` in `src/shared/christmas.ts`, decided once per page load from the date on
Lanzarote and the address:

- `?christmas` (or `?christmas=1`) turns it on out of season, to preview it;
- `?christmas=0` (or `off`, `false`, `no`) turns it off in season.

What changes:

- **Snow on the volcanoes.** `getDefaultTheme()` returns `CHRISTMAS_THEME`
  (`src/foundation/themes/index.ts`), whose ground underlay has a `snow` line: level faces from
  850 world units up (about 390 m; heights are drawn 2.2x) turn white, lying full by 1100. The
  line is ragged face by face, and the steep faces stay rock, so the Famara cliff keeps its
  colour under a white top. It's three uniforms in the ground shader (`Island.ts`), no extra
  draw call.
- **Light snowfall** (`src/foundation/components/effects/Snowfall.ts`), added by `TerrainBase`
  to every terrain scene: 10,000 flakes in a 500 m cube that wraps round the camera in the
  vertex shader, so it costs one draw call and no CPU anywhere on the map. They fall at 1.6 m/s,
  sway, and drift with 60% of the shared wind on the shared clock, and fade within 12-24 m of the
  camera and towards the cube's edges.
- **Santa hats** on every voxel pilot (`src/foundation/components/characters/SantaHat.ts`). The
  hat is built in voxels in code, sized from the pilot's head and hung on its `head` pivot, so
  it turns with the head; a pilot model without a head part goes bareheaded. `ParagliderVoxel`
  wears one at Christmas unless its `santaHat` option says otherwise. The voxel mesher it shares
  with the paramotor is in `src/foundation/utils/voxels.ts`.
- **Christmas wings** on the home scene's paragliders (`src/applications/home/christmasWings.ts`):
  a Santa suit (red, white fur on the leading edge, a black belt with a gold buckle), a candy
  cane (white with slanting red stripes) and a Christmas tree (green, a gold star on the nose, a
  garland and baubles), taken in turn down the pilot list; Magne always flies the tree. Each
  keeps its wing's kind and cell count, so it flies as it always does.
- **Santa on a paramotor** (`src/applications/home/santa.ts`): a voxel Santa
  (`src/foundation/components/characters/SantaVoxel.ts`) under the Santa-suit wing, a paramotor
  on his back, towing his sleigh of presents on a rope that runs under the prop's cage. He flies
  Abel's loop over the beach and the sea, 600 m further out and at 1000-1080 m, and is the last
  paraglider in the pilot picker; `?pilot=santa` flies the camera to him.
  `ParagliderVoxel`'s `santa` option swaps the pilot for him.
- **Sleigh bells** (`src/applications/relax/sleighBells.ts`), made in the browser like the wind:
  pairs of shakes at a trot, each a hiss and four small bells with inharmonic partials. They
  play with the wind toggle (`createSoundControls`' `ambient` sounds) and fade with the camera's
  distance from Santa: full within 250 m, silent past 1.8 km.
- **Blay's sparkles** (`src/foundation/components/effects/SparkleTrail.ts`): while he throws a loop
  (`ParagliderMotion.looping`), he leaves a trail of gold, white, red and green sparkles that
  hang in the air, twinkle and fade over 4 s. They're lit past white so the bloom makes them
  glow; one draw call, a ring of points written as they're born.
