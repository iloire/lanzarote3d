# Shared environment

Towns, boats, thermals, gulls and roads shared by the island scenes (home, famara-animation).

## `roads.json`

The roads between the Famara towns, traced from OpenStreetMap. `roads.ts` projects them with
`ISLAND_ANCHOR` (`shared/geo.ts`) and lays each one on the terrain as a `ProceduralRoad`.

```jsonc
{
  "source": "© OpenStreetMap contributors, ODbL …", // attribution, keep it
  "roads": [
    {
      "name": "…", // free text: where it runs and the road numbers
      "osm": ["way/…"], // the ways it was traced along
      "points": [[lat, lon], …] // a polyline, end to end; smoothed into a curve when drawn
    }
  ]
}
```

To add a road, route it between two places over OSM's ways and simplify it to about 8 m: points
much closer than that only slow the build, and much further apart cut the corners of the
bends. The road's look (width, colour, height above the ground) is `ROAD_STYLE` in `roads.ts`.

The towns the roads join (`TOWN_*` in `environment.ts`) are placed from their OSM place nodes
with the same anchor, so roads and towns stay together.
