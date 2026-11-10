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
