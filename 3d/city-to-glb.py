#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow"]
# ///
"""
Build a city's buildings as voxels, from OpenStreetMap footprints and heights.

The location JSON (src/locations/<id>.json) gives the bbox and world units per metre, like
3d/dem-to-glb.py, and a `city` section: the voxel size in metres, the street grid's heading
(degrees east of north the avenues run, so the blocks sit square on the grid) and the height of
a building OSM gives none for. Buildings and building parts in the bbox are fetched from the
Overpass API once (cached in 3d/osm-cache/), rasterised onto the turned grid, each cell taking
its tallest building, and meshed as blocks: merged roofs, and walls only where neighbours differ.

The GLB is in the terrain's world units (scale 1) and frame (bbox centre at x = z = 0), standing
on the location's flatLand; facades and roofs are coloured per vertex, and each wall carries
its window style (_WINDOWS) and the node the grid (extras), for the app to draw the windows. No normals: every face
has its own vertices, so three.js shades them flat itself.

It also prints how far above the rooftops the location's soaringLoop flies, along the same
curve the app flies through it.

Usage: uv run 3d/city-to-glb.py src/locations/new-york.json assets/locations/new-york-city.glb
"""
import json
import math
import re
import struct
import sys
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
FLOAT, UINT8, UINT32 = 5126, 5121, 5125
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


def fetch(location):
    """The bbox's buildings and building parts, from the cache or Overpass"""
    b = location['bbox']
    box = f"{b['south']},{b['west']},{b['north']},{b['east']}"
    # Named by the bbox too, so changing it fetches again
    path = CACHE / f"{location['id']}-{zlib.crc32(box.encode()):08x}-buildings.json"
    if not path.exists():
        query = (
            f'[out:json][timeout:300];(way["building"]({box});relation["building"]({box});'
            f'way["building:part"]({box});relation["building:part"]({box}););out tags geom;'
        )
        print('fetching buildings from Overpass')
        request = urllib.request.Request(
            OVERPASS,
            data=urllib.parse.urlencode({'data': query}).encode(),
            headers={'User-Agent': 'lanzarote3d city-to-glb'},
        )
        CACHE.mkdir(exist_ok=True)
        path.write_bytes(urllib.request.urlopen(request, timeout=320).read())
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
    outer, inner = [], []
    for member in element.get('members', []):
        if member.get('type') == 'way' and 'geometry' in member:
            ring = [(p['lat'], p['lon']) for p in member['geometry']]
            (inner if member.get('role') == 'inner' else outer).append(ring)
    return outer, inner


def srgb_to_linear(hex_colour):
    c = np.array([int(hex_colour[i : i + 2], 16) / 255 for i in (1, 3, 5)])
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


# Window styles, per vertex in _WINDOWS for the app's shader: none (roofs), punched windows in
# brick and stone, glass curtain walls on the towers
ROOF, PUNCHED, CURTAIN = 0, 1, 2


def facade(tags, height, key):
    colour = tags.get('building:colour', '')
    if re.fullmatch(r'#[0-9a-fA-F]{6}', colour):
        return colour
    palette = TALL if height >= 120 else MID if height >= 30 else LOW
    return palette[zlib.crc32(key.encode()) % len(palette)]


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
                'ground': location['flatLand'] * up,
                'up': up,
            }
        }

    def inside(self):
        """Cells whose centre lies in the bbox"""
        cc, rr = np.meshgrid(np.arange(self.cols) + 0.5, np.arange(self.rows) + 0.5)
        east, south = self.world(cc, rr)
        return (np.abs(east) <= self.half_w) & (np.abs(south) <= self.half_d)


def rasterise(location, grid, elements):
    """Height in metres and facade colour index of every cell, the tallest building winning"""
    default = location['city']['defaultHeight']
    heights = np.zeros((grid.rows, grid.cols), np.float32)
    owner = np.full((grid.rows, grid.cols), -1, np.int32)
    colours, styles = [], []
    for element in elements:
        tags = element.get('tags', {})
        if tags.get('building') in ('no', 'roof') or 'min_height' in tags or 'building:min_level' in tags:
            continue  # canopies, bridges and overhangs float; leave the street under them open
        outer, inner = rings(element)
        if not outer:
            continue
        height = height_of(tags, default)
        polygons = [[grid.cell(lat, lon) for lat, lon in ring] for ring in outer + inner]
        xs = [x for poly in polygons for x, _ in poly]
        ys = [y for poly in polygons for _, y in poly]
        c0, c1 = max(int(min(xs)), 0), min(int(max(xs)) + 1, grid.cols)
        r0, r1 = max(int(min(ys)), 0), min(int(max(ys)) + 1, grid.rows)
        if c1 <= c0 or r1 <= r0:
            continue
        mask = Image.new('1', (c1 - c0, r1 - r0), 0)
        draw = ImageDraw.Draw(mask)
        for k, poly in enumerate(polygons):
            points = [(x - c0 - 0.5, y - r0 - 0.5) for x, y in poly]
            if len(points) >= 3:
                draw.polygon(points, fill=1 if k < len(outer) else 0)
        cells = np.array(mask, bool)
        region = heights[r0:r1, c0:c1]
        wins = cells & (height > region)
        region[wins] = height
        owner[r0:r1, c0:c1][wins] = len(colours)
        colours.append(facade(tags, height, f"{element['type']}{element['id']}"))
        styles.append(CURTAIN if height >= 120 else PUNCHED)
    outside = ~grid.inside()
    heights[outside] = 0
    owner[outside] = -1
    print(f'{len(colours)} buildings on a {grid.cols}x{grid.rows} grid of {grid.size} m, tallest {heights.max():.0f} m')
    return heights, owner, colours, styles


def mesh(location, grid, heights, owner, colours, styles):
    """Merged roofs and walls as positions, colours, window styles and triangles"""
    upm = location['unitsPerMetre']
    up = upm * location['verticalExaggeration']
    ground = location['flatLand'] * up
    # A shade darker than the palette: the island's bright sun washes them out
    linear = np.array([srgb_to_linear(c) for c in colours] or [[0, 0, 0]]) * 0.8
    # Roofs a darker, greyer shade of their facade
    roof_of = linear * 0.45 + srgb_to_linear('#4a4a4a') * 0.55
    pos, col, win, idx = [], [], [], []

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
            quad([at(c, r, h), at(c, r1 + 1, h), at(c1 + 1, r1 + 1, h), at(c1 + 1, r, h)], (0, 1, 0), roof_of[o])

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


def write_glb(positions, colours, windows, triangles, extras, dst):
    blobs = [positions.tobytes(), pad4(colours.tobytes(), b'\0'), pad4(windows.tobytes(), b'\0'), triangles.tobytes()]
    views, offset = [], 0
    for blob, target in zip(blobs, (34962, 34962, 34962, 34963)):
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(blob), 'target': target})
        offset += len(blob)
    gltf = {
        'asset': {'version': '2.0', 'generator': '3d/city-to-glb.py'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': [{'mesh': 0, 'name': 'City', 'extras': extras}],
        'materials': [{'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.85}}],
        'meshes': [
            {
                'primitives': [
                    {'attributes': {'POSITION': 0, 'COLOR_0': 1, '_WINDOWS': 2}, 'indices': 3, 'material': 0}
                ]
            }
        ],
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
        ],
    }
    json_chunk = pad4(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
    bin_chunk = b''.join(blobs)
    total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    with open(dst, 'wb') as out:
        out.write(struct.pack('<4sII', b'glTF', 2, total))
        out.write(struct.pack('<I4s', len(json_chunk), b'JSON') + json_chunk)
        out.write(struct.pack('<I4s', len(bin_chunk), b'BIN\0') + bin_chunk)
    print(f'wrote {dst}, {total} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    location = json.load(open(sys.argv[1]))
    grid = Grid(location)
    heights, owner, colours, styles = rasterise(location, grid, fetch(location))
    check_loop(location, grid, heights)
    write_glb(*mesh(location, grid, heights, owner, colours, styles), grid.extras(location), sys.argv[2])
