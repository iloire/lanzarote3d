#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow", "tifffile", "imagecodecs"]
# ///
"""
Build a city that stands on hills (Hong Kong), lit for the night.

3d/city-to-glb.py builds a city on flat ground (New York). This reuses its OpenStreetMap fetching,
voxel grid, rasteriser, mesher and GLB writer, and changes what a city on hills needs:

- Every building stands on the bare ground under it (3d/bare-earth.py, the same ground the
  terrain is built from): its walls go down to the lowest ground under its footprint, a little
  into the hill, and its roof is that much higher.
- OpenStreetMap often has no height for Hong Kong's buildings; the bigger the footprint, the
  taller the default. Towers drawn from their podium up (`min_height`) stand on the ground.
- The streets are traced from OSM's roads (Hong Kong has no grid to find them on), sidewalks
  round the buildings, parks and woods; everywhere else is clear, so the terrain shows. They are
  draped over the terrain on its own grid instead of one flat quad, with a second image that
  glows: lamplit roads, shopfronts.
- The extras carry, for the app: `roads`, the main roads as polylines with heights for the cars;
  `signs`, neon signs on the walls along the main roads in the `neon` areas; `glows`, the lit
  buildings near the water whose lights the harbour reflects. `city.lights` gives named towers
  their own night lighting (a window style the app's shader knows).

Usage: uv run 3d/city-on-hills.py src/locations/hong-kong.json assets/locations/hong-kong-city.glb
"""
import importlib.util
import json
import math
import subprocess
import sys
import zlib
from pathlib import Path

import numpy as np


def _module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).parent / file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


city = _module('city_to_glb', 'city-to-glb.py')
dem = _module('dem_to_glb', 'dem-to-glb.py')
bare = _module('bare_earth', 'bare-earth.py')

# Walls go this far below the lowest ground under the building, metres, so no gap shows on a slope
SINK = 4
# The street layer lies this far over the terrain, metres
STREET_LIFT = 0.5
# Window styles past city-to-glb's (0 roof, 1 punched, 2 curtain), for named towers' night lights
LIGHT_STYLES = {'diamonds': 3, 'show': 4, 'crown': 5, 'gold': 6}
# Roads by OSM class: width in metres, how brightly lit, and whether cars drive them
ROADS = {
    'motorway': (22, 1.0, True),
    'trunk': (20, 1.0, True),
    'primary': (18, 1.0, True),
    'secondary': (14, 0.85, True),
    'tertiary': (10, 0.7, True),
    'motorway_link': (8, 0.8, False),
    'trunk_link': (8, 0.8, False),
    'primary_link': (8, 0.8, False),
    'secondary_link': (7, 0.7, False),
    'tertiary_link': (7, 0.6, False),
    'residential': (7, 0.5, False),
    'unclassified': (7, 0.5, False),
    'living_street': (6, 0.45, False),
    'service': (5, 0.35, False),
}
FOOTWAYS = {'footway', 'pedestrian', 'steps', 'path', 'corridor'}
# Daytime colours (sRGB) of the street layer, and the light each gives off at night (linear-ish)
SURFACES = {
    'road': '#2c2e33',
    'sidewalk': '#77736b',
    'path': '#7a705e',
    'grass': '#2f4a2a',
    'wood': '#24381e',
}
LAMP = np.array([1.0, 0.62, 0.3])  # sodium
SHOP = np.array([1.0, 0.85, 0.65])
WHITE_LAMP = np.array([0.85, 0.9, 1.0])
# Neon: a sign on a wall cell along a main road this often, and the colours the app picks from
NEON_SHARE = 0.4
NEON_COLOURS = 6
# Harbour reflections: lit buildings at least this tall within this far of the water, metres
GLOW_HEIGHT, GLOW_REACH = 25, 450
LOOP_RADIUS = 12


def area_of(ring, grid):
    """Square metres inside a ring of (lat, lon)"""
    if len(ring) < 3:
        return 0.0
    points = np.array([grid.en(lat, lon) for lat, lon in ring])
    x, y = points[:, 0], points[:, 1]
    return abs(float(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))) / 2


def unit_hash(key):
    return (zlib.crc32(key.encode()) % 10007) / 10007


def prepare(location, grid, elements):
    """OSM's buildings with what Hong Kong needs filled in: heights where OSM has none, by
    footprint, towers on the ground, and the location's overrides"""
    overrides = location['city'].get('overrides', {})
    out = []
    for element in elements:
        key = f"{element['type']}/{element['id']}"
        tags = dict(element.get('tags', {}))
        height = city.metres(tags.get('height'))
        low = city.metres(tags.get('min_height'))
        # A tower drawn from its podium up still meets the ground in a voxel city
        if low is not None and height and height >= 100 and low <= 40:
            tags.pop('min_height', None)
            tags.pop('building:min_level', None)
        if height is None and not tags.get('building:levels'):
            outer, _ = city.rings(element)
            area = sum(area_of(ring, grid) for ring in outer)
            u = unit_hash(key)
            if area < 120:
                tags['height'] = '6'
            elif area < 500:
                tags['height'] = str(round(12 + 24 * u))
            else:
                tags['height'] = str(round(30 + 50 * u))
        tags.update(overrides.get(key, {}))
        out.append({**element, 'tags': tags})
    return out


def cell_lat_lon(grid, cols, rows):
    east, south = grid.world(cols, rows)
    return grid.lat0 - south / city.METRES_PER_DEGREE_LAT, grid.lon0 + east / grid.mlon


def seat(location, grid, heights, owner):
    """Tops above sea level, where each owner's walls go down to, and the ground at each cell"""
    cc, rr = np.meshgrid(np.arange(grid.cols) + 0.5, np.arange(grid.rows) + 0.5)
    lat, lon = cell_lat_lon(grid, cc, rr)
    ground = bare.ground_sampler(location)(lat, lon).astype(np.float32)
    built = owner >= 0
    count = owner.max() + 1
    lowest = np.full(count, np.inf, np.float32)
    np.minimum.at(lowest, owner[built], ground[built])
    lowest[~np.isfinite(lowest)] = 0
    tops = np.where(built, lowest[np.maximum(owner, 0)] + heights, 0).astype(np.float32)
    print(f'buildings stand from {lowest.min():.0f} to {lowest.max():.0f} m up')
    return tops, lowest - SINK, ground, lat, lon


def light_styles(location, grid, owner, styles):
    """Named towers' night lights: every owner whose cells' centre is within the radius"""
    built = owner >= 0
    count = len(styles)
    rows, cols = np.nonzero(built)
    weights = np.bincount(owner[built], minlength=count).astype(np.float64)
    weights[weights == 0] = 1
    mean_c = np.bincount(owner[built], cols + 0.5, minlength=count) / weights
    mean_r = np.bincount(owner[built], rows + 0.5, minlength=count) / weights
    for light in location['city'].get('lights', []):
        c, r = grid.cell(*light['at'])
        near = np.hypot(mean_c - c, mean_r - r) * grid.size <= light['radius']
        for o in np.flatnonzero(near):
            styles[o] = LIGHT_STYLES[light['style']]
        print(f"{light['name']}: {int(near.sum())} parts lit as {light['style']}")
    return mean_c, mean_r


def lay_streets(location, grid, heights, land):
    """The street layer (RGBA, clear where nothing is painted), its glow at night (RGB), and the
    masks of the main roads and of the water"""
    inside = grid.inside()
    built = heights > 0
    open_land = ~built & land & inside
    ways = city.fetch(location, 'paths')
    surface_ways = [w for w in ways if w.get('tags', {}).get('tunnel') in (None, 'no') and not str(w.get('tags', {}).get('layer', '0')).startswith('-')]
    roads = np.zeros_like(built)
    main = np.zeros_like(built)
    glow = np.zeros((*built.shape, 3), np.float32)
    for kind, (width, light, driven) in sorted(ROADS.items(), key=lambda item: item[1][0]):
        traced = city.trace(grid, [w for w in surface_ways if w['tags'].get('highway') == kind], max(1, round(width / grid.size))) & open_land
        roads |= traced
        if driven:
            main |= traced
        glow[traced] = np.maximum(glow[traced], LAMP * light * 0.45)
    footways = city.trace(grid, [w for w in surface_ways if w['tags'].get('highway') in FOOTWAYS], 1) & open_land & ~roads
    woods = city.coverage(grid, city.fetch(location, 'woods')) & open_land & ~roads
    parks = (city.coverage(grid, city.fetch(location, 'parks')) & open_land & ~roads) | woods
    sidewalk = open_land & city.grow(built) & ~roads & ~parks
    # Shopfronts light the sidewalks by the main roads; the rest of the pavement a little
    shops = sidewalk & city.grow(main, 2)
    glow[sidewalk] = np.maximum(glow[sidewalk], SHOP * 0.22)
    glow[shops] = np.maximum(glow[shops], SHOP * 0.7)
    glow[footways & parks] = np.maximum(glow[footways & parks], WHITE_LAMP * 0.18)
    shade = city.noise(built.shape, 6, 5) * 0.2 + 0.9
    glow *= shade[..., None]

    image = np.zeros((grid.rows, grid.cols, 4), np.uint8)
    layers = [
        ('sidewalk', (built & land & inside) | sidewalk),
        ('grass', parks & ~woods),
        ('wood', woods),
        ('path', footways),
        ('road', roads),
    ]
    for name, mask in layers:
        image[mask] = [*bytes.fromhex(SURFACES[name][1:]), 255]
    shade = 1 - city.GROUND_SHADE * city.blur(built, city.GROUND_SHADE_RADIUS)
    image[..., :3] = np.clip(image[..., :3] * shade[..., None], 0, 255).astype(np.uint8)
    glow_image = np.zeros((grid.rows, grid.cols, 4), np.uint8)
    glow_image[..., :3] = np.clip(glow * 255, 0, 255).astype(np.uint8)
    glow_image[..., 3] = 255
    counts = {name: int(mask.sum()) for name, mask in layers}
    print(f'streets: {counts}')
    return image, glow_image, main


def drape(location, grid):
    """The terrain's own grid, lifted a little, with each point's place in the street image"""
    points, triangles = dem.build_grid(location)
    up = location['unitsPerMetre'] * location['verticalExaggeration']
    land = points[:, 1] > 0
    points = points.copy()
    points[land, 1] += STREET_LIFT * up
    east = points[:, 0] / location['unitsPerMetre']
    north = -points[:, 2] / location['unitsPerMetre']
    u = east * grid.street[0] + north * grid.street[1]
    v = east * grid.avenue[0] + north * grid.avenue[1]
    uvs = np.stack([(u - grid.u0) / grid.size / grid.cols, (v - grid.v0) / grid.size / grid.rows], 1)
    # Only the triangles that touch land
    tri = triangles.reshape(-1, 3)
    keep = land[tri].any(axis=1)
    return points, uvs.astype(np.float32), tri[keep].ravel().astype(np.uint16)


def roads_for_cars(location, grid, ground_at):
    """The main roads as polylines in world units, each point's height on the ground under it"""
    upm = location['unitsPerMetre']
    up = upm * location['verticalExaggeration']
    lift = (STREET_LIFT + 0.1) * up
    out = []
    for way in city.fetch(location, 'paths'):
        tags = way.get('tags', {})
        kind = ROADS.get(tags.get('highway'))
        if not kind or not kind[2] or tags.get('tunnel') not in (None, 'no'):
            continue
        geometry = way.get('geometry', [])
        if len(geometry) < 2:
            continue
        lat = np.array([p['lat'] for p in geometry])
        lon = np.array([p['lon'] for p in geometry])
        b = location['bbox']
        if not ((lat > b['south']) & (lat < b['north']) & (lon > b['west']) & (lon < b['east'])).all():
            continue
        heights = ground_at(lat, lon)
        if (heights <= 0).any():
            continue  # over the water: a bridge or a pier
        east = (lon - grid.lon0) * grid.mlon
        south = -(lat - grid.lat0) * city.METRES_PER_DEGREE_LAT
        lanes = 2 if kind[0] >= 14 else 1
        one_way = tags.get('oneway') == 'yes'
        line = [lanes * (1 if one_way else -1)]
        for x, y, z in zip(east * upm, heights * up + lift, south * upm):
            line += [round(float(x), 1), round(float(y), 1), round(float(z), 1)]
        out.append(line)
    print(f'{len(out)} roads for cars')
    return out


def neon(location, grid, tops, base, owner, main, land, rng):
    """Signs on the walls that face the main roads in the neon areas: x, y, z, heading, width,
    height (world units), colour, and 1 if it sticks out over the street, flat"""
    areas = location.get('neon', [])
    if not areas:
        return []
    upm = location['unitsPerMetre']
    up = upm * location['verticalExaggeration']
    cc, rr = np.meshgrid(np.arange(grid.cols) + 0.5, np.arange(grid.rows) + 0.5)
    lat, lon = cell_lat_lon(grid, cc, rr)
    zone = np.zeros(tops.shape, bool)
    dense = np.zeros(tops.shape, np.float32)
    for area in areas:
        (alat, alon), radius = area['at'], area['radius']
        d = np.hypot((lat - alat) * city.METRES_PER_DEGREE_LAT, (lon - alon) * grid.mlon)
        inside = d < radius
        zone |= inside
        dense[inside] = np.maximum(dense[inside], area.get('density', 1))
    built = owner >= 0
    su = np.array([grid.street[0], -grid.street[1]])
    sv = np.array([grid.avenue[0], -grid.avenue[1]])
    out = []
    for dr, dc, normal in ((0, 1, su), (0, -1, -su), (1, 0, sv), (-1, 0, -sv)):
        # The cell next to this one, this way, is main road (rolled, the wrapped edge cleared)
        road = np.roll(main, (-dr, -dc), (0, 1))
        road[[0, -1], :] = False
        road[:, [0, -1]] = False
        walls = built & zone & road
        rows, cols = np.nonzero(walls & (rng.random(walls.shape) < NEON_SHARE * dense))
        for r, c in zip(rows, cols):
            o = owner[r, c]
            height = tops[r, c] - (base[o] + SINK)
            if height < 8:
                continue
            east, south = grid.world(c + 0.5 + dc * 0.5, r + 0.5 + dr * 0.5)
            floor = base[o] + SINK
            projecting = rng.random() < 0.65
            if projecting:
                w, h = rng.uniform(2.2, 4.5), rng.uniform(6, 16)
                out_by = w / 2 + 0.4
                heading = math.atan2(normal[1], normal[0]) + math.pi / 2
            else:
                w, h = rng.uniform(5, 12), rng.uniform(2.2, 4.5)
                out_by = 0.35
                heading = math.atan2(normal[1], normal[0])
            top = min(height - 1, rng.uniform(6, 34) + h)
            if top - h < 3.5:
                continue
            y = floor + top - h / 2
            x = east + normal[0] * out_by
            z = south + normal[1] * out_by
            out += [
                round(float(x * upm), 1),
                round(float(y * up), 1),
                round(float(z * upm), 1),
                round(heading, 3),
                round(w * upm, 1),
                round(h * up, 1),
                int(rng.integers(NEON_COLOURS)),
                int(projecting),
            ]
    print(f'{len(out) // 8} neon signs')
    return out


def glows(location, grid, tops, base, owner, styles, mean_c, mean_r, land, rng):
    """The lit buildings near the water, whose lights the harbour reflects: x, z, top (world),
    half width (world) and a colour index, per building"""
    upm = location['unitsPerMetre']
    up = upm * location['verticalExaggeration']
    water = ~land & grid.inside()
    near = city.grow(water, int(GLOW_REACH / grid.size))
    built = owner >= 0
    count = len(styles)
    top = np.zeros(count, np.float32)
    np.maximum.at(top, owner[built], tops[built])
    cells = np.bincount(owner[built], minlength=count)
    by_water = np.zeros(count, bool)
    by_water[owner[built & near]] = True
    out = []
    for o in np.flatnonzero(by_water):
        height = top[o] - base[o] - SINK
        if height < GLOW_HEIGHT:
            continue
        east, south = grid.world(mean_c[o], mean_r[o])
        half = math.sqrt(cells[o]) * grid.size / 2
        style = styles[o]
        colour = style if style >= 3 else int(rng.integers(3))
        out += [round(float(east * upm), 1), round(float(south * upm), 1), round(float(top[o] * up), 1), round(half * upm, 1), colour]
    print(f'{len(out) // 5} buildings shine on the water')
    return out


def check_loop(location, grid, tops, ground):
    """How far the loop's curve clears the roofs and the ground within LOOP_RADIUS"""
    loop = location.get('soaringLoop', {}).get('waypoints', [])
    if not loop:
        return
    surface = np.maximum(tops, ground)
    span = int(LOOP_RADIUS / grid.size) + 1
    worst = math.inf
    for k, points in city.loop_curve(loop):
        lowest = math.inf
        for lat, lon, alt in points:
            c, r = grid.cell(lat, lon)
            r0, r1 = max(int(r) - span, 0), min(int(r) + span + 1, grid.rows)
            c0, c1 = max(int(c) - span, 0), min(int(c) + span + 1, grid.cols)
            under = float(surface[r0:r1, c0:c1].max()) if r1 > r0 and c1 > c0 else 0.0
            lowest = min(lowest, alt - under)
        worst = min(worst, lowest)
        print(f'  leg {k} -> {(k + 1) % len(loop)}: {lowest:.0f} m over what is under it')
    print(f'the loop clears everything by {worst:.0f} m at least')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    location = json.load(open(sys.argv[1]))
    grid = city.Grid(location)
    rng = np.random.default_rng(7)
    elements = prepare(location, grid, city.fetch(location, 'buildings'))
    heights, owner, colours, styles = city.rasterise(location, grid, elements)
    tops, base, ground, lat, lon = seat(location, grid, heights, owner)
    land = dem.sampler(location['bbox'])(lat, lon) > 0
    check_loop(location, grid, tops, ground)
    mean_c, mean_r = light_styles(location, grid, owner, styles)
    image, glow_image, main = lay_streets(location, grid, heights, land)
    extras = grid.extras(location)
    extras['roads'] = roads_for_cars(location, grid, bare.ground_sampler(location))
    extras['signs'] = neon(location, grid, tops, base, owner, main, land, rng)
    extras['glows'] = glows(location, grid, tops, base, owner, styles, mean_c, mean_r, land, rng)
    streets = (*drape(location, grid), image, glow_image)
    city.write_glb(*city.mesh(location, grid, tops, owner, colours, styles, base), extras, streets, sys.argv[2])
    # Packed for the web: 16-bit positions and meshopt (about a third of the size)
    subprocess.run(['node', str(Path(__file__).parent / 'meshopt-glb.mjs'), sys.argv[2], sys.argv[2]], check=True)
