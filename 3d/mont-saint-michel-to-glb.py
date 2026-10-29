#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scipy", "pillow", "tifffile", "imagecodecs", "mapbox-earcut"]
# ///
"""
Build the Bay of Mont-Saint-Michel: its terrain, the bay's texture and the Mount.

The location JSON (src/locations/mont-saint-michel.json) describes it. Three files land in the
output folder:

- `mont-saint-michel.glb`, the terrain, in the slim format of 3d/dem-to-glb.py (positions and
  16-bit indices, world units). The Copernicus model has the whole bay at sea level, so the flats
  are made: `bay.shore` metres high at the land's edge, falling to `bay.low` `bay.reach` metres
  out, with sandbanks, OpenStreetMap's river channels carved in and thinner braided threads either
  side, and drainage creeks. Land is lifted to stand above high water (the salt meadows just so).
- `mont-saint-michel-bay.png`, what the app's tidal shader needs at 9 m a pixel, which the
  80 m mesh can't carry: R how far the ground lies below the mesh there (the narrow channels and
  creeks, 0 to CARVE_MAX metres), G what it is (0 sand, 0.5 salt meadow, 1 farmland), B a tone
  within that (wet mud or shell sand, a field's crop), A how much of the ground it paints.
  Row 0 is the north edge.
- `mont-saint-michel-mount.glb`, the Mount and Tombelaine, in world units: the granite rock;
  the abbey church with its Gothic chancel, crossing tower, spire and Saint Michael in gold;
  the Merveille, the cloister and the abbey's lodgings from OpenStreetMap's footprints; the
  ramparts, their towers and the village houses stacked up the slope from OpenStreetMap; the
  causeway and the footbridge on its piles. Per vertex: colour, normal and _KIND (0 rock,
  1 masonry, 2 slate, 3 gold, 4 leaves, 5 house walls with windows, 6 church walls with lancets,
  7 plain). The node's extras carry where the sheep graze and the walkers' path.

OpenStreetMap is fetched from the Overpass API once and cached in 3d/osm-cache/.

Usage: uv run 3d/mont-saint-michel-to-glb.py src/locations/mont-saint-michel.json assets/locations
"""
import importlib.util
import json
import math
import struct
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from pathlib import Path

import mapbox_earcut as earcut
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def load(name):
    """A sibling script as a module"""
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), Path(__file__).parent / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


dem = load('dem-to-glb')

CACHE = Path(__file__).parent / 'osm-cache'
OVERPASS = 'https://overpass-api.de/api/interpreter'
FLOAT, UINT8, UINT16, UINT32 = 5126, 5121, 5123, 5125
# The bay texture's R channel: metres below the mesh, at full scale
CARVE_MAX = 5.0
# Kinds of surface on the Mount, per vertex, for the app's shader
ROCK, MASONRY, SLATE, GOLD, LEAVES, HOUSE, CHURCH, PLAIN = range(8)


# ------------------------------------------------------------------------------------------------
# OpenStreetMap


def queries(location):
    """The Overpass queries: the Mount and its access, and the bay's marshes and rivers"""
    lat, lon = location['mount']['at']
    near = f'{lat - 0.004},{lon - 0.0065},{lat + 0.004},{lon + 0.0065}'
    access = f'{lat - 0.036},{lon - 0.0185},{lat + 0.004},{lon + 0.0215}'
    b = location['bbox']
    bay = f"{b['south']},{b['west']},{b['north']},{b['east']}"
    return {
        'mount': (
            f'way["building"]({near});relation["building"]({near});way["barrier"]({near});'
            f'way["highway"]({access});way["natural"]({near});way["man_made"]({access});way["landuse"]({near});'
        ),
        'bay': f'way["wetland"]({bay});relation["wetland"]({bay});way["waterway"~"river|canal"]({bay});',
    }


def fetch(location, layer):
    """One layer from OpenStreetMap, from the cache or Overpass"""
    path = CACHE / f"{location['id']}-{layer}.json"
    if not path.exists():
        query = f'[out:json][timeout:180];({queries(location)[layer]});out geom;'
        print(f'fetching {layer} from Overpass')
        request = urllib.request.Request(
            OVERPASS,
            data=urllib.parse.urlencode({'data': query}).encode(),
            headers={'User-Agent': 'lanzarote3d mont-saint-michel-to-glb'},
        )
        CACHE.mkdir(exist_ok=True)
        # Overpass is busy now and then: wait and ask again
        for attempt in range(6):
            try:
                path.write_bytes(urllib.request.urlopen(request, timeout=200).read())
                break
            except urllib.error.HTTPError as error:
                if attempt == 5 or error.code not in (429, 502, 503, 504):
                    raise
                print(f'Overpass said {error.code}, trying again')
                time.sleep(30 * (attempt + 1))
    return json.loads(path.read_text())['elements']


def outer_rings(element):
    """A way's ring, or a relation's outer rings, as [(lat, lon), ...]"""
    if element['type'] == 'way':
        return [[(p['lat'], p['lon']) for p in element.get('geometry', [])]]
    return [
        [(p['lat'], p['lon']) for p in m['geometry']]
        for m in element.get('members', [])
        if m.get('type') == 'way' and 'geometry' in m and m.get('role') != 'inner'
    ]


def srgb_to_linear(hex_colour):
    c = np.array([int(hex_colour[i : i + 2], 16) / 255 for i in (1, 3, 5)])
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def hashed(key, n=1.0):
    """A stable 0..n from a string"""
    return (zlib.crc32(key.encode()) % 10007) / 10007 * n


# ------------------------------------------------------------------------------------------------
# Frame and noise


class Frame:
    """Metres east and north of the bbox centre, and the world (x east, y up, z south)"""

    def __init__(self, location):
        b = location['bbox']
        self.lat0 = (b['north'] + b['south']) / 2
        self.lon0 = (b['east'] + b['west']) / 2
        self.mlon = math.cos(math.radians(self.lat0)) * dem.METRES_PER_DEGREE_LON_AT_EQUATOR
        self.mlat = dem.METRES_PER_DEGREE_LAT
        self.width = (b['east'] - b['west']) * self.mlon
        self.depth = (b['north'] - b['south']) * self.mlat
        self.upm = location['unitsPerMetre']
        self.up = self.upm * location['verticalExaggeration']

    def en(self, lat, lon):
        return (np.asarray(lon) - self.lon0) * self.mlon, (np.asarray(lat) - self.lat0) * self.mlat

    def latlon(self, east, north):
        return self.lat0 + np.asarray(north) / self.mlat, self.lon0 + np.asarray(east) / self.mlon

    def world(self, east, north, metres):
        return np.stack([np.asarray(east) * self.upm, np.asarray(metres) * self.up, -np.asarray(north) * self.upm], axis=-1)


def noise(shape, scale, seed, stretch=(1.0, 1.0)):
    """Smooth noise of about unit amplitude, features `scale` pixels across (times `stretch` per axis)"""
    rng = np.random.default_rng(seed)
    coarse = [max(2, int(s / (scale * k)) + 4) for s, k in zip(shape, stretch)]
    field = ndimage.zoom(rng.standard_normal(coarse), [s / (c - 3) for s, c in zip(shape, coarse)], order=3)
    field = field[: shape[0], : shape[1]]
    return field / (field.std() + 1e-9)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------------------------------------------
# The bay


class Bay:
    """The hi-res fields over the bbox: T x T pixels, row 0 at the north edge"""

    def __init__(self, location, frame):
        self.location = location
        self.frame = frame
        self.size = location['bay']['texture']
        self.px = frame.width / self.size, frame.depth / self.size  # metres a pixel, east and north
        t = self.size
        east = -frame.width / 2 + (np.arange(t) + 0.5) * self.px[0]
        north = frame.depth / 2 - (np.arange(t) + 0.5) * self.px[1]
        self.east, self.north = np.meshgrid(east, north)

    def pixel(self, east, north):
        """Fractional (column, row) of points in metres"""
        return (np.asarray(east) + self.frame.width / 2) / self.px[0] - 0.5, (self.frame.depth / 2 - np.asarray(north)) / self.px[1] - 0.5

    def draw(self, rings, closed, width=1):
        """A mask of polygons (closed) or polylines, rings as [(lat, lon), ...]"""
        image = Image.new('L', (self.size, self.size), 0)
        draw = ImageDraw.Draw(image)
        for ring in rings:
            if len(ring) < 2:
                continue
            lat, lon = np.array(ring).T
            c, r = self.pixel(*self.frame.en(lat, lon))
            points = list(zip(c.tolist(), r.tolist()))
            if closed and len(points) > 2:
                draw.polygon(points, fill=255)
            else:
                draw.line(points, fill=255, width=width)
        return np.array(image) > 0

    def build(self, osm):
        loc, bay = self.location, self.location['bay']
        frame = self.frame
        lat, lon = frame.latlon(self.east, self.north)
        b = loc['bbox']
        metres = dem.sampler(b)(lat, lon).astype(np.float32)

        def tagged(key, value):
            return [ring for e in osm if e.get('tags', {}).get(key) == value for ring in outer_rings(e)]

        saltmarsh = self.draw(tagged('wetland', 'saltmarsh') + tagged('wetland', 'reedbed'), True)
        tidalflat = self.draw(tagged('wetland', 'tidalflat'), True)
        rivers = [ring for e in osm if 'waterway' in e.get('tags', {}) for ring in outer_rings(e)]

        # The Mount and Tombelaine are built; under them the flats run on
        islands = np.zeros_like(saltmarsh)
        for key, radius in (('mount', 300), ('tombelaine', 200)):
            e, n = frame.en(*loc[key]['at'])
            islands |= np.hypot(self.east - e, self.north - n) < radius
        land = (metres > 0.5) & ~islands
        flats = ~land
        px = (self.px[1], self.px[0])

        # Flats: fall away from the land's edge
        out = ndimage.distance_transform_edt(flats, sampling=px)
        reach = np.clip(out / bay['reach'], 0, None) ** bay['steepness']
        height = bay['shore'] - (bay['shore'] - bay['low']) * reach
        # Past the mapped tidal flats it is open sea, deeper again
        sea = flats & ~tidalflat & (out > 3000)
        height -= np.where(sea, ndimage.distance_transform_edt(sea, sampling=px) * 0.0015, 0)
        height = np.maximum(height, -22)
        # Sandbanks drawn out along the flow, north-west to south-east, softer by the shore
        shape = (self.size, self.size)
        banks = ndimage.rotate(noise(shape, 40, 1, (1.0, 3.0)), 35, reshape=False, mode='reflect')
        height += banks * 0.55 * smoothstep(200, 1500, out)

        # Channels: OpenStreetMap's rivers, and threads braided either side of them
        carve = np.zeros(shape, np.float32)
        river_mask = self.draw(rivers, False, width=2)
        d = ndimage.distance_transform_edt(~river_mask, sampling=px)
        half = bay['channelWidth'] / 2
        carve = np.maximum(carve, bay['channelDepth'] * np.clip(1 - (d / half) ** 2, 0, None))
        rng = np.random.default_rng(7)
        for k in range(bay['braids']):
            threads = []
            for ring in rivers:
                pts = np.array(frame.en(*np.array(ring).T)).T
                if len(pts) < 2:
                    continue
                # Densify every 25 m, then wander sideways in long slow bends
                seg = np.hypot(*np.diff(pts, axis=0).T)
                s = np.concatenate([[0], np.cumsum(seg)])
                along = np.arange(0, s[-1], 25.0)
                if len(along) < 2:
                    continue
                dense = np.stack([np.interp(along, s, pts[:, 0]), np.interp(along, s, pts[:, 1])], axis=-1)
                tangent = np.gradient(dense, axis=0)
                tangent /= np.linalg.norm(tangent, axis=1, keepdims=True) + 1e-9
                normal = np.stack([-tangent[:, 1], tangent[:, 0]], axis=-1)
                phase = rng.uniform(0, 2 * np.pi, 3)
                swing = (
                    np.sin(along / 900 + phase[0]) * 260
                    + np.sin(along / 370 + phase[1]) * 120
                    + np.sin(along / 160 + phase[2]) * 45
                ) * (1 if k % 2 == 0 else -1)
                wander = dense + normal * swing[:, None]
                threads.append(list(zip(*frame.latlon(wander[:, 0], wander[:, 1]))))
            mask = self.draw(threads, False, width=1)
            d = ndimage.distance_transform_edt(~mask, sampling=px)
            width = half * rng.uniform(0.18, 0.32)
            carve = np.maximum(carve, bay['channelDepth'] * 0.45 * np.clip(1 - (d / width) ** 2, 0, None))
        # Drainage creeks across the upper flats: lines where a noise field crosses zero
        field = noise(shape, 55, 3, (1.0, 1.6))
        gy, gx = np.gradient(field)
        lines = np.abs(field) / (np.hypot(gx, gy) + 1e-6)  # roughly pixels to the line
        creek = np.clip(1 - lines / 1.6, 0, None) * smoothstep(-1, 3, height) * 0.7
        carve = np.maximum(carve, creek)
        carve *= flats & ~islands

        # The land, lifted above high water; the salt meadows just above it, cut by creeks
        meadow = land & (saltmarsh | ((metres < 6) & (ndimage.distance_transform_edt(land, sampling=px) < 900)))
        lifted = np.maximum(metres + bay['landLift'], bay['meadow'] + 0.4)
        meadow_height = bay['meadow'] + 0.35 * noise(shape, 30, 4) * 0.5 + 0.25
        land_height = np.where(meadow, np.minimum(lifted, meadow_height + 0.8), lifted)
        field = noise(shape, 24, 5)
        gy, gx = np.gradient(field)
        lines = np.abs(field) / (np.hypot(gx, gy) + 1e-6)
        meadow_creek = np.clip(1 - lines / 0.75, 0, None) * 1.3 * meadow
        carve = np.maximum(carve, meadow_creek)
        height = np.where(land, land_height, height)
        # The sand round the islands is a little higher, as the currents bank it there
        for key, radius in (('mount', 300), ('tombelaine', 200)):
            e, n = frame.en(*loc[key]['at'])
            near = np.hypot(self.east - e, self.north - n)
            height = np.where(near < radius * 1.6, np.maximum(height, loc['mount']['sand'] - 0.3 - (near / radius) * 0.4), height)

        # What the ground is, and a tone within it
        farmland = land & ~meadow
        klass = np.where(meadow, 0.5, np.where(farmland, 1.0, 0.0))
        klass = ndimage.gaussian_filter(klass, 1.0)
        sand_tone = 0.5 + 0.22 * noise(shape, 90, 6) + 0.12 * noise(shape, 12, 8)
        meadow_tone = 0.5 + 0.25 * noise(shape, 25, 9)
        fields = self.fields()
        tone = np.where(farmland, fields, np.where(meadow, meadow_tone, sand_tone))
        tone = np.clip(tone, 0, 1)
        # Paint the flats, the meadows and the low farmland; the hills keep the terrain's own look
        cover = np.where(land, 1 - smoothstep(14, 26, metres), 1.0)

        self.metres = metres
        self.height = height.astype(np.float32)
        self.carve = carve.astype(np.float32)
        self.klass, self.tone, self.cover = klass, tone, cover
        self.meadow = meadow
        self.land = land
        print(f'bay: flats {height[flats].min():.1f} to {height[flats].max():.1f} m, land up to {height.max():.0f} m')

    def fields(self):
        """Polder fields: long strips on a slowly turning grid, each its own crop, hedges between"""
        angle = np.radians(12) + 0.15 * noise(self.east.shape, 600, 10)
        u = self.east * np.cos(angle) + self.north * np.sin(angle)
        v = -self.east * np.sin(angle) + self.north * np.cos(angle)
        cu, cv = np.floor(u / 140), np.floor(v / 320 + 0.3 * np.floor(u / 140))
        value = (np.sin(cu * 12.9898 + cv * 78.233) * 43758.5453) % 1.0
        fu, fv = (u / 140) % 1, (v / 320 + 0.3 * np.floor(u / 140)) % 1
        hedge = (np.minimum(fu, 1 - fu) * 140 < 6) | (np.minimum(fv, 1 - fv) * 320 < 6)
        return np.where(hedge, 0.0, 0.08 + 0.92 * value)

    def sample(self, field, east, north):
        """Bilinear sample of a field at points in metres"""
        c, r = self.pixel(east, north)
        return ndimage.map_coordinates(field, [np.atleast_1d(r), np.atleast_1d(c)], order=1, mode='nearest')


def terrain(location, frame, bay):
    """The mesh: the bay's height smoothed onto the grid; returns points, triangles and the grid"""
    spacing = location['spacing']
    cols = int(frame.width // spacing) + 1
    rows = int(frame.depth // spacing) + 1
    if rows * cols > 0xFFFF:
        sys.exit(f'{rows}x{cols} points do not fit 16-bit indices')
    east = np.linspace(-frame.width / 2, frame.width / 2, cols)
    north = np.linspace(frame.depth / 2, -frame.depth / 2, rows)
    ee, nn = np.meshgrid(east, north)
    smooth = ndimage.gaussian_filter(bay.height, spacing / bay.px[0] / 3)
    metres = bay.sample(smooth, ee.ravel(), nn.ravel()).reshape(rows, cols)
    points = frame.world(ee, nn, metres).reshape(-1, 3).astype(np.float32)
    i = np.arange(rows - 1)[:, None] * cols + np.arange(cols - 1)[None, :]
    a, b, c, d = i, i + 1, i + cols, i + cols + 1
    triangles = np.stack([a, c, b, b, c, d], axis=-1).reshape(-1).astype(np.uint16)
    print(f'terrain: {rows}x{cols} grid, {len(triangles) // 3} triangles')
    return points, triangles, (rows, cols, east, north, metres)


def mesh_height_at(grid, east, north):
    """The terrain mesh's own height (metres) at points, triangle by triangle as the GPU draws it"""
    rows, cols, e, n, metres = grid
    fx = (east - e[0]) / (e[1] - e[0])
    fz = (n[0] - north) / (n[0] - n[1])
    c0 = np.clip(np.floor(fx).astype(int), 0, cols - 2)
    r0 = np.clip(np.floor(fz).astype(int), 0, rows - 2)
    u, v = np.clip(fx - c0, 0, 1), np.clip(fz - r0, 0, 1)
    a, b = metres[r0, c0], metres[r0, c0 + 1]
    c, d = metres[r0 + 1, c0], metres[r0 + 1, c0 + 1]
    # Triangles (a, c, b) and (b, c, d): split along the b-c diagonal
    first = u + v <= 1
    return np.where(first, a + u * (b - a) + v * (c - a), d + (1 - u) * (c - d) + (1 - v) * (b - d))


def bay_texture(bay, grid, dst):
    """The bay's RGBA texture: carve below the mesh, kind, tone and cover"""
    mesh = mesh_height_at(grid, bay.east, bay.north)
    # Only as deep as something was carved there: where the mesh merely smooths a step (the
    # salt meadows' edge), the mesh is the ground
    below = np.clip(mesh - (bay.height - bay.carve), 0, np.minimum(bay.carve + 0.2, CARVE_MAX))
    # Only the flats and the meadows have channels; elsewhere the mesh is the ground
    below = np.where(bay.land & ~bay.meadow, 0, below)
    bay.ground = mesh - below  # what the shader will take for the ground, metres
    rgba = np.stack([below / CARVE_MAX, bay.klass, bay.tone, bay.cover], axis=-1)
    image = (np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(image, 'RGBA').save(dst, optimize=True)
    print(f'wrote {dst}, {Path(dst).stat().st_size} bytes')


# ------------------------------------------------------------------------------------------------
# Meshes with a colour, a normal and a kind per vertex


class Mesh:
    def __init__(self, frame, origin):
        self.frame = frame
        self.origin = origin  # metres east and north of the bbox centre of local (0, 0)
        self.pos, self.col, self.kind, self.nrm = [], [], [], []

    def poly(self, points, colour, kind, outward=None):
        """A planar convex polygon of local (east, north, metres) points, facing `outward` (a
        local vector) if given, else as wound anticlockwise seen from its front"""
        p = np.array(points, float)
        world = self.frame.world(p[:, 0] + self.origin[0], p[:, 1] + self.origin[1], p[:, 2])
        normal = np.cross(world[1] - world[0], world[2] - world[0])
        if np.linalg.norm(normal) < 1e-9:
            # Degenerate first corner: use the polygon's area vector
            normal = sum(np.cross(world[k] - world[0], world[k + 1] - world[0]) for k in range(1, len(world) - 1))
        if outward is not None:
            want = np.array([outward[0], outward[2], -outward[1]], float)
            if np.dot(normal, want) < 0:
                world = world[::-1]
                normal = -normal
        length = np.linalg.norm(normal)
        if length < 1e-9:
            return
        normal = normal / length
        c = srgb_to_linear(colour) if isinstance(colour, str) else np.asarray(colour)
        for k in range(1, len(world) - 1):
            for corner in (world[0], world[k], world[k + 1]):
                self.pos.append(corner)
                self.col.append(c)
                self.kind.append(kind)
                self.nrm.append(normal)

    def quad(self, a, b, c, d, colour, kind, outward=None):
        self.poly([a, b, c, d], colour, kind, outward)

    def prism(self, ring, y0, y1, wall, kind, roof=None, roof_kind=SLATE, top=True):
        """Walls round a ring of (east, north) from y0 to y1 (per corner if a list); a flat top"""
        ring = ensure_ccw(ring)
        n = len(ring)
        lo = y0 if isinstance(y0, (list, np.ndarray)) else [y0] * n
        hi = y1 if isinstance(y1, (list, np.ndarray)) else [y1] * n
        for k in range(n):
            (e0, n0), (e1, n1) = ring[k], ring[(k + 1) % n]
            out = (n1 - n0, -(e1 - e0), 0)
            self.quad((e0, n0, lo[k]), (e1, n1, lo[(k + 1) % n]), (e1, n1, hi[(k + 1) % n]), (e0, n0, hi[k]), wall, kind, out)
        if top:
            self.flat(ring, hi, wall if roof is None else roof, kind if roof is None else roof_kind)

    def flat(self, ring, heights, colour, kind):
        """A flat (or gently tilted) polygon over a ring, triangulated, facing up"""
        ring = np.array(ring, float)
        hs = heights if isinstance(heights, (list, np.ndarray)) else [heights] * len(ring)
        tris = earcut.triangulate_float64(ring, np.array([len(ring)], dtype=np.uint32))
        for t in range(0, len(tris), 3):
            i, j, k = tris[t : t + 3]
            self.poly([(*ring[i], hs[i]), (*ring[j], hs[j]), (*ring[k], hs[k])], colour, kind, (0, 0, 1))

    def gable(self, centre, axis, length, width, eave, ridge, wall, roof, kind=HOUSE, hip=False):
        """A rectangular house's roof and gables: ridge along `axis` (unit east, north)"""
        ax = np.array(axis, float)
        ac = np.array([-ax[1], ax[0]])
        c = np.array(centre, float)

        def at(a, b, h):
            p = c + ax * a + ac * b
            return (p[0], p[1], h)

        hl, hw = length / 2, width / 2
        over = 0.4
        inset = hw if hip else 0.0
        # Roof slopes, a little over the walls
        for side in (-1, 1):
            self.quad(
                at(-hl - over, side * (hw + over), eave - 0.3),
                at(hl + over, side * (hw + over), eave - 0.3),
                at(hl - inset, 0, ridge),
                at(-hl + inset, 0, ridge),
                roof,
                SLATE,
                (ac[0] * side, ac[1] * side, 1.2),
            )
        for end in (-1, 1):
            if hip:
                self.poly([at(end * (hl + over), -hw - over, eave - 0.3), at(end * (hl + over), hw + over, eave - 0.3), at(end * (hl - inset), 0, ridge)], roof, SLATE, (ax[0] * end, ax[1] * end, 1.2))
            else:
                self.poly([at(end * hl, -hw, eave), at(end * hl, hw, eave), at(end * hl, 0, ridge)], wall, kind, (ax[0] * end, ax[1] * end, 0))

    def cylinder(self, centre, radius, y0, y1, colour, kind, sides=14, top=True, top_radius=None):
        ring = [(centre[0] + radius * math.cos(a), centre[1] + radius * math.sin(a)) for a in np.linspace(0, 2 * math.pi, sides, endpoint=False)]
        if top_radius is None:
            self.prism(ring, y0, y1, colour, kind, top=top)
            return
        tr = [(centre[0] + top_radius * math.cos(a), centre[1] + top_radius * math.sin(a)) for a in np.linspace(0, 2 * math.pi, sides, endpoint=False)]
        for k in range(sides):
            a, b = ring[k], ring[(k + 1) % sides]
            ta, tb = tr[k], tr[(k + 1) % sides]
            mid = ((a[0] + b[0]) / 2 - centre[0], (a[1] + b[1]) / 2 - centre[1], 0)
            self.quad((*a, y0), (*b, y0), (*tb, y1), (*ta, y1), colour, kind, mid)
        if top:
            self.flat(tr, y1, colour, kind)

    def cone(self, centre, radius, y0, y1, colour, kind, sides=12):
        ring = [(centre[0] + radius * math.cos(a), centre[1] + radius * math.sin(a)) for a in np.linspace(0, 2 * math.pi, sides, endpoint=False)]
        for k in range(sides):
            a, b = ring[k], ring[(k + 1) % sides]
            mid = ((a[0] + b[0]) / 2 - centre[0], (a[1] + b[1]) / 2 - centre[1], 0.3)
            self.poly([(*a, y0), (*b, y0), (centre[0], centre[1], y1)], colour, kind, mid)

    def box(self, centre, axis, length, width, y0, y1, colour, kind, top=True):
        ax = np.array(axis, float)
        ac = np.array([-ax[1], ax[0]])
        c = np.array(centre, float)
        ring = [tuple(c + ax * a * length / 2 + ac * b * width / 2) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        self.prism(ring, y0, y1, colour, kind, top=top)

    def arrays(self):
        return (
            np.array(self.pos, np.float32),
            np.array(self.nrm, np.float32),
            (np.clip(np.array(self.col), 0, 1) * 255 + 0.5).astype(np.uint8),
            np.array(self.kind, np.uint8),
        )


def ensure_ccw(ring):
    ring = [tuple(p) for p in ring]
    if len(ring) > 1 and ring[0] == ring[-1]:
        ring = ring[:-1]
    area = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1]))
    return ring if area > 0 else ring[::-1]


def obb(ring):
    """The minimum-area rectangle round a ring: centre, unit long axis, length, width"""
    p = np.array(ring, float)
    best = None
    for k in range(len(p)):
        edge = p[(k + 1) % len(p)] - p[k]
        if np.linalg.norm(edge) < 1e-6:
            continue
        ax = edge / np.linalg.norm(edge)
        ac = np.array([-ax[1], ax[0]])
        a, b = p @ ax, p @ ac
        area = (a.max() - a.min()) * (b.max() - b.min())
        if best is None or area < best[0]:
            centre = ax * (a.max() + a.min()) / 2 + ac * (b.max() + b.min()) / 2
            la, lb = a.max() - a.min(), b.max() - b.min()
            best = (area, centre, ax, la, lb) if la >= lb else (area, centre, ac, lb, la)
    _, centre, ax, length, width = best
    return centre, ax, length, width


def shade(colour, factor):
    return np.clip(srgb_to_linear(colour) * factor, 0, 1)


# ------------------------------------------------------------------------------------------------
# Rocks


class Rock:
    """A granite island's height (metres) over local (east, north): steep cliffs on the
    north-west, a gentler slope on the south-east, as the Mount has"""

    def __init__(self, outline, summit_at, sand, summit, cliff_bearing=135.0, seed=0, res=1.0, margin=40):
        self.sand, self.summit, self.res = sand, summit, res
        ring = np.array(outline)
        self.lo = ring.min(axis=0) - margin
        size = np.ceil((ring.max(axis=0) + margin - self.lo) / res).astype(int)
        image = Image.new('L', tuple(size.tolist()), 0)
        ImageDraw.Draw(image).polygon([tuple(((p - self.lo) / res).tolist()) for p in ring], fill=255)
        inside = np.array(image) > 0  # row 0 at the south (image y is north here)
        self.inside = inside
        edge = ndimage.distance_transform_edt(inside) * res
        e = self.lo[0] + (np.arange(size[0]) + 0.5) * res
        n = self.lo[1] + (np.arange(size[1]) + 0.5) * res
        ee, nn = np.meshgrid(e, n)
        de, dn = ee - summit_at[0], nn - summit_at[1]
        r = np.hypot(de, dn)
        bearing = np.degrees(np.arctan2(dn, de))
        cliffy = 0.5 + 0.5 * np.cos(np.radians(bearing - cliff_bearing))
        shape = edge.shape
        crags = noise(shape, 9 / res, seed) * 1.6 + noise(shape, 3 / res, seed + 1) * 0.7
        rise = (1.0 + 2.6 * cliffy) * edge
        cone = summit - (0.42 + 0.5 * cliffy) * np.maximum(0, r - 18)
        h = sand + rise
        top = np.minimum(h, cone)
        # Soft minimum, so the shoulder rounds
        k = 6.0
        top = -k * np.log(np.exp(-h / k) + np.exp(-cone / k))
        self.height = np.where(inside, np.maximum(top + crags * (0.4 + cliffy), sand - 0.5), sand - 1.5)
        self.cliffy = cliffy
        self.e, self.n = e, n

    def at(self, east, north):
        c = (np.asarray(east) - self.lo[0]) / self.res - 0.5
        r = (np.asarray(north) - self.lo[1]) / self.res - 0.5
        return ndimage.map_coordinates(self.height, [np.atleast_1d(r), np.atleast_1d(c)], order=1, mode='nearest')

    def lowest(self, ring):
        p = np.array(ring, float)
        centre = p.mean(axis=0)
        probe = np.concatenate([p, (p + centre) / 2, [centre]])
        return float(self.at(probe[:, 0], probe[:, 1]).min())

    def highest(self, ring):
        p = np.array(ring, float)
        return float(self.at(p[:, 0], p[:, 1]).max())

    def mesh(self, mesh, step, colours, seed=0):
        """Triangles every `step` metres where the rock stands, coloured by slope"""
        rng = np.random.default_rng(seed)
        k = max(1, int(round(step / self.res)))
        h = self.height[::k, ::k]
        inside = ndimage.binary_dilation(self.inside[::k, ::k], iterations=2)
        e, n = self.e[::k], self.n[::k]
        rock, grass, lichen = colours
        for r in range(h.shape[0] - 1):
            for c in range(h.shape[1] - 1):
                if not inside[r : r + 2, c : c + 2].any():
                    continue
                a = (e[c], n[r], h[r, c])
                b = (e[c + 1], n[r], h[r, c + 1])
                cc = (e[c], n[r + 1], h[r + 1, c])
                d = (e[c + 1], n[r + 1], h[r + 1, c + 1])
                for tri in ((a, b, d), (a, d, cc)):
                    p = np.array(tri)
                    normal = np.cross(p[1] - p[0], p[2] - p[0])
                    up = normal[2] / (np.linalg.norm(normal) + 1e-9)
                    tint = rng.uniform(0.86, 1.12)
                    if up > 0.8 and p[:, 2].mean() > self.sand + 3:
                        colour = shade(grass, tint)
                    elif rng.random() < 0.12:
                        colour = shade(lichen, tint)
                    else:
                        colour = shade(rock, tint * (0.85 + 0.25 * up))
                    mesh.poly(list(tri), colour, ROCK, (0, 0, 1))


def trees(mesh, rock, region, count, seed, low=None):
    """Clumps of trees on the rock's gentler slopes within `region` (a ring), as faceted crowns"""
    rng = np.random.default_rng(seed)
    ring = np.array(region)
    lo, hi = ring.min(axis=0), ring.max(axis=0)
    path = Image.new('L', (1, 1))
    placed = 0
    tries = 0
    while placed < count and tries < count * 40:
        tries += 1
        e, n = rng.uniform(lo, hi)
        if not inside_ring(ring, (e, n)):
            continue
        g = float(rock.at(e, n)[0])
        if g < rock.sand + 2 or (low is not None and g > low):
            continue
        size = rng.uniform(3.0, 6.5)
        trunk = size * 0.5
        green = shade(['#3e5a2c', '#4a6631', '#35502a', '#56703a'][rng.integers(4)], rng.uniform(0.8, 1.15))
        mesh.cylinder((e, n), size * 0.15, g - 1, g + trunk, '#4a3a2c', PLAIN, sides=5, top=False)
        mesh.cylinder((e, n), size, g + trunk, g + trunk + size * 0.9, green, LEAVES, sides=7, top_radius=size * 0.55)
        mesh.cone((e, n), size * 0.55, g + trunk + size * 0.9, g + trunk + size * 1.6, green, LEAVES, sides=7)
        placed += 1
    del path


def inside_ring(ring, point):
    x, y = point
    inside = False
    n = len(ring)
    for i in range(n):
        x0, y0 = ring[i]
        x1, y1 = ring[(i + 1) % n]
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0 + 1e-12) + x0:
            inside = not inside
    return inside


def hull(points):
    """Convex hull, anticlockwise"""
    pts = sorted(set(map(tuple, np.round(points, 2))))

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def wobble(ring, amount, seed, step=6.0):
    """A ring densified every `step` metres and pushed in and out by smooth noise, so it reads as rock"""
    rng = np.random.default_rng(seed)
    p = np.array(ring + [ring[0]], float)
    seg = np.hypot(*np.diff(p, axis=0).T)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.arange(0, s[-1], step)
    dense = np.stack([np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])], axis=-1)
    centre = dense.mean(axis=0)
    phase = rng.uniform(0, 2 * np.pi, 3)
    a = 2 * np.pi * t / s[-1]
    push = amount * (np.sin(5 * a + phase[0]) * 0.5 + np.sin(11 * a + phase[1]) * 0.3 + np.sin(23 * a + phase[2]) * 0.2)
    out = dense - centre
    out /= np.linalg.norm(out, axis=1, keepdims=True)
    return [tuple(q) for q in dense + out * push[:, None]]


# ------------------------------------------------------------------------------------------------
# The Mount


GRANITE = '#8f8270'
ABBEY = '#a6977c'
ABBEY_ROOF = '#55595f'
SLATES = ['#4a4f58', '#525760', '#454a52', '#5a5c62', '#4e535b']
HOUSE_WALLS = ['#b8a88e', '#a59680', '#c4b49a', '#9a8c78', '#d2c4a8', '#ae9c80', '#dcd0b6']
RAMPART = '#9c8d75'
GOLD_COLOUR = '#e0b448'


def local_rings(osm, frame, origin, keep):
    """OpenStreetMap elements passing `keep`, as (tags, ring in local metres)"""
    out = []
    for e in osm:
        tags = e.get('tags', {})
        if not keep(tags, e):
            continue
        for ring in outer_rings(e):
            if len(ring) < 2:
                continue
            lat, lon = np.array(ring).T
            east, north = frame.en(lat, lon)
            out.append((tags, list(zip((east - origin[0]).tolist(), (north - origin[1]).tolist()))))
    return out


def crenellate(mesh, a, b, top, thickness, colour, outward):
    """Merlons along a wall top from a to b (local (east, north)), on its outer edge"""
    a, b = np.array(a, float), np.array(b, float)
    length = np.linalg.norm(b - a)
    if length < 1:
        return
    ax = (b - a) / length
    out = np.array(outward[:2], float)
    ac = np.array([-ax[1], ax[0]])
    if np.dot(ac, out) < 0:
        ac = -ac
    count = int(length // 3.2)
    for k in range(count):
        mid = a + ax * (k * 3.2 + 1.6)
        centre = mid + ac * (thickness / 2 - 0.45)
        mesh.box(tuple(centre), tuple(ax), 1.6, 0.9, top, top + 1.5, colour, MASONRY)


def build_church(mesh, ring, floor, spire, rock_floor):
    """The abbey church on its footprint: Romanesque nave west of the crossing, the Gothic chancel
    east of it with flying buttresses, the transepts, the crossing tower, the belfry, the spire and
    Saint Michael in gold"""
    centre, ax, length, width = obb(ring)
    if ax[0] < 0:
        ax = -ax  # west to east
    ac = np.array([-ax[1], ax[0]])  # north

    def at(a, b):
        p = centre + ax * (a - length / 2) + ac * b
        return (p[0], p[1])

    F = floor
    stone = ABBEY
    roof = ABBEY_ROOF
    cross_a = length * 0.47
    cw = 12.0
    # The platform the church stands on, crypts and all, down to the rock
    mesh.box(at(length / 2, 0), tuple(ax), length + 4, 26, rock_floor - 2, F, shade(stone, 0.92), MASONRY)
    # Nave and aisles
    nave_len = cross_a - cw / 2
    mesh.box(at(nave_len / 2, 0), tuple(ax), nave_len, 12, F, F + 19, stone, CHURCH, top=False)
    mesh.gable(at(nave_len / 2, 0), tuple(ax), nave_len, 12, F + 19, F + 27, stone, roof, CHURCH)
    for side in (-1, 1):
        mesh.box(at(nave_len / 2, side * 8.5), tuple(ax), nave_len, 5, F, F + 10, shade(stone, 0.95), CHURCH)
        # Lean-to aisle roof against the nave wall
        mesh.quad((*at(0, side * 11.2), F + 9.6), (*at(nave_len, side * 11.2), F + 9.6), (*at(nave_len, side * 6), F + 14), (*at(0, side * 6), F + 14), roof, SLATE, (ac[0] * side, ac[1] * side, 1.5))
    # Transepts: the crossing arms, north and south
    arm = max(width / 2, 15)
    mesh.box(at(cross_a, 0), tuple(ac), arm * 2, cw, F, F + 19, stone, CHURCH, top=False)
    mesh.gable(at(cross_a, 0), tuple(ac), arm * 2, cw, F + 19, F + 27, stone, roof, CHURCH)
    # The Gothic chancel: taller, an ambulatory and chapels round it, flying buttresses
    ch0, ch1 = cross_a + cw / 2, length - 6.5
    ch_len = ch1 - ch0
    mesh.box(at((ch0 + ch1) / 2, 0), tuple(ax), ch_len, 13, F, F + 24, stone, CHURCH, top=False)
    mesh.gable(at((ch0 + ch1) / 2, 0), tuple(ax), ch_len, 13, F + 24, F + 33, stone, roof, CHURCH)
    for side in (-1, 1):
        mesh.box(at((ch0 + ch1) / 2, side * 9.5), tuple(ax), ch_len, 6, F, F + 12, shade(stone, 0.95), CHURCH)
        mesh.quad((*at(ch0, side * 12.6), F + 11.6), (*at(ch1, side * 12.6), F + 11.6), (*at(ch1, side * 6.5), F + 16), (*at(ch0, side * 6.5), F + 16), roof, SLATE, (ac[0] * side, ac[1] * side, 1.5))
        for k in range(int(ch_len // 5.5) + 1):
            a = ch0 + 2 + k * 5.5
            if a > ch1 + 2:
                break
            # A buttress pier with its pinnacle, and the flyer up to the chancel wall
            mesh.box(at(a, side * 13.5), tuple(ac), 2.4, 1.6, F, F + 18, shade(stone, 1.03), MASONRY)
            mesh.cone(at(a, side * 13.5), 1.1, F + 18, F + 23.5, shade(stone, 1.03), MASONRY, sides=4)
            p0, p1 = at(a, side * 13.0), at(a, side * 6.6)
            w = ax * 0.45
            mesh.quad((p0[0] - w[0], p0[1] - w[1], F + 15.5), (p0[0] + w[0], p0[1] + w[1], F + 15.5), (p1[0] + w[0], p1[1] + w[1], F + 21.5), (p1[0] - w[0], p1[1] - w[1], F + 21.5), shade(stone, 1.0), MASONRY, (0, 0, 1))
            mesh.quad((p0[0] - w[0], p0[1] - w[1], F + 14.3), (p0[0] + w[0], p0[1] + w[1], F + 14.3), (p1[0] + w[0], p1[1] + w[1], F + 20.3), (p1[0] - w[0], p1[1] - w[1], F + 20.3), shade(stone, 0.8), MASONRY, (0, 0, -1))
    # The apse: half an octagon closing the chancel, its roof a half cone
    apse = [at(ch1 + 6.5 * math.cos(t) * 1.0, 6.5 * math.sin(t)) for t in np.linspace(-math.pi / 2, math.pi / 2, 6)]
    c = at(ch1, 0)
    for k in range(len(apse) - 1):
        a, b = apse[k], apse[k + 1]
        out = ((a[0] + b[0]) / 2 - c[0], (a[1] + b[1]) / 2 - c[1], 0)
        mesh.quad((*a, F), (*b, F), (*b, F + 24), (*a, F + 24), stone, CHURCH, out)
        mesh.poly([(*a, F + 24), (*b, F + 24), (*c, F + 33)], roof, SLATE, (out[0], out[1], 1))
    # West front: the classical façade left when the western bays fell
    mesh.box(at(-0.8, 0), tuple(ax), 1.6, 13, F, F + 21, shade(stone, 1.05), CHURCH)
    # The crossing tower, its balustrade and corner pinnacles
    tower = at(cross_a, 0)
    mesh.box(tower, tuple(ax), cw, cw, F + 19, F + 38, stone, CHURCH)
    for sa in (-1, 1):
        for sb in (-1, 1):
            corner = at(cross_a + sa * (cw / 2 - 0.8), sb * (cw / 2 - 0.8))
            mesh.box(corner, tuple(ax), 1.6, 1.6, F + 38, F + 42, shade(stone, 1.05), MASONRY)
            mesh.cone(corner, 1.0, F + 42, F + 47, shade(stone, 1.05), MASONRY, sides=4)
    # The belfry: an octagon of tall openings
    mesh.cylinder(tower, 5.4, F + 38, F + 51, shade(stone, 1.04), CHURCH, sides=8)
    for k in range(8):
        t = k * math.pi / 4 + math.pi / 8
        g = (tower[0] + 5.6 * math.cos(t), tower[1] + 5.6 * math.sin(t))
        mesh.cone(g, 1.2, F + 50.5, F + 55, shade(stone, 1.04), MASONRY, sides=4)
    # The spire: a slender octagon to the statue's feet, with a ring of gablets at its foot
    spire_foot = F + 51
    statue_foot = spire - 6.5
    mesh.cylinder(tower, 4.9, spire_foot, statue_foot, '#646a70', SLATE, sides=8, top_radius=0.35)
    for frac, r in ((0.32, 0.9), (0.6, 0.7)):
        y = spire_foot + (statue_foot - spire_foot) * frac
        rad = 4.9 + (0.35 - 4.9) * frac
        mesh.cylinder(tower, rad + r * 0.5, y, y + 0.7, shade(stone, 1.0), MASONRY, sides=8, top=False)
    # Saint Michael: gilded, wings up, sword raised
    mesh.cylinder(tower, 0.35, statue_foot - 0.2, statue_foot + 1.0, GOLD_COLOUR, GOLD, sides=6)
    mesh.cylinder(tower, 0.75, statue_foot + 1.0, statue_foot + 4.6, GOLD_COLOUR, GOLD, sides=8, top_radius=0.4)
    mesh.cylinder(tower, 0.42, statue_foot + 4.6, statue_foot + 5.4, GOLD_COLOUR, GOLD, sides=6, top_radius=0.25)
    for side in (-1, 1):
        base = np.array(tower) + ac * side * 0.4 - ax * 0.3
        tip = np.array(tower) + ac * side * 1.8 - ax * 0.9
        mesh.poly([(*base, statue_foot + 3.0), (*tip, statue_foot + 6.2), (*(base - ax * 0.5), statue_foot + 4.8)], GOLD_COLOUR, GOLD, (-ax[0], -ax[1], 0.2))
        mesh.poly([(*base, statue_foot + 3.0), (*tip, statue_foot + 6.2), (*(base - ax * 0.5), statue_foot + 4.8)], GOLD_COLOUR, GOLD, (ax[0], ax[1], 0.2))
    sword = np.array(tower) + ax * 0.5 + ac * 0.4
    mesh.box(tuple(sword), tuple(ax), 0.18, 0.18, statue_foot + 3.5, spire, GOLD_COLOUR, GOLD)
    return centre, ax


def build_mount(location, frame, osm, bay):
    loc = location['mount']
    origin = frame.en(*loc['at'])
    mesh = Mesh(frame, origin)
    sand, floor, spire = loc['sand'], loc['floor'], loc['spire']

    rings = local_rings(osm, frame, origin, lambda t, e: True)
    near = [(t, r) for t, r in rings if np.hypot(*np.mean(r, axis=0)) < 240]
    church = next(r for t, r in near if t.get('name') == 'Église abbatiale')
    summit_at = np.mean(church, axis=0)

    # The island: round everything mapped on it, rocks and walls and houses, a little out, wobbled
    on_island = [p for t, r in near if ('building' in t or t.get('barrier') in ('city_wall', 'retaining_wall') or t.get('natural') in ('bare_rock', 'heath', 'grassland')) for p in r]
    outline = wobble(hull(np.array(on_island)), 5.0, 11)
    rock = Rock(outline, summit_at, sand, loc['summit'], seed=21)
    rock.mesh(mesh, 3.0, (GRANITE, '#6d7448', '#a08a5c'), seed=5)

    # The north-west slope is wooded, round the Chapelle Saint-Aubert
    wood = [(-150, -10), (-60, 40), (-30, 110), (-160, 90), (-200, 30)]
    trees(mesh, rock, wood, 140, 31, low=60)
    trees(mesh, rock, [(40, 40), (110, 40), (120, 90), (40, 100)], 25, 32, low=50)

    church_centre, church_axis = build_church(mesh, church, floor, spire, rock.lowest(church))

    abbey = {
        # name or centroid tag: top metres, roof kind
        'Logis abbatiaux': 84,
        'Belle Chaise': 82,
        'Le Châtelet': 84,
        'Tour Perrine': 88,
    }
    walls_built = 0
    for tags, ring in near:
        name = tags.get('name', '')
        if 'building' not in tags or name == 'Église abbatiale' or len(ring) < 3:
            continue
        ring = ensure_ccw(ring)
        if len(ring) < 3:
            continue
        centre = np.mean(ring, axis=0)
        r_church = np.hypot(*(centre - summit_at))
        base = rock.lowest(ring) - 1.5
        ground = float(rock.at(*centre)[0])
        key = f'{name}{centre.round(1)}'
        if tags.get('building') == 'religious':
            # The Merveille: sheer walls from the north slope up to the cloister's level, the
            # refectory's roof over its eastern half
            mesh.prism(ring, base, floor + 2, shade(ABBEY, 1.02), CHURCH, roof=shade(ABBEY, 0.9), roof_kind=MASONRY)
            c, ax, length, width = obb(ring)
            if ax[0] < 0:
                ax = -ax
            east = c + ax * length / 4
            mesh.box(tuple(east), tuple(ax), length / 2 - 2, width * 0.55, floor + 2, floor + 9, ABBEY, CHURCH, top=False)
            mesh.gable(tuple(east), tuple(ax), length / 2 - 2, width * 0.55, floor + 9, floor + 16, ABBEY, ABBEY_ROOF, CHURCH)
            # Buttresses down the north face
            north = -np.array([-ax[1], ax[0]]) * -1
            for k in range(-5, 6):
                p = c + ax * k * length / 11 + north * (width / 2 + 0.8)
                mesh.box(tuple(p), tuple(ax), 2.2, 2.0, base, floor - 2, shade(ABBEY, 0.97), MASONRY)
            continue
        if name == 'Cloître':
            mesh.prism(ring, base, floor + 2, ABBEY, CHURCH, roof='#5f7a45', roof_kind=LEAVES)
            c, ax, length, width = obb(ring)
            # The galleries' lean-to roofs round the garth
            inner = [tuple(c + (np.array(p) - c) * 0.72) for p in ring]
            n = len(ring)
            for k in range(n):
                a, b = ring[k], ring[(k + 1) % n]
                ia, ib = inner[k], inner[(k + 1) % n]
                mesh.quad((*a, floor + 5), (*b, floor + 5), (*ib, floor + 3), (*ia, floor + 3), ABBEY_ROOF, SLATE, (0, 0, 1))
                mesh.quad((*a, floor + 2), (*b, floor + 2), (*b, floor + 5), (*a, floor + 5), ABBEY, CHURCH, ((b[1] - a[1]), -(b[0] - a[0]), 0))
            continue
        if tags.get('building') == 'church' and r_church < 70:
            # The western buildings under the west terrace
            mesh.prism(ring, base, floor, shade(ABBEY, 0.97), CHURCH, roof=shade(ABBEY, 1.08), roof_kind=MASONRY)
            continue
        if name in abbey or (r_church < 55 and tags.get('building') not in ('house', 'apartments')):
            top = abbey.get(name, max(ground + 14, 74))
            mesh.prism(ring, base, top, ABBEY, CHURCH, top=False)
            c, ax, length, width = obb(ring)
            mesh.gable(tuple(c), tuple(ax), length, width, top, top + min(width, 14) * 0.55, ABBEY, ABBEY_ROOF, CHURCH)
            continue
        if any(word in name for word in ('Tour', 'Bastion', 'Échauguette')):
            c = np.mean(ring, axis=0)
            radius = max(np.linalg.norm(np.array(ring) - c, axis=1).mean(), 2)
            wall_top = max(ground + 9, sand + 12)
            if 'Échauguette' in name:
                mesh.cylinder(tuple(c), radius, wall_top - 4, wall_top + 2.5, RAMPART, MASONRY, top=False)
                mesh.cone(tuple(c), radius + 0.4, wall_top + 2.5, wall_top + 2.5 + radius * 2.2, SLATES[1], SLATE)
                continue
            top = wall_top + 3
            mesh.prism(ring, sand - 1.5, top, RAMPART, MASONRY, roof=shade(RAMPART, 1.1), roof_kind=MASONRY)
            n = len(ring)
            for k in range(n):
                a, b = ring[k], ring[(k + 1) % n]
                crenellate(mesh, a, b, top, 1.8, RAMPART, ((a[0] + b[0]) / 2 - c[0], (a[1] + b[1]) / 2 - c[1], 0))
            if name == 'Tour Gabriel':
                mesh.cylinder(tuple(c), 2.6, top, top + 6, RAMPART, MASONRY, top=False)
                mesh.cone(tuple(c), 3.0, top + 6, top + 11, SLATES[0], SLATE)
            continue
        # A village house: walls to its eaves, a steep slate roof
        c, ax, length, width = obb(ring)
        levels = float(tags.get('building:levels', 0) or 0) or (2 + int(hashed(key, 3)))
        eave = ground + levels * 3.2 + 0.8
        if tags.get('building') in ('church', 'chapel'):
            eave = ground + 8
        wall = HOUSE_WALLS[int(hashed(key + 'w', len(HOUSE_WALLS)))]
        roof = SLATES[int(hashed(key + 'r', len(SLATES)))]
        mesh.prism(ring, base, eave, wall, HOUSE, top=False)
        mesh.flat(ring, eave, shade(wall, 0.8), PLAIN)
        pitch = 0.95 + hashed(key + 'p', 0.3)
        mesh.gable(tuple(c), tuple(ax), length, width, eave, eave + width / 2 * pitch, wall, roof, HOUSE, hip=hashed(key + 'h') < 0.25)
        if hashed(key + 'c') < 0.6:
            chimney = c + ax * (length / 2 - 1.2) * (1 if hashed(key + 's') < 0.5 else -1)
            mesh.box(tuple(chimney), tuple(ax), 1.0, 1.4, eave, eave + width / 2 * pitch + 1.5, shade(wall, 0.85), MASONRY)
        if name == 'Église Saint-Pierre':
            bell = c - ax * (length / 2 - 2.5)
            mesh.box(tuple(bell), tuple(ax), 5, 5, eave, eave + 10, wall, CHURCH)
            mesh.cone(tuple(bell), 3.4, eave + 10, eave + 16, roof, SLATE, sides=4)
        walls_built += 1
    print(f'mount: {walls_built} village houses')

    # The ramparts: their walls round the east and south, crenellated, climbing with the rock
    for tags, ring in near:
        barrier = tags.get('barrier')
        if barrier not in ('city_wall', 'retaining_wall', 'wall'):
            continue
        thickness = {'city_wall': 3.0, 'retaining_wall': 1.2, 'wall': 0.7}[barrier]
        for k in range(len(ring) - 1):
            a, b = np.array(ring[k]), np.array(ring[k + 1])
            seg = np.linalg.norm(b - a)
            if seg < 0.5:
                continue
            ax = (b - a) / seg
            ac = np.array([-ax[1], ax[0]]) * thickness / 2
            mid = (a + b) / 2
            ga, gb = rock.at(*a)[0], rock.at(*b)[0]
            if barrier == 'city_wall':
                ta, tb = max(ga + 8, sand + 11), max(gb + 8, sand + 11)
                lo = sand - 1.5
            else:
                tall = 3.5 if barrier == 'retaining_wall' else 1.8
                ta, tb = ga + tall, gb + tall
                lo = min(ga, gb) - 2
            quad = [tuple(a - ac), tuple(b - ac), tuple(b + ac), tuple(a + ac)]
            colour = shade(RAMPART, 0.95 + hashed(f'{k}{mid}', 0.1))
            mesh.prism(quad, lo, [ta, tb, tb, ta], colour, MASONRY)
            if barrier == 'city_wall':
                outward = mid - np.array([30.0, -20.0])
                crenellate(mesh, a, b, (ta + tb) / 2, thickness, colour, (outward[0], outward[1], 0))

    # The access: the causeway on its embankment from the dam, then the footbridge on its piles
    # to the ford at the Mount's foot
    deck = sand + 3.0
    for tags, ring in rings:
        name = tags.get('name', '')
        if tags.get('highway') is None or name not in ('Pont-passerelle', 'Digue Route', 'Platelage Ouest') and not tags.get('bridge'):
            continue
        if tags.get('highway') == 'footway' and tags.get('bridge'):
            continue
        bridge = tags.get('bridge') == 'yes'
        width = 4.0 if name == 'Platelage Ouest' else 8.0
        pts = np.array(ring, float)
        for k in range(len(pts) - 1):
            a, b = pts[k], pts[k + 1]
            seg = np.linalg.norm(b - a)
            if seg < 0.5:
                continue
            ax = (b - a) / seg
            ac = np.array([-ax[1], ax[0]]) * width / 2
            # Down to the ford over the last stretch before the Mount
            ha = deck - max(0, 1 - np.hypot(*a) / 260) * 2.4 if bridge else deck
            hb = deck - max(0, 1 - np.hypot(*b) / 260) * 2.4 if bridge else deck
            quad = [tuple(a - ac), tuple(b - ac), tuple(b + ac), tuple(a + ac)]
            if bridge:
                mesh.prism(quad, [ha - 0.9, hb - 0.9, hb - 0.9, ha - 0.9], [ha, hb, hb, ha], '#b9b2a6', PLAIN)
                for side in (-1, 1):
                    rail = [tuple(a + ac * side), tuple(b + ac * side), tuple(b + ac * side * 0.96), tuple(a + ac * side * 0.96)]
                    mesh.prism(rail, [ha, hb, hb, ha], [ha + 1.1, hb + 1.1, hb + 1.1, ha + 1.1], '#5b5f63', PLAIN)
                steps = max(1, int(seg // 12))
                for s in range(steps):
                    p = a + (b - a) * (s + 0.5) / steps
                    for side in (-0.6, 0.6):
                        mesh.box(tuple(p + ac * side), tuple(ax), 0.7, 0.7, sand - 3, (ha + hb) / 2 - 0.9, '#a39d93', PLAIN, top=False)
            else:
                ground = bay.sample(bay.ground, np.array([a[0], b[0]]) + origin[0], np.array([a[1], b[1]]) + origin[1])
                wide = [tuple(a - ac * 2.2), tuple(b - ac * 2.2), tuple(b + ac * 2.2), tuple(a + ac * 2.2)]
                mesh.prism(wide, float(ground.min()) - 1, deck - 0.6, '#7d8455', PLAIN, top=False)
                mesh.prism(quad, deck - 0.6, deck, '#6e6c69', PLAIN)
    return mesh, rock, origin


def build_tombelaine(location, frame, mesh_frame_origin):
    t = location['tombelaine']
    origin = frame.en(*t['at'])
    mesh = Mesh(frame, origin)
    h = math.radians(t['heading'])
    ax = np.array([math.cos(h), math.sin(h)])
    ac = np.array([-ax[1], ax[0]])
    ring = [tuple(ax * t['length'] / 2 * math.cos(a) + ac * t['width'] / 2 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 40, endpoint=False)]
    ring = wobble(ring, 9.0, 41, step=5)
    summit_at = ax * -20 + ac * 8
    rock = Rock(ring, summit_at, location['mount']['sand'] - 0.3, t['height'], cliff_bearing=60, seed=44)
    rock.mesh(mesh, 3.0, ('#948a7a', '#77744a', '#9d8a62'), seed=6)
    trees(mesh, rock, ring, 50, 51)
    return mesh


# ------------------------------------------------------------------------------------------------
# Life on the bay


def sheep(location, frame, bay):
    """Flocks on the salt meadows near the Mount, clear of the creeks: [x, y, z, seed] per sheep"""
    cfg = location['sheep']
    rng = np.random.default_rng(17)
    me, mn = frame.en(*location['mount']['at'])
    grazing = bay.meadow & (bay.carve < 0.15) & (np.hypot(bay.east - me, bay.north - mn) < cfg['within'])
    rows, cols = np.nonzero(grazing)
    if len(rows) == 0:
        return []
    out = []
    for _ in range(cfg['flocks']):
        k = rng.integers(len(rows))
        ce, cn = bay.east[rows[k], cols[k]], bay.north[rows[k], cols[k]]
        count = rng.integers(cfg['perFlock'] // 3, cfg['perFlock'])
        spread = rng.uniform(15, 45)
        e = ce + rng.normal(0, spread, count) * rng.uniform(0.6, 1.6)
        n = cn + rng.normal(0, spread, count)
        c, r = bay.pixel(e, n)
        ok = (c >= 0) & (c < bay.size - 1) & (r >= 0) & (r < bay.size - 1)
        e, n = e[ok], n[ok]
        on = bay.sample(grazing.astype(np.float32), e, n) > 0.5
        e, n = e[on], n[on]
        y = bay.sample(bay.ground, e, n)
        for p in zip(e, n, y):
            w = frame.world(p[0], p[1], p[2])
            out.extend([round(float(w[0]), 1), round(float(w[1]), 2), round(float(w[2]), 1), round(float(rng.random()), 3)])
    print(f'sheep: {len(out) // 4}')
    return out


def walkers_path(location, frame, bay):
    """The walkers' path every 8 m, with the ground under it: [x, y, z, ...]"""
    pts = np.array([frame.en(*p) for p in location['walkers']['path']])
    seg = np.hypot(*np.diff(pts, axis=0).T)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.arange(0, s[-1], 8.0)
    e, n = np.interp(t, s, pts[:, 0]), np.interp(t, s, pts[:, 1])
    # A slow wander, as a guide picks the firm sand
    e = e + np.sin(t / 140) * 18
    y = bay.sample(bay.ground, e, n)
    w = frame.world(e, n, y)
    print(f'walkers: a {s[-1] / 1000:.1f} km path')
    return [round(float(v), 2) for v in w.reshape(-1)]


def check_loop(location, rock, origin, frame):
    """How far the soaring loop keeps from the spire and the rock"""
    loop = location.get('soaringLoop', {}).get('waypoints', [])
    lowest = math.inf
    nearest = math.inf
    se, sn = frame.en(*location['mount']['at'])
    for lat, lon, alt in loop:
        e, n = frame.en(lat, lon)
        g = float(rock.at(e - origin[0], n - origin[1])[0])
        lowest = min(lowest, alt - g)
        nearest = min(nearest, math.hypot(e - se, n - sn))
    print(f'loop: at least {lowest:.0f} m over the rock, {nearest:.0f} m from the Mount centre')


# ------------------------------------------------------------------------------------------------
# GLB


def pad4(chunk, fill):
    return chunk + fill * ((4 - len(chunk) % 4) % 4)


def write_glb(nodes, dst):
    """Nodes of (name, Mesh arrays, extras): position, colour and _KIND, non-indexed; no normals, as
    every triangle has its own corners and three.js shades them flat"""
    blobs, accessors, meshes, gltf_nodes = [], [], [], []
    offset = 0
    views = []

    def add(blob, target):
        nonlocal offset
        blob = pad4(blob, b'\0')
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(blob), 'target': target})
        blobs.append(blob)
        offset += len(blob)
        return len(views) - 1

    for i, (name, (pos, nrm, col, kind), extras) in enumerate(nodes):
        print(f'{name}: {len(pos) // 3} triangles')
        base = len(accessors)
        accessors.append({'bufferView': add(pos.tobytes(), 34962), 'componentType': FLOAT, 'count': len(pos), 'type': 'VEC3', 'min': pos.min(axis=0).tolist(), 'max': pos.max(axis=0).tolist()})
        accessors.append({'bufferView': add(col.tobytes(), 34962), 'componentType': UINT8, 'normalized': True, 'count': len(col), 'type': 'VEC3'})
        accessors.append({'bufferView': add(kind.tobytes(), 34962), 'componentType': UINT8, 'count': len(kind), 'type': 'SCALAR'})
        meshes.append({'primitives': [{'attributes': {'POSITION': base, 'COLOR_0': base + 1, '_KIND': base + 2}, 'material': 0}]})
        gltf_nodes.append({'mesh': i, 'name': name, 'extras': extras})
    gltf = {
        'asset': {'version': '2.0', 'generator': '3d/mont-saint-michel-to-glb.py'},
        'scene': 0,
        'scenes': [{'nodes': list(range(len(gltf_nodes)))}],
        'nodes': gltf_nodes,
        'materials': [{'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.9}}],
        'meshes': meshes,
        'buffers': [{'byteLength': offset}],
        'bufferViews': views,
        'accessors': accessors,
    }
    json_chunk = pad4(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
    bin_chunk = b''.join(blobs)
    total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    with open(dst, 'wb') as out:
        out.write(struct.pack('<4sII', b'glTF', 2, total))
        out.write(struct.pack('<I4s', len(json_chunk), b'JSON') + json_chunk)
        out.write(struct.pack('<I4s', len(bin_chunk), b'BIN\0') + bin_chunk)
    print(f'wrote {dst}, {total} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    location = json.load(open(sys.argv[1]))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    frame = Frame(location)
    bay = Bay(location, frame)
    bay.build(fetch(location, 'bay'))
    points, triangles, grid = terrain(location, frame, bay)
    dem.write_glb(points, triangles, out / f"{location['id']}.glb")
    bay_texture(bay, grid, out / f"{location['id']}-bay.png")
    mount, rock, origin = build_mount(location, frame, fetch(location, 'mount'), bay)
    check_loop(location, rock, origin, frame)
    tombelaine = build_tombelaine(location, frame, origin)
    extras = {'sheep': sheep(location, frame, bay), 'walkers': walkers_path(location, frame, bay)}
    write_glb([('Mount', mount.arrays(), extras), ('Tombelaine', tombelaine.arrays(), {})], out / f"{location['id']}-mount.glb")
