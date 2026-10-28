# Shared environment

Towns, boats, thermals, gulls, ravens and a pair of guirres, roads, landmarks and the La Graciosa ferry shared by the island scenes (home, famara-animation).

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

## `terrain-regions.json`

The ground's colour by region, so the island reads like the satellite view: black lava in
Timanfaya, La Geria and the Malpaís de la Corona, olive in Haría and on the Famara massif, ochre
in the south and on the central plains, pale sand on El Jable. `terrainRegions.ts` projects each
with `ISLAND_ANCHOR`; the underlay bakes one colour per triangle from them
(`foundation/rendering/regionTint.ts`). Ground outside every region keeps the theme's colour.

```jsonc
{
  "regions": [
    {
      "name": "…", // free text: what the patch is
      "kind": "volcanic", // volcanic | green | desert, for reading only
      "at": [lat, lon], // the centre
      "radius": 8500, // metres; full strength out to 35% of it, then fading to nothing
      "color": "#1f1c1b", // sRGB, about as dark as the theme's underlay colour: the sun brightens it a lot
      "strength": 1 // 0-1, how much of the theme's colour it replaces at the centre
    }
  ]
}
```

Where regions overlap their colours are averaged by weight. Beaches stay sand coloured on top.

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
      "kind": "radar" | "ermita" | "mast" | "windsock" | "mirador" | "palms" | "castle",
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

## `ferry.ts`

The Órzola – Caleta de Sebo ferry. `FERRY` holds its route (world x/z, traced on the model's own
coast round Punta Fariones rather than projected from OSM, which would cut the headland), its
speed in world units a second, the seconds it lies alongside at each end and its scale. It moves
itself on the shared clock (`crossing()` gives where it is at a time), so nothing in the scene's
loop drives it.
