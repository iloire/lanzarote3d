#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow", "tifffile", "imagecodecs", "mapbox-earcut"]
# ///
"""
Build the Giza plateau's monuments and the town below it.

The location JSON (src/locations/giza.json) describes them, and the ground comes from
3d/dem-to-glb.py's own sampler, pads and all, so everything stands on the terrain it builds:

- `pyramids`: each built course by course. Where the casing is gone (nearly everywhere) every
  course is a step, its outer edge on the pyramid's slope, a little ragged; `casing` keeps the
  smooth casing from that height up (Khafre's cap), `granite` cases the lowest metres in red
  granite (Menkaure), `gash` scars the north face between two heights, `ruined` makes it more
  ragged, `steps` builds a step pyramid of that many steps instead, `mast` marks the lost apex.
- `sphinx`: sculpted from blocks, 73 m long, facing `heading`.
- `causeways`: raised ramps along the ground.
- `ruins`: every other building OpenStreetMap maps on the plateau (the mastaba fields, the
  temples, the Wall of the Crow), raised from its footprint; heights by name.
- `town`: Nazlet el-Samman, which OpenStreetMap barely maps, made up as blocks of four to six
  storey buildings on the flat ground, on a grid of `voxel` metres, meshed and windowed like a
  city from 3d/city-to-glb.py.

The GLB is in the terrain's world units (scale 1) and frame. Node 0, the monuments, carries
_STONE per vertex (metres along the face, course, joint strength) for the app's stone shader,
which draws a joint where the course's whole number changes, so treads sit mid-course;
node 1, the town, carries _WINDOWS and the grid like a city. No normals: every face has its own
vertices, so three.js shades them flat.

It also prints how far the location's soaringLoop clears everything under it.

Usage: uv run 3d/giza-to-glb.py src/locations/giza.json assets/locations/giza-monuments.glb
"""
import importlib.util
import json
import math
import struct
import sys
import zlib
from pathlib import Path

import mapbox_earcut as earcut
import numpy as np
from PIL import Image, ImageDraw

FLOAT, UINT8, UINT32 = 5126, 5121, 5125


def load(name):
    """A sibling script as a module: dem-to-glb for the ground, city-to-glb for its grid and mesher"""
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), Path(__file__).parent / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


dem = load('dem-to-glb')
city = load('city-to-glb')

# Pyramids: each face is cut into this many pieces along, so its casing and scars can be ragged
SEGMENTS = 8
# How far a course's step may sit in from the slope, metres: weathering, more on a ruin
RAGGED, RUINED = 0.35, 1.6
# Courses are thicker low down: the first is this many times the mean, thinning over ~15 courses
THICK_BASE, THICK_FALL = 1.2, 15
# Khafre's casing ends raggedly, up to this many metres lower in places
CASING_RAGGED = 9
# Step pyramids' walls lean in this steeply
STEP_WALL = math.radians(76)
# Joint strength in the shader: core steps, casing, ruins, and none (smooth carved rock, roofs)
CORE, CASED, MASONRY, PLAIN = 1.0, 0.35, 0.8, 0.0
# Ruins without a height: mastabas between these, metres
RUIN_HEIGHT = (2.5, 6.5)
LEVEL = 3.5
# Ground lower than this, metres, is the valley floor below the escarpment
VALLEY = 32
# Things are sunk this far below the lowest ground under them, metres, so no slope shows a gap
SINK = 1.5

GRANITE = '#9a5e4d'
CASING = '#e2d3b4'
GASH = '#8f7556'
MAST = '#5d5048'
TOWN_FACADES = [
    ('#9a5a40', 5), ('#a4654a', 4), ('#8d5038', 3), ('#a59d92', 3), ('#c8ad80', 2),
    ('#d3bf98', 2), ('#b98d5a', 2), ('#c4998a', 1), ('#d9d2c3', 1),
]
RUIN_COLOURS = ['#c3a376', '#b8976a', '#cbb085', '#ad8d63']
MODERN = '#cfc6b6'


def linear(hex_colour):
    return city.srgb_to_linear(hex_colour)


class Frame:
    """Metres east and north of the bbox centre, and world positions"""

    def __init__(self, location):
        b = location['bbox']
        self.lat0 = (b['north'] + b['south']) / 2
        self.lon0 = (b['east'] + b['west']) / 2
        self.mlon = math.cos(math.radians(self.lat0)) * city.METRES_PER_DEGREE_LON_AT_EQUATOR
        self.upm = location['unitsPerMetre']
        self.up = self.upm * location['verticalExaggeration']
        self.height = dem.ground(location)

    def en(self, lat, lon):
        return (lon - self.lon0) * self.mlon, (lat - self.lat0) * city.METRES_PER_DEGREE_LAT

    def latlon(self, east, north):
        return self.lat0 + np.asarray(north) / city.METRES_PER_DEGREE_LAT, self.lon0 + np.asarray(east) / self.mlon

    def ground(self, east, north):
        """Ground height in metres at points given in metres east and north"""
        lat, lon = self.latlon(np.atleast_1d(east), np.atleast_1d(north))
        return self.height(lat, lon)

    def world(self, east, north, metres):
        return (east * self.upm, metres * self.up, -north * self.upm)


class Mesh:
    """Quads and triangles, each with its own vertices, a colour and stone coordinates each"""

    def __init__(self, frame):
        self.frame = frame
        self.pos, self.col, self.stone, self.idx = [], [], [], []

    def poly(self, points, colour, stone, up=None):
        """A planar convex polygon of (east, north, metres) points, facing `up` if given (a
        vector the normal should agree with), else as wound"""
        world = [self.frame.world(*p) for p in points]
        if up is not None:
            e1, e2 = np.subtract(world[1], world[0]), np.subtract(world[2], world[0])
            normal = np.cross(e1, e2)
            wanted = np.array([up[0], up[2], -up[1]])  # (east, north, up) to world
            if np.dot(normal, wanted) < 0:
                world, stone = world[::-1], stone[::-1]
        base = len(self.pos)
        self.pos.extend(world)
        self.col.extend([linear(colour) if isinstance(colour, str) else colour] * len(world))
        self.stone.extend(stone)
        for k in range(1, len(world) - 1):
            self.idx.extend([base, base + k, base + k + 1])

    def quad(self, points, colour, along, course, joints, up):
        """A quad with its stone coordinates: metres along at each corner, course at each"""
        self.poly(points, colour, [(a, c, joints) for a, c in zip(along, course)], up)


def shade(colour, factor, warm=0.0):
    """A colour in linear rgb, lighter or darker, and yellower by `warm`"""
    c = linear(colour) * factor
    return np.clip(c * np.array([1 + warm, 1 + warm * 0.5, 1 - warm]), 0, 1)


def course_heights(pyramid, rng):
    """The tops of the courses, metres above the base, ending at the standing height"""
    n = pyramid['courses']
    k = np.arange(n)
    thick = (1 + THICK_BASE * np.exp(-k / THICK_FALL)) * rng.uniform(0.7, 1.3, n)
    # Every 20-35 courses a thicker band, as on Khufu
    band = np.zeros(n)
    at = rng.integers(8, 20)
    while at < n:
        band[at : at + 2] = 0.6
        at += rng.integers(20, 36)
    thick *= 1 + band
    return np.cumsum(thick) / thick.sum() * pyramid['standing']


def build_pyramid(mesh, pyramid, frame, seed):
    """A pyramid course by course: steps where the casing is gone, smooth faces where it stays"""
    rng = np.random.default_rng(seed)
    ce, cn = frame.en(*pyramid['at'])
    width, depth = dem.sides(pyramid)
    base = float(frame.ground(ce, cn)[0])
    if pyramid.get('steps'):
        return build_step_pyramid(mesh, pyramid, ce, cn, base, rng)

    height, standing = pyramid['height'], pyramid['standing']
    tops = course_heights(pyramid, rng)
    # The first course starts under the ground, so no neighbouring pad's step shows a gap
    bottoms = np.concatenate(([-SINK], tops[:-1]))
    ragged = RUINED if pyramid.get('ruined') else RAGGED
    n = len(tops)
    # Faces: east, north, west, south, as (outward east, outward north)
    faces = [(1, 0), (0, 1), (-1, 0), (0, -1)]

    def half(y, axis):
        """Half the base along an axis (0 east-west, 1 north-south) at y metres up the slope"""
        return (width if axis == 0 else depth) / 2 * (1 - y / height)

    # Each course's step on each face: how far it sits in from the slope, and whether that piece
    # of the face is cased, granite or scarred
    inset = rng.uniform(0, ragged, (n, 4)) * (0.4 + 0.6 * rng.random((n, 4)))
    casing_from = pyramid.get('casing')
    casing_edge = None
    if casing_from is not None:
        casing_edge = casing_from - CASING_RAGGED * np.abs(np.sin(rng.uniform(0, np.pi, (4, 1)) + np.linspace(0, 2.4, SEGMENTS)))
        casing_edge -= rng.uniform(0, 3, (4, SEGMENTS))
    granite_to = pyramid.get('granite', 0)
    granite_edge = granite_to * rng.uniform(0.45, 1.0, (4, SEGMENTS))
    gash = pyramid.get('gash')
    colour = pyramid['color']

    def corners(k):
        """A course's step outline: its half-size out from the centre on each face, at its top"""
        out = []
        for f, (de, dn) in enumerate(faces):
            axis = 0 if de else 1
            out.append(half(tops[k], axis) - inset[k, f])
        return out  # east, north, west, south

    def piece_state(k, f, j):
        y0 = bottoms[k]
        if casing_edge is not None and y0 >= casing_edge[f, j]:
            return 'cased'
        if granite_to and y0 < granite_edge[f, j]:
            return 'granite'
        return 'core'

    def edge(f, reach, along_lo, along_hi, metres):
        """Points along a face at `reach` out from the centre: (east, north, metres) from
        along_lo to along_hi (metres along the face, measured anticlockwise seen from above)"""
        de, dn = faces[f]
        # Along runs east-to-west... anticlockwise: on the east face northwards, on the north
        # face westwards, and so on
        te, tn = -dn, de
        return [(ce + de * reach + te * a, cn + dn * reach + tn * a, base + metres) for a in (along_lo, along_hi)]

    for k in range(n):
        y0, y1 = bottoms[k], tops[k]
        out = corners(k)
        nxt = corners(k + 1) if k + 1 < n else None
        tint = 1 + rng.uniform(-0.05, 0.05)
        for f in range(4):
            de, dn = faces[f]
            # The face runs between the neighbouring faces' reaches: from the previous face's
            # (clockwise) to the next's
            lo_reach, hi_reach = out[(f - 1) % 4], out[(f + 1) % 4]
            cased_lo, cased_hi = half(y0, 1 - (0 if de else 1)), half(y1, 1 - (0 if de else 1))
            axis = 0 if de else 1
            for j in range(SEGMENTS):
                t0, t1 = j / SEGMENTS, (j + 1) / SEGMENTS
                state = piece_state(k, f, j)
                scarred = gash and f == 1 and gash[0] <= y0 < gash[1] and 2 <= j < SEGMENTS - 2
                if state == 'cased' or state == 'granite':
                    # On the slope itself, from the bottom of the course to its top
                    bottom = half(y0, axis)
                    top = half(y1, axis)
                    a0 = -cased_lo + 2 * cased_lo * t0
                    a1 = -cased_lo + 2 * cased_lo * t1
                    b0 = -cased_hi + 2 * cased_hi * t0
                    b1 = -cased_hi + 2 * cased_hi * t1
                    p = edge(f, bottom, a0, a1, y0) + edge(f, top, b1, b0, y1)
                    c = shade(GRANITE if state == 'granite' else CASING, tint * (0.85 if scarred else 1))
                    mesh.quad(p, c, [a0, a1, b1, b0], [k, k, k + 1, k + 1], CASED, (de, dn, 0.3))
                    if nxt is not None and piece_state(k + 1, f, j) == 'core':
                        # A ledge from the casing's top edge back to the core's step above it
                        inner = nxt[f]
                        lo_in, hi_in = nxt[(f - 1) % 4], nxt[(f + 1) % 4]
                        i0 = -lo_in + (lo_in + hi_in) * t0
                        i1 = -lo_in + (lo_in + hi_in) * t1
                        ledge = edge(f, top, b0, b1, y1) + edge(f, inner, i1, i0, y1)
                        mesh.quad(ledge, shade(colour, tint * 1.08, 0.04), [b0, b1, i1, i0], [k + 0.5] * 4, CORE, (0, 0, 1))
                    continue
                # A step: its riser on the face, then its tread back to the next course's riser
                reach = out[f]
                a0 = -lo_reach + (lo_reach + hi_reach) * t0
                a1 = -lo_reach + (lo_reach + hi_reach) * t1
                c = shade(GASH if scarred else colour, tint * (0.8 if scarred else 1))
                riser = edge(f, reach, a0, a1, y0) + edge(f, reach, a1, a0, y1)
                mesh.quad(riser, c, [a0, a1, a1, a0], [k, k, k + 0.999, k + 0.999], CORE, (de, dn, 0))
                if nxt is None:
                    continue
                if casing_edge is not None and tops[k] >= casing_edge[f, j]:
                    # The casing above starts on the slope, out at this step's own edge
                    continue
                inner = nxt[f]
                lo_in, hi_in = nxt[(f - 1) % 4], nxt[(f + 1) % 4]
                i0 = -lo_in + (lo_in + hi_in) * t0
                i1 = -lo_in + (lo_in + hi_in) * t1
                tread = edge(f, reach, a0, a1, y1) + edge(f, inner, i1, i0, y1)
                mesh.quad(tread, shade(GASH if scarred else colour, tint * 1.08, 0.04), [a0, a1, i1, i0], [k + 0.5] * 4, CORE, (0, 0, 1))
    # The flat top, and the mast that marks where the apex was
    top = corners(n - 1)
    flat = [
        (ce + top[0], cn - top[3], base + standing),
        (ce + top[0], cn + top[1], base + standing),
        (ce - top[2], cn + top[1], base + standing),
        (ce - top[2], cn - top[3], base + standing),
    ]
    mesh.quad(flat, shade(colour, 1.05, 0.04), [0, 1, 1, 0], [n - 0.5] * 4, CORE, (0, 0, 1))
    if pyramid.get('mast'):
        box(mesh, ce, cn, 0.25, 0.25, base + standing, base + height, MAST)
    print(f"{pyramid['name']}: {n} courses on {base:.1f} m")
    return base


def box(mesh, ce, cn, half_e, half_n, y0, y1, colour, joints=PLAIN, top_scale=1.0):
    """A box (its top shrunk by top_scale, for a battered wall) from y0 to y1 metres"""
    frustum(mesh, [(ce - half_e, cn - half_n), (ce + half_e, cn - half_n), (ce + half_e, cn + half_n), (ce - half_e, cn + half_n)], y0, y1, colour, joints, top_scale)


def frustum(mesh, ring, y0, y1, colour, joints=PLAIN, top_scale=1.0):
    """A convex ring of (east, north) raised from y0 to y1, its top shrunk towards its middle"""
    ce = sum(p[0] for p in ring) / len(ring)
    cn = sum(p[1] for p in ring) / len(ring)
    topring = [(ce + (e - ce) * top_scale, cn + (n - cn) * top_scale) for e, n in ring]
    c = shade(colour, 1) if isinstance(colour, str) else colour
    along = 0.0
    for k in range(len(ring)):
        (e0, n0), (e1, n1) = ring[k], ring[(k + 1) % len(ring)]
        (u0, v0), (u1, v1) = topring[k], topring[(k + 1) % len(ring)]
        length = math.hypot(e1 - e0, n1 - n0)
        out = (n1 - n0, -(e1 - e0), 0)  # outward for an anticlockwise ring
        mesh.quad([(e0, n0, y0), (e1, n1, y0), (u1, v1, y1), (u0, v0, y1)], c, [along, along + length, along + length, along], [y0 / 0.9, y0 / 0.9, y1 / 0.9, y1 / 0.9], joints, out)
        along += length
    roof = shade(colour, 1.06, 0.03) if isinstance(colour, str) else np.clip(colour * 1.06, 0, 1)
    mesh.quad([(u, v, y1) for u, v in topring], roof, [0] * len(topring), [0] * len(topring), PLAIN, (0, 0, 1))


def build_step_pyramid(mesh, pyramid, ce, cn, base, rng):
    """A step pyramid: `steps` tiers with leaning walls, each set back on the one below"""
    steps = pyramid['steps']
    width, depth = dem.sides(pyramid)
    tier = pyramid['standing'] / steps
    lean = tier / math.tan(STEP_WALL)
    for i in range(steps):
        shrink = 1 - i / (steps + 0.4)
        half_e, half_n = width / 2 * shrink, depth / 2 * shrink
        top_scale = 1 - lean / min(half_e, half_n)
        tint = 1 + rng.uniform(-0.05, 0.05)
        box(mesh, ce, cn, half_e, half_n, base + i * tier - (SINK if i == 0 else 0), base + (i + 1) * tier, shade(pyramid['color'], tint), MASONRY, top_scale)
    print(f"{pyramid['name']}: {steps} steps on {base:.1f} m")
    return base


def build_sphinx(mesh, sphinx, frame):
    """The Sphinx from blocks, in metres along its body (x, forward), across (z, to its right)
    and up, from the tip of its tail to the tips of its paws"""
    ce, cn = frame.en(*sphinx['at'])
    floor = float(frame.ground(ce, cn)[0])
    theta = math.radians(90 - sphinx['heading'])  # heading from north, clockwise; x forward
    fwd = (math.cos(theta), math.sin(theta))
    right = (fwd[1], -fwd[0])

    def at(x, z):
        return (ce + fwd[0] * x + right[0] * z, cn + fwd[1] * x + right[1] * z)

    def part(x0, x1, z0, z1, y0, y1, colour, top=1.0, joints=PLAIN, front=0.0):
        """A block, its top shrunk across by `top` and pulled back from the front by `front` metres"""
        ring = [at(x0, z0), at(x1, z0), at(x1, z1), at(x0, z1)]
        top_ring = [at(x0, z0 * top), at(x1 - front, z0 * top), at(x1 - front, z1 * top), at(x0, z1 * top)]
        # Make sure the ring winds anticlockwise seen from above
        area = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1]))
        if area < 0:
            ring, top_ring = ring[::-1], top_ring[::-1]
        c = shade(colour, 1)
        along = 0.0
        for k in range(4):
            (e0, n0), (e1, n1) = ring[k], ring[(k + 1) % 4]
            (u0, v0), (u1, v1) = top_ring[k], top_ring[(k + 1) % 4]
            length = math.hypot(e1 - e0, n1 - n0)
            mesh.quad([(e0, n0, floor + y0), (e1, n1, floor + y0), (u1, v1, floor + y1), (u0, v0, floor + y1)], c, [along, along + length, along + length, along], [y0 / 0.9, y0 / 0.9, y1 / 0.9, y1 / 0.9], joints, (n1 - n0, -(e1 - e0), 0))
            along += length
        mesh.quad([(u, v, floor + y1) for u, v in top_ring], shade(colour, 1.05, 0.03), [0] * 4, [0] * 4, PLAIN, (0, 0, 1))

    body, upper, light, head, nemes, face, stele = '#b08a57', '#a07c4e', '#bfa47a', '#b99561', '#b4925f', '#ad8a5a', '#6e5f57'
    # The rock body, in two layers of different stone; restoration blocks round its foot
    part(-36, 18, -6.5, 6.5, -SINK, 6, body)
    part(-35, 17, -6.2, 6.2, 6, 10.5, upper, top=0.72)
    part(-37, 19, -7.2, 7.2, -SINK, 2.6, light, joints=MASONRY)
    # The haunch and the tail curled along its right side
    part(-36, -25, -7.6, 7.6, -SINK, 8.5, body, top=0.8)
    part(-31, -14, 7.2, 8.2, -SINK, 0.9, upper)
    # Chest, shoulders and forelegs
    part(12, 22, -6.2, 6.2, -SINK, 12.5, body, top=0.85, front=2)
    part(12, 24, -7.4, -2.8, -SINK, 4.5, light, joints=MASONRY)
    part(12, 24, 2.8, 7.4, -SINK, 4.5, light, joints=MASONRY)
    # Paws reaching forward, the Dream Stele between them
    part(23, 37, -6.8, -3.2, -SINK, 2.4, light, joints=MASONRY)
    part(23, 37, 3.2, 6.8, -SINK, 2.4, light, joints=MASONRY)
    part(23.5, 24.2, -1.3, 1.3, -SINK, 3.6, stele)
    # Neck, the nemes headdress falling to the shoulders, the head and its face
    part(14, 20, -2.8, 2.8, 12, 15, upper)
    part(14, 19.5, -4.6, -2.4, 10.5, 18.5, nemes, top=0.75, front=1)
    part(14, 19.5, 2.4, 4.6, 10.5, 18.5, nemes, top=0.75, front=1)
    part(14.5, 21, -2.7, 2.7, 14, 19.2, head)
    part(13.5, 20.5, -3.4, 3.4, 18.6, 20.2, nemes, top=0.8, front=1.5)
    part(21, 21.7, -2.1, 2.1, 14.4, 18.4, face)
    part(21.6, 22.2, -0.5, 0.5, 15.6, 16.6, upper)  # what is left of the nose
    for z in (-1.2, 1.2):
        part(21.65, 21.8, z - 0.45, z + 0.45, 17.0, 17.4, '#6e5a44')  # eyes
    print(f'Sphinx on {floor:.1f} m')


def build_causeway(mesh, causeway, frame):
    """A raised ramp down the slope, in 10 m pieces each on its own ground"""
    e0, n0 = frame.en(*causeway['from'])
    e1, n1 = frame.en(*causeway['to'])
    length = math.hypot(e1 - e0, n1 - n0)
    steps = max(1, int(length / 10))
    de, dn = (e1 - e0) / length, (n1 - n0) / length
    half = causeway['width'] / 2
    colour = '#bfa27a'
    for k in range(steps):
        a, b = k / steps, (k + 1) / steps
        pa = (e0 + (e1 - e0) * a, n0 + (n1 - n0) * a)
        pb = (e0 + (e1 - e0) * b, n0 + (n1 - n0) * b)
        ga, gb = frame.ground(*pa)[0], frame.ground(*pb)[0]
        ring = [
            (pa[0] + dn * half, pa[1] - de * half),
            (pb[0] + dn * half, pb[1] - de * half),
            (pb[0] - dn * half, pb[1] + de * half),
            (pa[0] - dn * half, pa[1] + de * half),
        ]
        frustum(mesh, ring, min(ga, gb) - SINK, max(ga, gb) + causeway['height'], shade(colour, 1 + 0.04 * math.sin(k)), MASONRY, 0.92)
    print(f"{causeway['name']}: {length:.0f} m")


def ring_area(ring):
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1])) / 2


def extrude(mesh, ring, y0, y1, colour, joints, batter):
    """A footprint of any shape raised from y0 to y1, walls leaning in by `batter` metres when
    it is a plain rectangle"""
    if ring_area(ring) < 0:
        ring = ring[::-1]
    if len(ring) == 4 and batter > 0:
        sides = [math.dist(ring[k], ring[(k + 1) % 4]) for k in range(4)]
        frustum(mesh, ring, y0, y1, colour, joints, max(0.5, 1 - 2 * batter / min(sides)))
        return
    frustum_walls(mesh, ring, y0, y1, colour, joints)
    flat = np.array(ring, np.float64)
    triangles = earcut.triangulate_float64(flat, np.array([len(ring)], np.uint32))
    roof = shade(colour, 1.06, 0.03)
    for t in range(0, len(triangles), 3):
        points = [(*ring[triangles[t + i]], y1) for i in range(3)]
        mesh.poly(points, roof, [(0, 0, PLAIN)] * 3, (0, 0, 1))


def frustum_walls(mesh, ring, y0, y1, colour, joints):
    c = shade(colour, 1)
    along = 0.0
    for k in range(len(ring)):
        (e0, n0), (e1, n1) = ring[k], ring[(k + 1) % len(ring)]
        length = math.hypot(e1 - e0, n1 - n0)
        mesh.quad([(e0, n0, y0), (e1, n1, y0), (e1, n1, y1), (e0, n0, y1)], c, [along, along + length, along + length, along], [y0 / 0.9, y0 / 0.9, y1 / 0.9, y1 / 0.9], joints, (n1 - n0, -(e1 - e0), 0))
        along += length


def build_ruins(mesh, location, frame, heights_grid):
    """Every building OpenStreetMap maps on the plateau but the pyramids and the Sphinx, raised
    from its footprint: mastabas and ruins in stone, temples by name, modern buildings plain"""
    config = location['ruins']
    elements = city.fetch(location, 'buildings') + [w for w in city.fetch(location, 'walls')]
    count = 0
    for element in elements:
        tags = element.get('tags', {})
        name = tags.get('name:en') or tags.get('name') or ''
        if tags.get('tomb') == 'pyramid' or tags.get('building') in ('sphinx', 'roof') or name in config['skip']:
            continue
        outer, _ = city.rings(element)
        if not outer or len(outer[0]) < 3:
            continue
        key = f"{element['type']}{element['id']}"
        pick = zlib.crc32(key.encode())
        if tags.get('historic') == 'wall':
            # A line, not a footprint: a wall 10 m thick along it
            points = [frame.en(lat, lon) for lat, lon in outer[0]]
            height = config['heights'].get(name, 4)
            for (e0, n0), (e1, n1) in zip(points, points[1:]):
                length = math.hypot(e1 - e0, n1 - n0)
                de, dn = (e1 - e0) / length * 5, (n1 - n0) / length * 5
                ring = [(e0 + dn, n0 - de), (e1 + dn, n1 - de), (e1 - dn, n1 + de), (e0 - dn, n0 + de)]
                g = frame.ground(np.array([e0, e1]), np.array([n0, n1]))
                frustum(mesh, ring, float(g.min()) - SINK, float(g.mean()) + height, shade('#b39670', 1), MASONRY, 0.85)
            count += 1
            continue
        ring = [frame.en(lat, lon) for lat, lon in outer[0][:-1]]
        if len(ring) < 3:
            continue
        g = frame.ground(np.array([p[0] for p in ring]), np.array([p[1] for p in ring]))
        if not len(g):
            continue
        # Up on the plateau a plain building=yes is an ancient footprint; down in the valley, or
        # with storeys or a modern use, it's a building of today
        valley = float(g.min()) < VALLEY
        modern = not tags.get('historic') and 'Temple' not in name and (
            valley or tags.get('building') not in ('yes', 'ruins', 'temple') or 'building:levels' in tags
        )
        if name in config['heights']:
            height = config['heights'][name]
        elif modern:
            height = city.height_of(tags, 9)
        else:
            height = RUIN_HEIGHT[0] + (RUIN_HEIGHT[1] - RUIN_HEIGHT[0]) * (pick % 1000) / 1000
        colour = MODERN if modern else RUIN_COLOURS[pick % len(RUIN_COLOURS)]
        top = float(g.mean()) + height
        extrude(mesh, ring, float(g.min()) - SINK, top, colour, PLAIN if modern else MASONRY, 0 if modern else height * 0.12)
        heights_grid.append((ring, top))
        count += 1
    print(f'{count} ruins, temples and other buildings on the plateau')


def build_town(location, frame):
    """Nazlet el-Samman on a grid of `voxel` metres: streets every 60-110 m each way, the blocks
    between cut into plots, each a building of two to seven storeys, a few left empty"""
    town = location['town']
    rng = np.random.default_rng(7)
    level = next(p for p in location['flatten'] if p['name'] == 'Nazlet el-Samman')['height']
    spec = {**location, 'city': {'voxel': town['voxel'], 'gridHeading': 0, 'defaultHeight': 12}, 'flatLand': level}
    grid = city.Grid(spec)
    cc, rr = np.meshgrid(np.arange(grid.cols) + 0.5, np.arange(grid.rows) + 0.5)
    east, south = grid.world(cc, rr)
    north = -south
    lat, lon = frame.latlon(east, north)
    inside = np.zeros(cc.shape, bool)
    for area in town['areas']:
        inside |= (lat >= area['south']) & (lat <= area['north']) & (lon >= area['west']) & (lon <= area['east'])
    for spot in town['clear']:
        se, sn = frame.en(*spot['at'])
        inside &= np.hypot(east - se, north - sn) > spot['radius']
    # Only where the town's pad laid the ground flat
    inside &= np.abs(frame.height(lat, lon) - level) < 0.01
    inside &= grid.inside()

    # Streets: lines of cells every so often down the columns and along the rows
    street = np.zeros(cc.shape, bool)
    for axis, length in ((1, grid.cols), (0, grid.rows)):
        at = int(rng.integers(5, 20))
        while at < length:
            width = int(rng.integers(2, 4))
            if axis == 1:
                street[:, at : at + width] = True
            else:
                street[at : at + width, :] = True
            at += width + int(rng.integers(20, 37))

    heights = np.zeros(cc.shape, np.float32)
    owner = np.full(cc.shape, -1, np.int32)
    colours, styles = [], []
    palette = [c for c, w in TOWN_FACADES for _ in range(w)]
    # Cut each block into strips along the rows and the strips into plots
    open_cells = inside & ~street
    r = 0
    while r < grid.rows:
        depth = int(rng.integers(4, 8))
        alley = rng.random() < 0.25
        c = 0
        while c < grid.cols:
            width = int(rng.integers(3, 7))
            cells = (slice(r, r + depth), slice(c, c + width))
            mask = open_cells[cells]
            if mask.any() and rng.random() > 0.08:
                floors = int(rng.choice([2, 3, 4, 4, 5, 5, 5, 6, 6, 7]))
                heights[cells][mask] = floors * LEVEL
                owner[cells][mask] = len(colours)
                colours.append(palette[int(rng.integers(len(palette)))])
                styles.append(city.PUNCHED)
            c += width
        r += depth + (1 if alley else 0)
    print(f'town: {len(colours)} plots on a {grid.cols}x{grid.rows} grid of {grid.size} m')
    positions, colours8, windows, triangles = city.mesh(spec, grid, heights, owner, colours, styles)
    return (positions, colours8, windows, triangles), grid.extras(spec), (heights, grid, level)


def surface(location, frame, pyramids, ruins, town, size=2.0):
    """The highest thing at every point, metres, on a grid of `size` metres: for the loop check"""
    b = location['bbox']
    half_w = (b['east'] - b['west']) * frame.mlon / 2
    half_d = (b['north'] - b['south']) * city.METRES_PER_DEGREE_LAT / 2
    es = np.arange(-half_w, half_w, size)
    ns = np.arange(-half_d, half_d, size)
    ee, nn = np.meshgrid(es, ns)
    top = frame.ground(ee.ravel(), nn.ravel()).reshape(ee.shape)
    for pyramid, base in pyramids:
        ce, cn = frame.en(*pyramid['at'])
        width, depth = dem.sides(pyramid)
        rise = pyramid['height'] * np.minimum(1 - np.abs(ee - ce) / (width / 2), 1 - np.abs(nn - cn) / (depth / 2))
        top = np.maximum(top, np.where(rise > 0, base + np.minimum(rise, pyramid['standing']), -1e9))
    image = Image.new('F', (len(es), len(ns)), -1e9)
    draw = ImageDraw.Draw(image)
    for ring, height in ruins:
        draw.polygon([((e + half_w) / size, (n + half_d) / size) for e, n in ring], fill=height)
    top = np.maximum(top, np.array(image))
    # The town's grid runs east (columns) and north (rows)
    heights, grid, level = town
    col = ((ee - grid.u0) / grid.size).astype(int)
    row = ((nn - grid.v0) / grid.size).astype(int)
    on = (col >= 0) & (col < grid.cols) & (row >= 0) & (row < grid.rows)
    built = np.zeros_like(top)
    built[on] = heights[row[on], col[on]]
    top = np.where(built > 0, np.maximum(top, level + built), top)
    return es, ns, top


def check_loop(location, frame, es, ns, top):
    """How far the soaring loop's curve clears everything within the paramotor's reach"""
    loop = location.get('soaringLoop', {}).get('waypoints', [])
    if not loop:
        return
    size = es[1] - es[0]
    span = int(city.LOOP_RADIUS / size) + 1
    worst = math.inf
    for k, points in city.loop_curve(loop):
        lowest = math.inf
        for lat, lon, alt in points:
            e, n = frame.en(lat, lon)
            i, j = int((n - ns[0]) / size), int((e - es[0]) / size)
            under = float(top[max(i - span, 0) : i + span + 1, max(j - span, 0) : j + span + 1].max())
            lowest = min(lowest, alt - under)
        worst = min(worst, lowest)
        print(f'  leg {k} -> {(k + 1) % len(loop)}: {lowest:.0f} m over what is under it')
    print(f'soaring loop clears everything by {worst:.0f} m at least')


def write_glb(monuments, town, extras, dst):
    """The monuments (node 0, with _STONE) and the town (node 1, with _WINDOWS and the grid)"""
    m_pos, m_col, m_stone, m_idx = monuments
    t_pos, t_col, t_win, t_idx = town
    blobs = [
        (m_pos.tobytes(), 34962),
        (city.pad4(m_col.tobytes(), b'\0'), 34962),
        (m_stone.tobytes(), 34962),
        (m_idx.tobytes(), 34963),
        (t_pos.tobytes(), 34962),
        (city.pad4(t_col.tobytes(), b'\0'), 34962),
        (city.pad4(t_win.tobytes(), b'\0'), 34962),
        (t_idx.tobytes(), 34963),
    ]
    views, offset = [], 0
    for blob, target in blobs:
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(blob), 'target': target})
        offset += len(blob)

    def vec3(view, data):
        return {'bufferView': view, 'componentType': FLOAT, 'count': len(data), 'type': 'VEC3', 'min': data.min(axis=0).tolist(), 'max': data.max(axis=0).tolist()}

    gltf = {
        'asset': {'version': '2.0', 'generator': '3d/giza-to-glb.py'},
        'scene': 0,
        'scenes': [{'nodes': [0, 1]}],
        'nodes': [
            {'mesh': 0, 'name': 'Monuments', 'extras': {'stone': True}},
            {'mesh': 1, 'name': 'Town', 'extras': extras},
        ],
        # Two-sided: where a cased piece of a face meets a stepped one there's a sliver of a gap
        'materials': [{'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.9}, 'doubleSided': True}],
        'meshes': [
            {'primitives': [{'attributes': {'POSITION': 0, 'COLOR_0': 1, '_STONE': 2}, 'indices': 3, 'material': 0}]},
            {'primitives': [{'attributes': {'POSITION': 4, 'COLOR_0': 5, '_WINDOWS': 6}, 'indices': 7, 'material': 0}]},
        ],
        'buffers': [{'byteLength': offset}],
        'bufferViews': views,
        'accessors': [
            vec3(0, m_pos),
            {'bufferView': 1, 'componentType': UINT8, 'normalized': True, 'count': len(m_col), 'type': 'VEC3'},
            {'bufferView': 2, 'componentType': FLOAT, 'count': len(m_stone), 'type': 'VEC3'},
            {'bufferView': 3, 'componentType': UINT32, 'count': len(m_idx), 'type': 'SCALAR'},
            vec3(4, t_pos),
            {'bufferView': 5, 'componentType': UINT8, 'normalized': True, 'count': len(t_col), 'type': 'VEC3'},
            {'bufferView': 6, 'componentType': UINT8, 'count': len(t_win), 'type': 'SCALAR'},
            {'bufferView': 7, 'componentType': UINT32, 'count': len(t_idx), 'type': 'SCALAR'},
        ],
    }
    json_chunk = city.pad4(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
    bin_chunk = b''.join(blob for blob, _ in blobs)
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
    city.LAYERS['walls'] = ['["historic"="wall"]']
    city.WAYS_ONLY.add('walls')
    frame = Frame(location)
    mesh = Mesh(frame)
    pyramids = [(p, build_pyramid(mesh, p, frame, k)) for k, p in enumerate(location['pyramids'])]
    build_sphinx(mesh, location['sphinx'], frame)
    for causeway in location.get('causeways', []):
        build_causeway(mesh, causeway, frame)
    ruins = []
    build_ruins(mesh, location, frame, ruins)
    monuments = (
        np.array(mesh.pos, np.float32),
        np.round(np.clip(np.array(mesh.col), 0, 1) * 255).astype(np.uint8),
        np.array(mesh.stone, np.float32),
        np.array(mesh.idx, np.uint32),
    )
    print(f'monuments: {len(mesh.pos)} vertices, {len(mesh.idx) // 3} triangles')
    town, extras, town_plots = build_town(location, frame)
    es, ns, top = surface(location, frame, pyramids, ruins, town_plots)
    check_loop(location, frame, es, ns, top)
    write_glb(monuments, town, extras, sys.argv[2])
