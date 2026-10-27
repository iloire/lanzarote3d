# Puerto del Carmen scene

`?story=puerto-del-carmen` (private: listed under "Private" in the menu on localhost or in dev
mode). The town on the south-east coast, its real harbour with boats moored at the pontoons and
quay, and one paraglider soaring above Playa Quemada.

It opens with a 36 s shot (`INTRO_SHOT` in `config.ts`): round the pilot, east down the coast,
in among the moored boats and up to the overview. A click or scroll hands over to the orbit
controls early; `?intro=0` opens on the overview.

- `config.ts`: the camera, where the harbour sits and how it is scaled and turned, the boats, the
  town blocks and their house style, the gulls, and the paraglider's loop. Tune the scene here.
- `harbour.json`: the harbour's outline, traced from OpenStreetMap (schema below).
- `harbour.ts`: turns `harbour.json` into the `Harbour` component's shapes and the berth lines.
- `cameraShot.ts`: plays a list of timed camera keys, some of them following the pilot.
- `index.tsx`: loads it all.

## `harbour.json`

Real coordinates, so the harbour can be retraced from a map without converting anything.

```jsonc
{
  "source": "© OpenStreetMap contributors, ODbL …", // attribution, keep it
  "centre": [lat, lon], // the point placed at HARBOUR_PLACEMENT.centre in config.ts
  "features": [
    {
      "kind": "breakwater" | "quay" | "pontoon" | "beacon",
      "name": "…", // free text; the north quay is found by a name starting "North quay"
      "osm": ["way/…", "node/…"], // where it was traced from
      "points": [[lat, lon], …] // a polyline; a beacon has one point
    }
  ]
}
```

- **breakwater**: a crown 16 wide and 4 above the sea on a wider, lower apron of armour rock.
- **quay**: 8 wide, 2.5 above the sea.
- **pontoon**: 3 wide, just above the water; boats moor along both sides, bows towards its last
  point, so list each pontoon from its root to its tip.
- **beacon**: the green tower on the breakwater tip.

Widths and heights are in world units, after the exaggeration; they live in
`foundation/components/scenery/harbour/Harbour.ts`.

Points go through `geoToWorld` (`src/shared/geo.ts`), are taken relative to `centre`, multiplied
by `HARBOUR_PLACEMENT.exaggeration` and turned by `HARBOUR_PLACEMENT.rotation`. The rotation
exists because the island model's coast is coarse (about 45 m a pixel), so a straight placement
leaves the breakwater's root out at sea.
