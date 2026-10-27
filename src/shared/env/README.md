# Shared environment

Towns, boats, thermals, gulls, roads and landmarks shared by the island scenes (home, famara-animation).

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

## `landmarks.json`

The landmarks on the Risco, at its takeoffs and in Haría, placed from OpenStreetMap. `landmarks.ts` projects
each with `ISLAND_ANCHOR`, sets it on the terrain and builds it from
`foundation/components/scenery/landmarks/Landmarks.ts`.

```jsonc
{
  "source": "© OpenStreetMap contributors, ODbL …", // attribution, keep it
  "scale": 2, // world units per model metre: twice life size, so they read from the air
  "landmarks": [
    {
      "name": "…", // free text, also the object's name in the scene
      "kind": "radar" | "ermita" | "mast" | "windsock" | "mirador" | "palms",
      "osm": "node/…", // the feature it was placed from
      "at": [lat, lon],
      "heading": 315, // optional: compass bearing the front faces; the windsock turns to the wind
      "height": 30, // optional, masts only: metres to the top, default 45
      "top": 200, // optional: lift it onto the highest ground within this many units
      "count": 60, // palms only: how many palms in the grove, default 30
      "radius": 450 // palms only: units from the centre they spread over, default 300
    }
  ]
}
```

Use `top` for anything that stands on a summit or the cliff edge: the projection can be ~170
units off near the coast, which on the Risco puts a summit on the cliff face.
