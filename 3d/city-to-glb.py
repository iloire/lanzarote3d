#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow", "tifffile", "imagecodecs"]
# ///
"""
Build a city's buildings as voxels, from OpenStreetMap footprints and heights.

The location JSON (src/locations/<id>.json) gives the bbox and world units per metre, like
3d/dem-to-glb.py, and a `city` section: the voxel size in metres, the street grid's heading
(degrees east of north the avenues run, so the blocks sit square on the grid) and the height of
a building OSM gives none for. Buildings and building parts in the bbox are fetched from the
Overpass API once (cached in 3d/osm-cache/), rasterised onto the turned grid, each cell taking
its tallest building, and meshed as blocks: merged roofs, and walls only where neighbours differ.
Rock outcrops are meshed with them, a few metres high. The ground between is painted on one
textured quad: roads, sidewalks and crosswalks, and parks with their woods, paths, ponds and
grass of varying green, darker at the foot of the walls; the GLB carries the lanes cars drive and
where the park's trees stand, for the app to draw. A location with `city.eiffelTower` gets the
Eiffel Tower too, a lattice of finer voxels in a node of its own.

The GLB is in the terrain's world units (scale 1) and frame (bbox centre at x = z = 0), standing
on the location's flatLand; facades and roofs are coloured per vertex, and each wall carries
its window style (_WINDOWS) and the node the grid (extras), for the app to draw the windows. No normals: every face
has its own vertices, so three.js shades them flat itself.

It also prints how far above the rooftops the location's soaringLoop flies, along the same
curve the app flies through it.

A city on the water (city.water, Venice) takes its land from OSM's islands less its canals,
fills the gaps OSM leaves between its calli (infill), paves its streets, walls its quays, writes
its canals' centrelines for the boats, and can ask for arched windows, hipped tiled roofs in
colours of their own and per-building overrides; city.meshopt packs it with 3d/meshopt-glb.mjs.
See src/locations/README.md.

Usage: uv run 3d/city-to-glb.py src/locations/new-york.json assets/locations/new-york-city.glb
"""
import importlib.util
import io
import json
import math
import re
import struct
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

# Same constants as src/shared/geo.ts
METRES_PER_DEGREE_LAT = 110574
METRES_PER_DEGREE_LON_AT_EQUATOR = 111320
CACHE = Path(__file__).parent / 'osm-cache'
OVERPASS = 'https://overpass-api.de/api/interpreter'
FLOAT, UINT8, UINT16, UINT32 = 5126, 5121, 5123, 5125
METRES_PER_LEVEL = 3.5
# How far either side of the loop the rooftops count when checking its clearance, metres: a
# paramotor's wing is about 14 m across at this scale
LOOP_RADIUS = 10
# The relax app's RIDGE_LOOP_TENSION
LOOP_TENSION = 0.5

# Facade colours by height: brownstone and brick low down, limestone and brick in the middle,
# glass and steel up high (sRGB)
LOW = ['#8a5a44', '#9c5b43', '#7a4b3a', '#a8714f', '#b59a7a', '#8c6d5a']
MID = ['#c9b99a', '#b8a585', '#a35f45', '#d4c7ad', '#9a8f84', '#bfae8f', '#8e5241']
TALL = ['#6f8aa0', '#7d95a8', '#5c7389', '#8fa3b0', '#a7b4bb', '#4f6476']
# What a roof is made of, mixed into its facade's colour; a city's `facades` and `roof` replace these
ROOF_COLOUR = {'colour': '#4a4a4a', 'share': 0.55}


# What to fetch from OpenStreetMap, as Overpass filters, each fetched as ways and relations
LAYERS = {
    'buildings': ['["building"]', '["building:part"]'],
    'parks': ['["leisure"~"^(park|garden|playground|pitch)$"]', '["landuse"~"^(grass|recreation_ground)$"]'],
    'water': ['["natural"="water"]'],
    'woods': ['["natural"~"^(wood|scrub)$"]', '["landuse"="forest"]'],
    'rocks': ['["natural"~"^(bare_rock|rock)$"]'],
    'paths': ['["highway"]'],
    # A city on the water (city.water): its islands, its canals and basins as polygons (not the
    # lagoon round them), the canals' centrelines and its squares
    'islands': ['["place"~"^(island|islet)$"]'],
    'canals': ['["natural"="water"]["water"!="lagoon"]'],
    'waterways': ['["waterway"="canal"]'],
    'squares': ['["place"="square"]'],
}
# Layers fetched as ways alone: a highway's relations are its bus and bike routes
WAYS_ONLY = {'paths', 'waterways'}


def fetch(location, layer):
    """One layer of the bbox from OpenStreetMap, from the cache or Overpass"""
    b = location['bbox']
    box = f"{b['south']},{b['west']},{b['north']},{b['east']}"
    # Named by the bbox too, so changing it fetches again
    path = CACHE / f"{location['id']}-{zlib.crc32(box.encode()):08x}-{layer}.json"
    if not path.exists():
        kinds = ('way',) if layer in WAYS_ONLY else ('way', 'relation')
        parts = ''.join(f'{kind}{f}({box});' for f in LAYERS[layer] for kind in kinds)
        # body, not tags: a relation's members (and their geometry) come only with its body
        query = f'[out:json][timeout:300];({parts});out body geom;'
        print(f'fetching {layer} from Overpass')
        request = urllib.request.Request(
            OVERPASS,
            data=urllib.parse.urlencode({'data': query}).encode(),
            headers={'User-Agent': 'lanzarote3d city-to-glb'},
        )
        CACHE.mkdir(exist_ok=True)
        # Overpass is busy now and then (429, 502, 504): wait and ask again
        for attempt in range(4):
            try:
                path.write_bytes(urllib.request.urlopen(request, timeout=320).read())
                break
            except urllib.error.HTTPError as error:
                if attempt == 3 or error.code not in (429, 502, 503, 504):
                    raise
                print(f'Overpass said {error.code}, trying again')
                time.sleep(20 * (attempt + 1))
    return json.loads(path.read_text())['elements']


def metres(value):
    """A length tag ('120', '120 m', '394 ft') in metres, or None"""
    if not value:
        return None
    match = re.match(r'\s*([\d.]+)\s*(m|ft|\')?', value)
    if not match:
        return None
    number = float(match.group(1))
    return number * 0.3048 if match.group(2) in ('ft', "'") else number


def height_of(tags, default):
    height = metres(tags.get('height'))
    if height is None and tags.get('building:levels'):
        levels = metres(tags['building:levels'])
        height = levels * METRES_PER_LEVEL if levels else None
    return height or default


def rings(element):
    """Outer and inner rings of a way or a multipolygon relation, as [(lat, lon), ...]"""
    if element['type'] == 'way':
        return [[(p['lat'], p['lon']) for p in element.get('geometry', [])]], []
    lines = {'outer': [], 'inner': []}
    for member in element.get('members', []):
        if member.get('type') == 'way' and 'geometry' in member:
            line = [(p['lat'], p['lon']) for p in member['geometry']]
            lines['inner' if member.get('role') == 'inner' else 'outer'].append(line)
    return join(lines['outer']), join(lines['inner'])


def join(lines):
    """A multipolygon's member ways joined end to end into rings: a river's bank is many ways"""
    lines, out = [list(line) for line in lines if line], []
    while lines:
        ring = lines.pop()
        while ring[0] != ring[-1]:
            for k, line in enumerate(lines):
                if line[0] == ring[-1]:
                    ring += line[1:]
                elif line[-1] == ring[-1]:
                    ring += line[::-1][1:]
                elif line[-1] == ring[0]:
                    ring = line[:-1] + ring
                elif line[0] == ring[0]:
                    ring = line[:0:-1] + ring
                else:
                    continue
                del lines[k]
                break
            else:
                break  # cut off by the bbox: close it straight across
        out.append(ring)
    return out


def srgb_to_linear(hex_colour):
    c = np.array([int(hex_colour[i : i + 2], 16) / 255 for i in (1, 3, 5)])
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


# Window styles, per vertex in _WINDOWS for the app's shader: none (roofs), punched windows in
# brick and stone, glass curtain walls on the towers. 3-6 are 3d/city-on-hills.py's lit towers. A
# city may ask for arched windows with shutters on plaster (city.windows: "arched"), tiled roofs
# (city.pitchedRoofs), and the Doge's Palace's arcades and pink lozenges for a building
# (city.buildings[...].windows: "ducale")
ROOF, PUNCHED, CURTAIN = 0, 1, 2
ARCHED, TILES, DUCALE = 7, 8, 9
WINDOW_STYLES = {'none': ROOF, 'punched': PUNCHED, 'curtain': CURTAIN, 'arched': ARCHED, 'ducale': DUCALE}


def pick(palette, key):
    return palette[zlib.crc32(key.encode()) % len(palette)]


def palettes_of(location):
    """Facade colours by height, the city's `facades` over the defaults"""
    return {'low': LOW, 'mid': MID, 'tall': TALL, **location['city'].get('facades', {})}


def facade(tags, height, key, palettes):
    colour = tags.get('building:colour', '')
    if re.fullmatch(r'#[0-9a-fA-F]{6}', colour):
        return colour
    palette = palettes['tall'] if height >= 120 else palettes['mid'] if height >= 30 else palettes['low']
    return pick(palette, key)


class Grid:
    """The voxel grid, turned to the street grid: u across town, v up the avenues"""

    def __init__(self, location):
        b, city = location['bbox'], location['city']
        self.lat0 = (b['north'] + b['south']) / 2
        self.lon0 = (b['east'] + b['west']) / 2
        self.mlon = math.cos(math.radians(self.lat0)) * METRES_PER_DEGREE_LON_AT_EQUATOR
        self.size = city['voxel']
        theta = math.radians(city['gridHeading'])
        self.avenue = np.array([math.sin(theta), math.cos(theta)])  # (east, north)
        self.street = np.array([math.cos(theta), -math.sin(theta)])
        corners = [self.uv(lat, lon) for lat in (b['south'], b['north']) for lon in (b['west'], b['east'])]
        us, vs = zip(*corners)
        self.u0, self.v0 = min(us), min(vs)
        self.cols = int((max(us) - self.u0) / self.size) + 1
        self.rows = int((max(vs) - self.v0) / self.size) + 1
        self.half_w = (b['east'] - b['west']) * self.mlon / 2
        self.half_d = (b['north'] - b['south']) * METRES_PER_DEGREE_LAT / 2

    def en(self, lat, lon):
        return np.array([(lon - self.lon0) * self.mlon, (lat - self.lat0) * METRES_PER_DEGREE_LAT])

    def uv(self, lat, lon):
        p = self.en(lat, lon)
        return float(p @ self.street), float(p @ self.avenue)

    def cell(self, lat, lon):
        """Fractional (col, row) of a point"""
        u, v = self.uv(lat, lon)
        return (u - self.u0) / self.size, (v - self.v0) / self.size

    def world(self, col, row):
        """Metres east and south of the centre of a grid corner"""
        u, v = self.u0 + col * self.size, self.v0 + row * self.size
        east = u * self.street[0] + v * self.avenue[0]
        north = u * self.street[1] + v * self.avenue[1]
        return east, -north

    def extras(self, location):
        """The grid as the app's window shader needs it, in the node's extras (userData in three.js)"""
        up = location['unitsPerMetre'] * location['verticalExaggeration']
        return {
            'grid': {
                'origin': [self.u0, self.v0],
                'size': self.size,
                'street': self.street.tolist(),
                'avenue': self.avenue.tolist(),
                'unitsPerMetre': location['unitsPerMetre'],
                'ground': location.get('flatLand', 0) * up,
                'up': up,
            }
        }

    def world_xz(self, col, row, location):
        """World x and z of a grid point, rounded, for the GLB's extras"""
        east, south = self.world(col, row)
        upm = location['unitsPerMetre']
        return [round(float(east) * upm, 1), round(float(south) * upm, 1)]

    def inside(self):
        """Cells whose centre lies in the bbox"""
        cc, rr = np.meshgrid(np.arange(self.cols) + 0.5, np.arange(self.rows) + 0.5)
        east, south = self.world(cc, rr)
        return (np.abs(east) <= self.half_w) & (np.abs(south) <= self.half_d)


def cells_of(grid, outer, inner):
    """The cells a polygon with holes covers: (rows, cols) slices and a mask, or None"""
    polygons = [[grid.cell(lat, lon) for lat, lon in ring] for ring in outer + inner]
    xs = [x for poly in polygons for x, _ in poly]
    ys = [y for poly in polygons for _, y in poly]
    if not xs:
        return None
    c0, c1 = max(int(min(xs)), 0), min(int(max(xs)) + 1, grid.cols)
    r0, r1 = max(int(min(ys)), 0), min(int(max(ys)) + 1, grid.rows)
    if c1 <= c0 or r1 <= r0:
        return None
    mask = Image.new('1', (c1 - c0, r1 - r0), 0)
    draw = ImageDraw.Draw(mask)
    for k, poly in enumerate(polygons):
        points = [(x - c0 - 0.5, y - r0 - 0.5) for x, y in poly]
        if len(points) >= 3:
            draw.polygon(points, fill=1 if k < len(outer) else 0)
    return (slice(r0, r1), slice(c0, c1)), np.array(mask, bool)


def trace(grid, elements, width):
    """Every cell the ways' lines run over, `width` cells wide"""
    image = Image.new('1', (grid.cols, grid.rows), 0)
    draw = ImageDraw.Draw(image)
    for element in elements:
        points = [grid.cell(p['lat'], p['lon']) for p in element.get('geometry', [])]
        if len(points) >= 2:
            draw.line([(x - 0.5, y - 0.5) for x, y in points], fill=1, width=width)
    return np.array(image, bool)


def coverage(grid, elements):
    """Every cell any of the elements' polygons covers"""
    covered = np.zeros((grid.rows, grid.cols), bool)
    for element in elements:
        found = cells_of(grid, *rings(element))
        if found:
            covered[found[0]] |= found[1]
    return covered


def rasterise(location, grid, elements, roofs=None):
    """Height in metres and facade colour index of every cell, the tallest building winning.
    `city.buildings` overrides a building by its "way/123" key: skip it (a hand-built landmark
    stands there), give it its footprint alone, a height, colours or a window style. Pass a list as
    `roofs` to get each building's own roof colour in it, or None (from city.roof.colours)"""
    city = location['city']
    default = city['defaultHeight']
    palettes = palettes_of(location)
    roof_colours = city.get('roof', {}).get('colours')
    overrides = city.get('buildings', {})
    arched = city.get('windows') == 'arched'
    heights = np.zeros((grid.rows, grid.cols), np.float32)
    owner = np.full((grid.rows, grid.cols), -1, np.int32)
    # Footprints of the buildings a hand-built landmark replaces: nothing else stands there either
    skipped = np.zeros((grid.rows, grid.cols), bool)
    # Landmarks whose footprint holds them alone, over the building parts OSM draws inside them
    alone = []
    colours, styles = [], []
    for element in elements:
        tags = element.get('tags', {})
        if tags.get('building') in ('no', 'roof') or 'min_height' in tags or 'building:min_level' in tags:
            continue  # canopies, bridges and overhangs float; leave the street under them open
        outer, inner = rings(element)
        if not outer:
            continue
        key = f"{element['type']}/{element['id']}"
        override = overrides.get(key, {})
        found = cells_of(grid, outer, inner)
        if not found:
            continue
        where, cells = found
        if override.get('skip'):
            skipped[where] |= cells
            continue
        height = override.get('height') or height_of(tags, default)
        region = heights[where]
        wins = cells & (height > region)
        region[wins] = height
        owner[where][wins] = len(colours)
        if override.get('exclusive'):
            alone.append((where, cells, height, len(colours)))
        colours.append(override.get('colour') or facade(tags, height, f"{element['type']}{element['id']}", palettes))
        if 'windows' in override:
            styles.append(WINDOW_STYLES[override['windows']])
        else:
            styles.append(ARCHED if arched else CURTAIN if height >= 120 else PUNCHED)
        if roofs is not None:
            roofs.append(override.get('roof') or (pick(roof_colours, key) if roof_colours else None))
    for where, cells, height, index in alone:
        heights[where][cells] = height
        owner[where][cells] = index
    outside = ~grid.inside() | skipped
    heights[outside] = 0
    owner[outside] = -1
    print(f'{len(colours)} buildings on a {grid.cols}x{grid.rows} grid of {grid.size} m, tallest {heights.max():.0f} m')
    return heights, owner, colours, styles


# The street layer, painted a texel a cell on one quad under the buildings (sRGB): as blocks it
# came to 300k triangles, chopped up by crosswalks and park edges
SURFACES = {
    'road': '#3b3d41',
    'crosswalk': '#e4e4de',
    'sidewalk': '#a19e95',
    'grass': '#4a7236',
    'wood': '#3d5a2c',
    'path': '#a69b82',
    'drive': '#3b3d41',
    'pond': '#2d5268',
    # A city on the water: trachyte paving, white Istrian stone along the quays and in the
    # squares' patterns, and the bridges' stone
    'paving': '#8b867c',
    'kerb': '#b9b2a3',
    'bridge': '#cbc3b2',
}
# Park footways a cell wide, its drives two
FOOTWAYS = {'footway', 'path', 'cycleway', 'bridleway', 'steps', 'pedestrian', 'track'}
# How much darker the ground is with every cell round it built on, out to this many cells: the
# street at the foot of a wall sees less sky
GROUND_SHADE, GROUND_SHADE_RADIUS = 0.45, 3
# Grass greener and yellower over ~120 m and ~25 m, so a park isn't one flat green
GRASS_VARIES = 0.5
# Trees a cell: woods dense, lawns in clumps with open meadows between
WOOD_TREES, PARK_TREES = 0.16, 0.07
# Rock outcrops: this high at their edge, metres, and this much higher a cell further in
ROCK_BASE, ROCK_STEP, ROCK_STEPS = 1.2, 1.4, 3
ROCK = '#8f8b84'
# The street quad sits this far above the ground, metres, clear of the terrain under it
STREET_LIFT = 0.1
# Open runs at least this long, in cells, are avenues and streets; where both cross, a junction
THROUGH = 40
# A lane for cars needs a run this long, in cells
LANE_MIN = 60
# A road bridge this many cells wide
BRIDGE = 7


def dem():
    """3d/dem-to-glb.py, for its height sampler: land is where the DEM is above 0 m"""
    spec = importlib.util.spec_from_file_location('dem_to_glb', Path(__file__).parent / 'dem-to-glb.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def blur(mask, radius):
    """The share of the cells in the square `radius` round each that are in the mask"""
    k = 2 * radius + 1
    summed = np.pad(np.pad(mask.astype(np.float32), radius).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    return (summed[k:, k:] - summed[:-k, k:] - summed[k:, :-k] + summed[:-k, :-k]) / (k * k)


def noise(shape, scale, seed):
    """Smooth value noise in 0-1 that changes over about `scale` cells"""
    rows, cols = shape
    coarse = np.random.default_rng(seed).random((rows // scale + 2, cols // scale + 2)).astype(np.float32)
    smooth = Image.fromarray(coarse, 'F').resize((coarse.shape[1] * scale, coarse.shape[0] * scale), Image.BICUBIC)
    return np.clip(np.array(smooth)[:rows, :cols], 0, 1)


def runs(mask, axis):
    """The length of the run of True each cell sits in, along rows (axis 1) or columns (axis 0)"""
    out = np.zeros(mask.shape, np.int32)
    lines = mask if axis == 1 else mask.T
    target = out if axis == 1 else out.T
    for k, line in enumerate(lines):
        edges = np.flatnonzero(np.diff(np.concatenate(([0], line.astype(np.int8), [0]))))
        for start, end in zip(edges[::2], edges[1::2]):
            target[k, start:end] = end - start
    return out


def grow(mask, steps=1):
    """The mask spread `steps` cells up, down, left and right"""
    out = mask.copy()
    for _ in range(steps):
        spread = out.copy()
        spread[1:] |= out[:-1]
        spread[:-1] |= out[1:]
        spread[:, 1:] |= out[:, :-1]
        spread[:, :-1] |= out[:, 1:]
        out = spread
    return out


# Canals narrower than this, metres, are traced from their centreline when OSM has no water
# polygon for them; a canal this wide or wider carries the big boats
RIO_WIDTH, WIDE_CANAL = 6, 25
# Bridges over the canals, cells wide
CANAL_BRIDGE = 2
# The squares' white Istrian stone lines, every this many cells
SQUARE_PATTERN = 5


def water_land(location, grid):
    """A city on the water (city.water): its land is OpenStreetMap's islands less its canals,
    basins and harbours, and less the rii it maps only as a line"""
    islands = coverage(grid, fetch(location, 'islands'))
    water = coverage(grid, fetch(location, 'canals'))
    rii = np.zeros_like(water)
    for canal in fetch(location, 'waterways'):
        tags = canal.get('tags', {})
        if tags.get('tunnel') or tags.get('layer', '0').startswith('-'):
            continue
        width = max(1, round((metres(tags.get('width')) or RIO_WIDTH) / grid.size))
        rii |= trace(grid, [canal], width)
    land = islands & ~water & ~rii & grid.inside()
    print(f'land: {int(land.sum())} of {land.size} cells')
    return land


# Infill (city.infill): houses this many storeys high, on lots about this many cells a side, on
# land within this many cells of a mapped calle
INFILL_STOREYS, INFILL_LOT, INFILL_REACH = (3, 4, 4, 4, 5), 6, 10


def shrink(mask):
    return mask & ~grow(~mask)


def infill(location, grid, heights, owner, colours, styles, roofs, land):
    """OpenStreetMap leaves gaps in a dense old town's buildings: build the land between its calli
    and squares up in lots of houses, each its own height and colour, keeping the calli, the
    squares and the parks open. Slivers thinner than three cells are left open too"""
    city = location['city']
    highways = fetch(location, 'paths')
    calli = trace(grid, [w for w in highways if w.get('tags', {}).get('area') != 'yes'], 1)
    campi = coverage(grid, [w for w in highways if w.get('tags', {}).get('area') == 'yes'] + fetch(location, 'squares'))
    parks = coverage(grid, fetch(location, 'parks') + fetch(location, 'woods'))
    fill = land & (heights == 0) & ~calli & ~campi & ~parks & grow(calli | campi, INFILL_REACH)
    fill = grow(shrink(fill)) & fill
    # Lots on a lattice warped by noise, so they don't line up
    rows, cols = np.nonzero(fill)
    warp_r, warp_c = noise(fill.shape, 8, 11) * 4, noise(fill.shape, 8, 12) * 4
    lot_r = ((rows + warp_r[rows, cols]) // INFILL_LOT).astype(np.int64)
    lot_c = ((cols + warp_c[rows, cols]) // INFILL_LOT).astype(np.int64)
    lots, which = np.unique(lot_r * 100000 + lot_c, return_inverse=True)
    low = palettes_of(location)['low']
    roof_colours = city.get('roof', {}).get('colours')
    first = len(colours)
    for k, lot in enumerate(lots):
        key = f'infill{lot}'
        colours.append(pick(low, key))
        styles.append(ARCHED if city.get('windows') == 'arched' else PUNCHED)
        roofs.append(pick(roof_colours, key) if roof_colours else None)
    storeys = np.array([pick(INFILL_STOREYS, f'storeys{lot}') for lot in lots], np.float32)
    heights[rows, cols] = storeys[which] * METRES_PER_LEVEL
    owner[rows, cols] = first + which
    print(f'infill: {len(rows)} cells in {len(lots)} lots')


def canals(location, grid, land):
    """The canals' centrelines boats follow, clipped to the water: [{width, points}] with the
    water's width in metres and the points as world x, z, flat"""
    # How far each water cell is from the land, in cells, out to WIDE_CANAL
    reach = int(WIDE_CANAL / grid.size) + 1
    distance = np.full(land.shape, reach, np.float32)
    seen = land.copy()
    for step in range(reach):
        distance[seen & (distance == reach)] = step
        seen = grow(seen)
    water = ~land & grid.inside()
    out = []
    for canal in fetch(location, 'waterways'):
        tags = canal.get('tags', {})
        if tags.get('tunnel'):
            continue
        # Points every cell along the line, kept while they're on the water
        points = [grid.cell(p['lat'], p['lon']) for p in canal.get('geometry', [])]
        dense = []
        for (c0, r0), (c1, r1) in zip(points, points[1:]):
            steps = max(1, int(math.hypot(c1 - c0, r1 - r0)))
            dense += [(c0 + (c1 - c0) * t / steps, r0 + (r1 - r0) * t / steps) for t in range(steps)]
        run = []
        for c, r in dense + [(None, None)]:
            if c is not None and 0 <= r < grid.rows and 0 <= c < grid.cols and water[int(r), int(c)]:
                run.append((c, r))
                continue
            # 40 m at least, so a boat has somewhere to go
            if len(run) * grid.size >= 40:
                widths = [distance[int(r_), int(c_)] for c_, r_ in run]
                width = 2 * float(np.median(widths)) * grid.size
                xz = [coordinate for c_, r_ in run[:: max(1, int(4 / grid.size))] for coordinate in grid.world_xz(c_, r_, location)]
                out.append({'width': round(width, 1), 'name': tags.get('name', ''), 'points': xz})
            run = []
    print(f'{len(out)} canal runs for boats, {sum(1 for c in out if c["width"] >= WIDE_CANAL)} wide')
    return out


def lay_streets(location, grid, heights, land=None):
    """Paint the land between the buildings as sidewalks, roads, crosswalks, grass, woods, park
    paths and ponds, and find the lanes cars drive: returns an RGBA image a pixel a cell (clear
    off the land), the lanes as grid (col, row) end points, and the park cells trees may grow
    on and which of them are woods. A city on the water passes its land, and is paved instead"""
    cc, rr = np.meshgrid(np.arange(grid.cols) + 0.5, np.arange(grid.rows) + 0.5)
    on_water = land is not None
    if land is None:
        east, south = grid.world(cc, rr)
        lat = grid.lat0 - south / METRES_PER_DEGREE_LAT
        lon = grid.lon0 + east / grid.mlon
        land = dem().sampler(location['bbox'])(lat, lon) > 0
    built = heights > 0
    open_land = ~built & land & grid.inside()
    woods = coverage(grid, fetch(location, 'woods')) & open_land
    parks = (coverage(grid, fetch(location, 'parks')) & open_land) | woods
    ponds = coverage(grid, fetch(location, 'water')) & open_land
    highways = fetch(location, 'paths')
    # Bridges carry the road over a river: roadway, not water
    ponds &= ~trace(grid, [w for w in highways if w.get('tags', {}).get('bridge') and w['tags'].get('highway') not in FOOTWAYS], BRIDGE)
    woods &= ~ponds
    footways = trace(grid, [w for w in highways if w.get('tags', {}).get('highway') in FOOTWAYS], 1)
    drives = trace(grid, [w for w in highways if w.get('tags', {}).get('highway') not in FOOTWAYS], 2)
    drive = drives & parks & ~ponds
    path = footways & parks & ~ponds & ~drive
    sidewalk = open_land & grow(built) & ~parks & ~ponds
    road = open_land & ~sidewalk & ~parks & ~ponds

    # Avenues run up the columns, streets along the rows; where both are long, a junction
    through = road | sidewalk
    up, across = runs(through, 0), runs(through, 1)
    junction = road & (up >= THROUGH) & (across >= THROUGH)
    avenue = road & (up >= THROUGH) & ~junction
    street = road & (across >= THROUGH) & ~junction
    # Zebra stripes a cell wide just outside each junction, across the road they cross
    zebra = np.zeros_like(road)
    near_v = np.zeros_like(road)
    near_v[1:] |= junction[:-1]
    near_v[:-1] |= junction[1:]
    near_u = np.zeros_like(road)
    near_u[:, 1:] |= junction[:, :-1]
    near_u[:, :-1] |= junction[:, 1:]
    zebra |= avenue & near_v & (cc.astype(int) % 2 == 0)
    zebra |= street & near_u & (rr.astype(int) % 2 == 0)

    layers = [
        ('road', road & ~zebra),
        ('crosswalk', zebra),
        ('sidewalk', sidewalk),
        ('grass', parks & ~woods),
        ('wood', woods),
        ('path', path),
        ('drive', drive),
        ('pond', ponds),
    ]
    if on_water:
        # Calli and campi are paved, edged in white stone along the water, the squares laid in a
        # pattern of white lines; the bridges carry the paving over the canals
        paving = open_land & ~parks & ~ponds
        water = ~land & grid.inside()
        squares = coverage(grid, fetch(location, 'squares')) & paving
        lines = (cc.astype(int) % SQUARE_PATTERN == 0) | (rr.astype(int) % SQUARE_PATTERN == 0)
        bridges = trace(grid, [w for w in highways if w.get('tags', {}).get('bridge') not in (None, 'no')], CANAL_BRIDGE) & water
        layers = [
            ('paving', paving),
            ('kerb', (paving & grow(water)) | (squares & lines)),
            ('grass', parks & ~woods),
            ('wood', woods),
            ('path', path),
            ('pond', ponds),
            ('bridge', bridges),
        ]
        road[:] = False
        avenue[:] = street[:] = junction[:] = False
    image = np.zeros((grid.rows, grid.cols, 4), np.uint8)
    image[built & land] = [*bytes.fromhex(SURFACES['sidewalk'][1:]), 255]
    for name, mask in layers:
        image[mask] = [*bytes.fromhex(SURFACES[name][1:]), 255]
    # Shade it: darker at the foot of the buildings, and the grass varying
    shade = 1 - GROUND_SHADE * blur(built, GROUND_SHADE_RADIUS)
    lawn = parks & ~path & ~drive & ~ponds
    varies = 0.6 * noise(built.shape, 40, 1) + 0.4 * noise(built.shape, 8, 2)
    shade[lawn] *= (1 - GRASS_VARIES / 2 + GRASS_VARIES * varies)[lawn]
    if on_water:
        # Worn stone: lighter and darker over a few metres
        worn = paving & ~lawn
        shade[worn] *= (0.9 + 0.2 * noise(built.shape, 3, 5))[worn]
    rgb = image[..., :3].astype(np.float32) * shade[..., None]
    # Yellower where the lawn is lighter, so the variation is in hue as well as light
    rgb[..., 0][lawn] *= (0.92 + 0.16 * varies)[lawn]
    image[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)

    # Lanes: down each run of roadway long enough, two to an avenue or street a third of the way
    # in from each side, one if it's narrow
    lanes = []
    for axis, mask in ((0, avenue | junction), (1, street | junction)):
        lines = mask.T if axis == 0 else mask
        length = runs(mask, axis).T if axis == 0 else runs(mask, axis)
        long = (length >= LANE_MIN)
        busy = long.any(axis=1)
        k = 0
        while k < len(lines):
            if not busy[k]:
                k += 1
                continue
            start = k
            while k < len(lines) and busy[k]:
                k += 1
            width = k - start
            middle = (start + k) // 2
            picks = [start + width / 3, start + 2 * width / 3] if width >= 4 else [start + width / 2]
            edges = np.flatnonzero(np.diff(np.concatenate(([0], long[middle].astype(np.int8), [0]))))
            for a, b in zip(edges[::2], edges[1::2]):
                for n, at in enumerate(picks):
                    ends = [(at, a), (at, b)] if axis == 0 else [(a, at), (b, at)]
                    lanes.append(ends if n % 2 == 0 else ends[::-1])
    counts = {name: int(mask.sum()) for name, mask in layers}
    print(f'streets: {counts}, {len(lanes)} lanes')
    free = parks & ~ponds & ~grow(path | drive) & ~grow(built, 2)
    return image, lanes, free, woods


def outcrops(location, grid, heights):
    """Height in metres of the rock outcrops on open ground, higher a cell further in from their edge"""
    rock = coverage(grid, fetch(location, 'rocks')) & (heights == 0) & grid.inside()
    out = np.where(rock, ROCK_BASE, 0).astype(np.float32)
    inner = rock
    for _ in range(ROCK_STEPS):
        inner = inner & ~grow(~inner)
        out[inner] += ROCK_STEP
    print(f'{int(rock.sum())} cells of rock')
    return out


def plant(location, grid, free, woods):
    """Trees on the park cells free of paths and rocks: world x, z and a scale each, flat"""
    rng = np.random.default_rng(3)
    clumps = np.clip((noise(free.shape, 12, 4) - 0.35) / 0.4, 0, 1) ** 2
    chance = np.where(woods, WOOD_TREES, PARK_TREES * clumps)
    rows, cols = np.nonzero(free & (rng.random(free.shape) < chance))
    col = cols + rng.random(len(cols))
    row = rows + rng.random(len(rows))
    east, south = grid.world(col, row)
    upm = location['unitsPerMetre']
    scale = rng.uniform(0.7, 1.3, len(cols))
    print(f'{len(cols)} trees')
    return np.round(np.stack([east * upm, south * upm, scale], 1), 2).ravel().tolist()


# Pitched roofs (city.pitchedRoofs): each roof rectangle is hipped, its ridge down the long side,
# this steep, and no higher than this, metres
ROOF_PITCH, ROOF_RISE = 0.5, 3.5


def mesh(location, grid, heights, owner, colours, styles, base=None, roofs=None, walls_only=False):
    """Merged roofs and walls as positions, colours, window styles and triangles. On hills
    (3d/city-on-hills.py) heights are tops above sea level and `base` is where each owner's walls
    go down to, metres, where nothing stands beside them. A building with a colour in `roofs` has
    a roof of that colour, hipped and tiled if the city asks (city.pitchedRoofs); `walls_only`
    leaves the tops open"""
    upm = location['unitsPerMetre']
    up = upm * location['verticalExaggeration']
    ground = location.get('flatLand', 0) * up
    # A shade darker than the palette: the island's bright sun washes them out
    linear = np.array([srgb_to_linear(c) for c in colours] or [[0, 0, 0]]) * 0.8
    # Roofs a darker, greyer shade of their facade, or mostly the city's own roof colour
    roof = {**ROOF_COLOUR, **location['city'].get('roof', {})}
    roof_of = linear * (1 - roof['share']) + srgb_to_linear(roof['colour']) * roof['share']
    pitched = location['city'].get('pitchedRoofs', False)
    tiled = np.zeros(len(roof_of), bool)
    for k, own in enumerate(roofs or []):
        if own:
            roof_of[k] = srgb_to_linear(own) * 0.8
            tiled[k] = True
    pos, col, win, idx = [], [], [], []
    def hip(corners, ridge, long_u, colour):
        # Corners a, b, c, d round the rectangle from (c, r); the ridge ends nearest a and nearest c
        base_ = len(pos)
        pos.extend(corners + ridge)
        col.extend([colour] * 6)
        win.extend([TILES] * 6)
        a, b, c_, d, r0, r1_ = range(base_, base_ + 6)
        faces = [(a, b, r1_, r0), (c_, d, r0, r1_), (b, c_, r1_), (d, a, r0)] if long_u else [(a, b, r0), (b, c_, r1_, r0), (c_, d, r1_), (d, a, r0, r1_)]
        for face in faces:
            for k in range(1, len(face) - 1):
                t = [face[0], face[k], face[k + 1]]
                p0, p1, p2 = (np.array(pos[i]) for i in t)
                # Wound counter-clockwise seen from above
                if np.cross(p1 - p0, p2 - p0)[1] < 0:
                    t = t[::-1]
                idx.extend(t)


    def quad(corners, normal, colour, style=ROOF):
        # Wound counter-clockwise seen from the side the normal points to
        e1, e2 = np.subtract(corners[1], corners[0]), np.subtract(corners[2], corners[0])
        if np.dot(np.cross(e1, e2), normal) < 0:
            corners = corners[::-1]
        base = len(pos)
        pos.extend(corners)
        col.extend([colour] * 4)
        win.extend([style] * 4)
        idx.extend([base, base + 1, base + 2, base, base + 2, base + 3])

    def at(col_, row, h):
        east, south = grid.world(col_, row)
        return (east * upm, ground + h * up, south * upm)

    # The grid's u axis (cols) runs along `street`, v (rows) along `avenue`; in world x/z
    su = (grid.street[0], 0.0, -grid.street[1])
    sv = (grid.avenue[0], 0.0, -grid.avenue[1])

    # Roofs: grow each run of equal height and owner along a row, then down while rows match
    done = np.zeros_like(heights, bool)
    for r in range(grid.rows):
        for c in range(grid.cols):
            if done[r, c] or heights[r, c] <= 0:
                continue
            h, o = heights[r, c], owner[r, c]
            c1 = c
            while c1 + 1 < grid.cols and not done[r, c1 + 1] and heights[r, c1 + 1] == h and owner[r, c1 + 1] == o:
                c1 += 1
            r1 = r
            while r1 + 1 < grid.rows:
                row = slice(c, c1 + 1)
                if (done[r1 + 1, row].any() or (heights[r1 + 1, row] != h).any() or (owner[r1 + 1, row] != o).any()):
                    break
                r1 += 1
            done[r : r1 + 1, c : c1 + 1] = True
            if walls_only:
                continue
            if not (pitched and tiled[o]):
                quad([at(c, r, h), at(c, r1 + 1, h), at(c1 + 1, r1 + 1, h), at(c1 + 1, r, h)], (0, 1, 0), roof_of[o])
                continue
            # Hipped: a ridge down the middle of the long side, inset half the short side from
            # each end, four tiled slopes sharing six vertices (the app shades them flat)
            across, along = (r1 + 1 - r), (c1 + 1 - c)
            rise = min(ROOF_PITCH * min(across, along) * grid.size / 2, ROOF_RISE)
            top = h + rise / location['verticalExaggeration']
            if along >= across:
                m, inset = (r + r1 + 1) / 2, across / 2
                ridge = [at(c + inset, m, top), at(c1 + 1 - inset, m, top)]
            else:
                m, inset = (c + c1 + 1) / 2, along / 2
                ridge = [at(m, r + inset, top), at(m, r1 + 1 - inset, top)]
            corners = [at(c, r, h), at(c1 + 1, r, h), at(c1 + 1, r1 + 1, h), at(c, r1 + 1, h)]
            hip(corners, ridge, along >= across, roof_of[o])

    # Walls between neighbours of different height, facing the lower one, in the taller's colour
    padded_h = np.pad(heights, 1)
    padded_o = np.pad(owner, 1, constant_values=-1)
    for axis in (0, 1):
        a_h, b_h = (padded_h[:-1, 1:-1], padded_h[1:, 1:-1]) if axis == 0 else (padded_h[1:-1, :-1], padded_h[1:-1, 1:])
        a_o, b_o = (padded_o[:-1, 1:-1], padded_o[1:, 1:-1]) if axis == 0 else (padded_o[1:-1, :-1], padded_o[1:-1, 1:])
        # For axis 0 the boundary k sits between rows k-1 and k; for axis 1 between cols k-1 and k
        lines = a_h.shape[0] if axis == 0 else a_h.shape[1]
        for k in range(lines):
            ah, bh = (a_h[k], b_h[k]) if axis == 0 else (a_h[:, k], b_h[:, k])
            ao, bo = (a_o[k], b_o[k]) if axis == 0 else (a_o[:, k], b_o[:, k])
            n = len(ah)
            i = 0
            while i < n:
                if ah[i] == bh[i]:
                    i += 1
                    continue
                key = (ah[i], bh[i], ao[i], bo[i])
                j = i
                while j + 1 < n and (ah[j + 1], bh[j + 1], ao[j + 1], bo[j + 1]) == key:
                    j += 1
                lo, hi = sorted((float(ah[i]), float(bh[i])))
                taller = ao[i] if ah[i] > bh[i] else bo[i]
                if base is not None and lo == 0:
                    lo = float(base[taller])
                # The wall faces from the taller side towards the lower one
                sign = 1 if ah[i] > bh[i] else -1
                if axis == 0:
                    p0, p1 = (i, k), (j + 1, k)
                    normal = tuple(sign * x for x in sv)
                else:
                    p0, p1 = (k, i), (k, j + 1)
                    normal = tuple(sign * x for x in su)
                quad([at(*p0, lo), at(*p1, lo), at(*p1, hi), at(*p0, hi)], normal, linear[taller], styles[taller])
                i = j + 1

    positions = np.array(pos, np.float32)
    colours8 = np.round(np.clip(np.array(col), 0, 1) * 255).astype(np.uint8)
    triangles = np.array(idx, np.uint32)
    print(f'{len(positions)} vertices, {len(triangles) // 3} triangles')
    windows = np.array(win, np.uint8)
    return positions, colours8, windows, triangles


# The Eiffel Tower, by height in metres: the half-width from its axis out to its faces, and to the
# inner edge of its legs, where they part to leave the arches (0 once they've joined in one shaft);
# its floors' heights; and a lattice of 1.5 m voxels, braced in X panels a leg's width tall
EIFFEL_HALF = [(0, 61.5), (20, 51), (40, 42), (57.6, 34), (80, 28), (100, 23.5), (115.7, 20.5),
               (160, 16), (200, 13), (240, 11), (276, 9.3), (300, 6)]
EIFFEL_GAP = [(0, 37.5), (57.6, 20), (115.7, 6), (150, 0)]
EIFFEL_FLOORS = [57.6, 115.7, 276.1]
EIFFEL_TOP, EIFFEL_SPIRE = 300, 330
# The arches spring from the legs this high and peak this high, under the first floor's girders
EIFFEL_ARCH = (12, 45)
EIFFEL_VOXEL = 1.5
EIFFEL_COLOUR = '#7a6450'


def eiffel(location, grid):
    """The Eiffel Tower as voxels, square on the grid (its faces look along the street grid), as
    positions and triangles: hollow lattice legs braced in X, the arches between them, the three
    floors, the cabin and the spire. Returns them and the grid's (rows, cols) its feet cover."""
    lat, lon = location['city']['eiffelTower']['at']
    s = EIFFEL_VOXEL
    n, levels = int(2 * EIFFEL_HALF[0][1] / s) + 2, int(EIFFEL_SPIRE / s)
    # Cell centres across (x along the streets, y up the avenues) and up (z), metres from the axis
    x = (np.arange(n) - n / 2 + 0.5) * s
    ax, ay = np.abs(x)[None, :, None], np.abs(x)[None, None, :]
    z = ((np.arange(levels) + 0.5) * s)[:, None, None]
    half = np.interp(z, *zip(*EIFFEL_HALF))
    gap = np.interp(z, *zip(*EIFFEL_GAP))
    inside = (ax <= half) & (ay <= half)
    # Each face braced in X panels: the diagonals and the girder across their top
    panel = np.maximum(np.where(gap > 0, half - gap, 2 * half) / 2, 3 * s)

    def braced(along):
        return ((along + z) % panel < s) | ((along - z) % panel < s) | (z % panel < s)

    outer_x, outer_y = ax > half - s, ay > half - s
    legs = inside & (ax >= gap) & (ay >= gap)
    inner_x, inner_y = legs & (ax < gap + s), legs & (ay < gap + s)
    face_x, face_y = (outer_x | inner_x) & legs, (outer_y | inner_y) & legs
    solid = (face_x & face_y) | (face_x & braced(ay)) | (face_y & braced(ax))
    # The arches, in the outer faces between the legs
    spring, peak = EIFFEL_ARCH
    span = np.interp(spring, *zip(*EIFFEL_GAP))
    for across, outer in ((ay, outer_x), (ax, outer_y)):
        arch = spring + (peak - spring) * np.sqrt(np.clip(1 - (across / span) ** 2, 0, 1))
        solid |= inside & outer & (across < span) & (z >= arch) & (z < arch + 2 * s)
    # The floors, a girder band round the outside under each
    for k, floor in enumerate(EIFFEL_FLOORS):
        band = (z < floor) & (z >= floor - (6, 4, 3)[k])
        edge = np.interp(floor, *zip(*EIFFEL_HALF)) + s
        within = (ax <= edge) & (ay <= edge) & band
        solid |= within & ((z >= floor - s) | (ax > edge - s) | (ay > edge - s))
    # The cabin over the top floor, and the spire
    cabin = (z >= EIFFEL_FLOORS[2]) & (z < EIFFEL_TOP)
    solid |= cabin & (ax <= 7) & (ay <= 7)
    solid |= (z >= EIFFEL_TOP) & (ax <= s) & (ay <= s)
    solid &= z < EIFFEL_SPIRE

    # Faces where a voxel meets air, merged into strips
    upm = location['unitsPerMetre']
    up = upm * location['verticalExaggeration']
    ground = location['flatLand'] * up
    centre = grid.en(lat, lon)
    padded = np.pad(solid, 1)
    pos, idx = [], []

    def world(k, i, j):
        """A corner in index space (level k, x index i, y index j) in world units"""
        u, v = (i - n / 2) * s, (j - n / 2) * s
        east, north = centre + u * grid.street + v * grid.avenue
        return np.array([east * upm, ground + k * s * up, -north * upm])

    for axis in range(3):
        # Strips run along y, or along x on the faces that look along y
        run = 2 if axis != 2 else 1
        other = ({0, 1, 2} - {axis, run}).pop()
        for sign in (1, -1):
            step = np.eye(3, dtype=int)[axis] * sign
            ahead = padded[tuple(slice(1 + d, size + 1 + d) for d, size in zip(step, solid.shape))]
            exposed = solid & ~ahead
            # Which way is out, in the world: the frame may mirror the index space
            out = world(*step) - world(0, 0, 0)
            for cell in zip(*np.nonzero(exposed)):
                before = list(cell)
                before[run] -= 1
                if cell[run] > 0 and exposed[tuple(before)]:
                    continue  # part of the strip it continues
                length = 1
                after = list(cell)
                after[run] += 1
                while after[run] < solid.shape[run] and exposed[tuple(after)]:
                    length += 1
                    after[run] += 1
                lo = np.array(cell, float)
                lo[axis] += sign > 0
                corners = []
                for a, b in ((0, 0), (1, 0), (1, 1), (0, 1)):
                    c = lo.copy()
                    c[run] += a * length
                    c[other] += b
                    corners.append(world(*c))
                base = len(pos)
                pos.extend(corners)
                if np.dot(np.cross(corners[1] - corners[0], corners[2] - corners[0]), out) < 0:
                    idx.extend([base, base + 2, base + 1, base, base + 3, base + 2])
                else:
                    idx.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    positions, triangles = np.array(pos, np.float32), np.array(idx, np.uint32)
    print(f'Eiffel Tower: {int(solid.sum())} voxels, {len(triangles) // 3} triangles')
    # The grid cells under its feet, cleared of the pillars' and pavilions' footprints
    c, r = grid.cell(lat, lon)
    feet = int(EIFFEL_HALF[0][1] / grid.size) + 1
    return positions, triangles, (slice(max(int(r) - feet, 0), int(r) + feet + 1), slice(max(int(c) - feet, 0), int(c) + feet + 1))


def loop_curve(points, tension=LOOP_TENSION, per_leg=60):
    """The closed Catmull-Rom curve three.js flies through the loop (CatmullRomCurve3 'catmullrom'), per leg"""
    pts = np.array(points, float)
    n = len(pts)
    for k in range(n):
        x0, x1, x2, x3 = pts[(k - 1) % n], pts[k], pts[(k + 1) % n], pts[(k + 2) % n]
        t0, t1 = tension * (x2 - x0), tension * (x3 - x1)
        c2, c3 = -3 * x1 + 3 * x2 - 2 * t0 - t1, 2 * x1 - 2 * x2 + t0 + t1
        yield k, [x1 + t0 * t + c2 * t * t + c3 * t**3 for t in np.linspace(0, 1, per_leg, endpoint=False)]


def check_loop(location, grid, heights):
    """How far the soaring loop's curve clears the rooftops within LOOP_RADIUS of it, leg by leg"""
    loop = location.get('soaringLoop', {}).get('waypoints', [])
    if not loop:
        return
    span = int(LOOP_RADIUS / grid.size) + 1
    worst = math.inf
    for k, points in loop_curve(loop):
        lowest = math.inf
        for lat, lon, alt in points:
            c, r = grid.cell(lat, lon)
            r0, r1 = max(int(r) - span, 0), min(int(r) + span + 1, grid.rows)
            c0, c1 = max(int(c) - span, 0), min(int(c) + span + 1, grid.cols)
            roof = float(heights[r0:r1, c0:c1].max()) if r1 > r0 and c1 > c0 else 0.0
            lowest = min(lowest, alt - location['flatLand'] - roof)
        worst = min(worst, lowest)
        print(f'  leg {k} -> {(k + 1) % len(loop)}: {lowest:.0f} m over what is under it')
    print(f'soaring loop clears the rooftops by {worst:.0f} m at least')


def pad4(chunk, fill):
    return chunk + fill * ((4 - len(chunk) % 4) % 4)


def street_quad(location, grid):
    """The quad the street image is laid on: the whole grid, a little above the ground"""
    upm = location['unitsPerMetre']
    y = (location['flatLand'] + STREET_LIFT) * upm * location['verticalExaggeration']
    corners = [(0, 0), (grid.cols, 0), (grid.cols, grid.rows), (0, grid.rows)]
    points = []
    for col, row in corners:
        east, south = grid.world(col, row)
        points.append((east * upm, y, south * upm))
    uvs = [(col / grid.cols, row / grid.rows) for col, row in corners]
    e1, e2 = np.subtract(points[1], points[0]), np.subtract(points[2], points[0])
    # Counter-clockwise seen from above
    order = [0, 1, 2, 0, 2, 3] if np.cross(e1, e2)[1] > 0 else [0, 2, 1, 0, 3, 2]
    return np.array(points, np.float32), np.array(uvs, np.float32), np.array(order, np.uint16)


def png(image):
    buffer = io.BytesIO()
    Image.fromarray(image, 'RGBA').save(buffer, 'PNG', optimize=True)
    return buffer.getvalue()


def write_glb(positions, colours, windows, triangles, extras, streets, dst, tower=None, quays=None):
    """The buildings (node 0), the street quad with its image (node 1), a tower if there's one
    (one colour) and a city on the water's quay walls (positions, colours and triangles) in nodes
    of their own; the streets may be any mesh with 16-bit indices, and may carry a second image
    that glows (emissive), for the night"""
    quad_points, quad_uvs, quad_order, image, *glow = streets
    blobs = [
        (positions.tobytes(), 34962),
        (pad4(colours.tobytes(), b'\0'), 34962),
        (pad4(windows.tobytes(), b'\0'), 34962),
        (triangles.tobytes(), 34963),
        (quad_points.tobytes(), 34962),
        (quad_uvs.tobytes(), 34962),
        (pad4(quad_order.tobytes(), b'\0'), 34963),
        (pad4(png(image), b'\0'), None),
    ]
    if glow:
        blobs.append((pad4(png(glow[0]), b'\0'), None))
    views, offset = [], 0
    for blob, target in blobs:
        view = {'buffer': 0, 'byteOffset': offset, 'byteLength': len(blob)}
        if target:
            view['target'] = target
        views.append(view)
        offset += len(blob)
    gltf = {
        'asset': {'version': '2.0', 'generator': '3d/city-to-glb.py'},
        'scene': 0,
        'scenes': [{'nodes': [0, 1]}],
        'nodes': [{'mesh': 0, 'name': 'City', 'extras': extras}, {'mesh': 1, 'name': 'Streets'}],
        'materials': [
            {'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.85}},
            {
                'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0, 'roughnessFactor': 0.95},
                'alphaMode': 'MASK',
                'alphaCutoff': 0.5,
            },
        ],
        'meshes': [
            {'primitives': [{'attributes': {'POSITION': 0, 'COLOR_0': 1, '_WINDOWS': 2}, 'indices': 3, 'material': 0}]},
            {'primitives': [{'attributes': {'POSITION': 4, 'TEXCOORD_0': 5}, 'indices': 6, 'material': 1}]},
        ],
        # Crisp texels up close, like the voxels; mipmapped far off so it doesn't shimmer
        'samplers': [{'magFilter': 9728, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
        'images': [{'bufferView': 7 + k, 'mimeType': 'image/png'} for k in range(1 + len(glow))],
        'textures': [{'sampler': 0, 'source': k} for k in range(1 + len(glow))],
        'buffers': [{'byteLength': offset}],
        'bufferViews': views,
        'accessors': [
            {
                'bufferView': 0,
                'componentType': FLOAT,
                'count': len(positions),
                'type': 'VEC3',
                'min': positions.min(axis=0).tolist(),
                'max': positions.max(axis=0).tolist(),
            },
            {'bufferView': 1, 'componentType': UINT8, 'normalized': True, 'count': len(colours), 'type': 'VEC3'},
            {'bufferView': 2, 'componentType': UINT8, 'count': len(windows), 'type': 'SCALAR'},
            {'bufferView': 3, 'componentType': UINT32, 'count': len(triangles), 'type': 'SCALAR'},
            {
                'bufferView': 4,
                'componentType': FLOAT,
                'count': len(quad_points),
                'type': 'VEC3',
                'min': quad_points.min(axis=0).tolist(),
                'max': quad_points.max(axis=0).tolist(),
            },
            {'bufferView': 5, 'componentType': FLOAT, 'count': len(quad_uvs), 'type': 'VEC2'},
            {'bufferView': 6, 'componentType': UINT16, 'count': len(quad_order), 'type': 'SCALAR'},
        ],
    }
    if glow:
        gltf['materials'][1]['emissiveTexture'] = {'index': 1}
        gltf['materials'][1]['emissiveFactor'] = [1, 1, 1]
    if tower is not None:
        tower_points, tower_triangles = tower
        first = len(views)
        for blob, target in ((tower_points.tobytes(), 34962), (tower_triangles.tobytes(), 34963)):
            views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(blob), 'target': target})
            blobs.append((blob, target))
            offset += len(blob)
        gltf['buffers'][0]['byteLength'] = offset
        gltf['scenes'][0]['nodes'].append(2)
        gltf['nodes'].append({'mesh': 2, 'name': 'Tower'})
        colour = srgb_to_linear(EIFFEL_COLOUR).tolist()
        gltf['materials'].append({'pbrMetallicRoughness': {'baseColorFactor': [*colour, 1], 'metallicFactor': 0.3, 'roughnessFactor': 0.7}})
        gltf['meshes'].append({'primitives': [{'attributes': {'POSITION': 7}, 'indices': 8, 'material': 2}]})
        gltf['accessors'] += [
            {
                'bufferView': first,
                'componentType': FLOAT,
                'count': len(tower_points),
                'type': 'VEC3',
                'min': tower_points.min(axis=0).tolist(),
                'max': tower_points.max(axis=0).tolist(),
            },
            {'bufferView': first + 1, 'componentType': UINT32, 'count': len(tower_triangles), 'type': 'SCALAR'},
        ]
    if quays is not None:
        q_positions, q_colours, q_triangles = quays
        first = len(views)
        for blob, target in (
            (q_positions.tobytes(), 34962),
            (pad4(q_colours.tobytes(), b'\0'), 34962),
            (q_triangles.tobytes(), 34963),
        ):
            views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(blob), 'target': target})
            blobs.append((blob, target))
            offset += len(blob)
        accessor = len(gltf['accessors'])
        gltf['accessors'] += [
            {
                'bufferView': first,
                'componentType': FLOAT,
                'count': len(q_positions),
                'type': 'VEC3',
                'min': q_positions.min(axis=0).tolist(),
                'max': q_positions.max(axis=0).tolist(),
            },
            {'bufferView': first + 1, 'componentType': UINT8, 'normalized': True, 'count': len(q_colours), 'type': 'VEC3'},
            {'bufferView': first + 2, 'componentType': UINT32, 'count': len(q_triangles), 'type': 'SCALAR'},
        ]
        material, node = len(gltf['materials']), len(gltf['nodes'])
        gltf['materials'].append({'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.9}})
        gltf['meshes'].append(
            {'primitives': [{'attributes': {'POSITION': accessor, 'COLOR_0': accessor + 1}, 'indices': accessor + 2, 'material': material}]}
        )
        gltf['nodes'].append({'mesh': len(gltf['meshes']) - 1, 'name': 'Quays'})
        gltf['scenes'][0]['nodes'].append(node)
        gltf['buffers'][0]['byteLength'] = offset
    json_chunk = pad4(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
    bin_chunk = b''.join(blob for blob, _ in blobs)
    total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    with open(dst, 'wb') as out:
        out.write(struct.pack('<4sII', b'glTF', 2, total))
        out.write(struct.pack('<I4s', len(json_chunk), b'JSON') + json_chunk)
        out.write(struct.pack('<I4s', len(bin_chunk), b'BIN\0') + bin_chunk)
    print(f'wrote {dst}, {total} bytes')


# Quay walls of a city on the water: from this far under the water, metres, up to the paving;
# white Istrian stone at the top, green and dark where the tide wets them
QUAY_FOOT = 0.8
QUAY_TOP, QUAY_WET = '#a59d8e', '#3d4a3c'


def quays(location, grid, land):
    """The walls along every edge between land and water, as positions, colours and triangles"""
    top = location['flatLand']
    heights = np.where(land, top + QUAY_FOOT, 0).astype(np.float32)
    owner = np.where(land, 0, -1).astype(np.int32)
    # Standing QUAY_FOOT under the water instead of on the land
    under = {**location, 'flatLand': -QUAY_FOOT}
    positions, _, _, triangles = mesh(under, grid, heights, owner, [QUAY_TOP], [ROOF], walls_only=True)
    up = location['unitsPerMetre'] * location['verticalExaggeration']
    # The wet band: everything up to a little over the water is the dark algae colour
    wet = np.clip((positions[:, 1] / up - 0.3) / (top - 0.3), 0, 1)[:, None]
    colour = srgb_to_linear(QUAY_WET) * (1 - wet) + srgb_to_linear(QUAY_TOP) * 0.8 * wet
    return positions, np.round(np.clip(colour, 0, 1) * 255).astype(np.uint8), triangles


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    location = json.load(open(sys.argv[1]))
    grid = Grid(location)
    roofs = []
    heights, owner, colours, styles = rasterise(location, grid, fetch(location, 'buildings'), roofs)
    # A city on the water takes its land from OpenStreetMap's islands, less the canals
    land = water_land(location, grid) if location['city'].get('water') else None
    if land is not None:
        heights[~land] = 0
        owner[~land] = -1
    if location['city'].get('infill'):
        infill(location, grid, heights, owner, colours, styles, roofs, land)
    tower = None
    if 'eiffelTower' in location['city']:
        *tower, feet = eiffel(location, grid)
        # The tower stands on its own: clear the pillars and pavilions OSM draws under it
        heights[feet] = 0
        owner[feet] = -1
    check_loop(location, grid, heights)
    image, lanes, free, woods = lay_streets(location, grid, heights, land)
    rocks = outcrops(location, grid, heights)
    extras = grid.extras(location)
    if location['city'].get('pitchedRoofs'):
        # The hipped roofs share their vertices: the app shades them flat instead of by normals
        extras['flatShading'] = True
    extras['lanes'] = [[coordinate for end in lane for coordinate in grid.world_xz(*end, location)] for lane in lanes]
    extras['trees'] = plant(location, grid, free & (rocks == 0), woods)
    if land is not None:
        extras['canals'] = canals(location, grid, land)
    # The rocks are meshed with the buildings, as one more owner without windows
    owner[rocks > 0] = len(colours)
    heights = np.maximum(heights, rocks)
    colours.append(ROCK)
    styles.append(ROOF)
    roofs.append(None)
    streets = (*street_quad(location, grid), image)
    walls = quays(location, grid, land) if land is not None else None
    write_glb(*mesh(location, grid, heights, owner, colours, styles, roofs=roofs), extras, streets, sys.argv[2], tower, walls)
    if location['city'].get('meshopt'):
        # A dense old town comes to five times New York's vertices: packed for the web (16-bit
        # positions and EXT_meshopt_compression, which the app decodes), keeping nodes and extras
        subprocess.run(['node', str(Path(__file__).parent / 'meshopt-glb.mjs'), sys.argv[2], sys.argv[2]], check=True)
