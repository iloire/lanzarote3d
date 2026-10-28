#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "tifffile", "imagecodecs"]
# ///
"""
Build a location's terrain GLB from the Copernicus GLO-30 elevation model.

The location JSON (src/locations/<id>.json) gives the bounding box, the grid spacing in metres,
world units per metre and how much to stretch heights. This downloads the 1° tiles it needs
from the public AWS bucket (cached in 3d/dem-cache/), samples them on a regular grid and
writes the same slim GLB as 3d/slim-glb.py: positions and 16-bit triangle indices only.

The GLB is in world units already (scale 1): x east, z south, y up, the bbox centre at
x = z = 0, so the location's GeoAnchor is just the centre of the bbox. Ground at or below 0 m
(the sea, the lagoons) is dropped to SEA_FLOOR, under the water plane. A city sets flatLand,
and all its land is laid at that height.

Usage: uv run 3d/dem-to-glb.py src/locations/rio-de-janeiro.json assets/locations/rio-de-janeiro.glb
"""
import json
import math
import struct
import sys
import urllib.request
from pathlib import Path

import numpy as np
import tifffile

# Same constants as src/shared/geo.ts, so the anchor maps lat/lon exactly onto this grid.
METRES_PER_DEGREE_LAT = 110574
METRES_PER_DEGREE_LON_AT_EQUATOR = 111320
SEA_FLOOR = -6.0
CACHE = Path(__file__).parent / 'dem-cache'
BUCKET = 'https://copernicus-dem-30m.s3.amazonaws.com'
FLOAT, UINT16 = 5126, 5123


def tile_name(lat_floor, lon_floor):
    ns = f"{'N' if lat_floor >= 0 else 'S'}{abs(lat_floor):02d}"
    ew = f"{'E' if lon_floor >= 0 else 'W'}{abs(lon_floor):03d}"
    return f'Copernicus_DSM_COG_10_{ns}_00_{ew}_00_DEM'


def load_tile(lat_floor, lon_floor):
    """Heights and georeferencing of the 1° tile whose south-west corner is given"""
    name = tile_name(lat_floor, lon_floor)
    path = CACHE / f'{name}.tif'
    if not path.exists():
        CACHE.mkdir(exist_ok=True)
        print(f'downloading {name}')
        urllib.request.urlretrieve(f'{BUCKET}/{name}/{name}.tif', path)
    with tifffile.TiffFile(path) as tif:
        page = tif.pages[0]
        scale = page.tags['ModelPixelScaleTag'].value
        tie = page.tags['ModelTiepointTag'].value
        return page.asarray().astype(np.float32), tie[3], tie[4], scale[0], scale[1]


def sampler(bbox):
    """Bilinear height (m) at any lat/lon inside the bbox, across tile edges"""
    tiles = {}
    for lat_floor in range(math.floor(bbox['south']), math.floor(bbox['north']) + 1):
        for lon_floor in range(math.floor(bbox['west']), math.floor(bbox['east']) + 1):
            tiles[(lat_floor, lon_floor)] = load_tile(lat_floor, lon_floor)

    def height(lat, lon):
        out = np.zeros_like(lat)
        for (lat_floor, lon_floor), (z, west, north, dx, dy) in tiles.items():
            inside = (np.floor(lat) == lat_floor) & (np.floor(lon) == lon_floor)
            if not inside.any():
                continue
            # Pixel-is-area: pixel centres sit half a pixel in from the tiepoint.
            col = (lon[inside] - west) / dx - 0.5
            row = (north - lat[inside]) / dy - 0.5
            c0 = np.clip(np.floor(col).astype(int), 0, z.shape[1] - 2)
            r0 = np.clip(np.floor(row).astype(int), 0, z.shape[0] - 2)
            fc, fr = np.clip(col - c0, 0, 1), np.clip(row - r0, 0, 1)
            top = z[r0, c0] * (1 - fc) + z[r0, c0 + 1] * fc
            bottom = z[r0 + 1, c0] * (1 - fc) + z[r0 + 1, c0 + 1] * fc
            out[inside] = top * (1 - fr) + bottom * fr
        return out

    return height


def build_grid(location):
    bbox = location['bbox']
    upm = location['unitsPerMetre']
    lat0 = (bbox['north'] + bbox['south']) / 2
    lon0 = (bbox['east'] + bbox['west']) / 2
    metres_per_lon = math.cos(math.radians(lat0)) * METRES_PER_DEGREE_LON_AT_EQUATOR
    width = (bbox['east'] - bbox['west']) * metres_per_lon
    depth = (bbox['north'] - bbox['south']) * METRES_PER_DEGREE_LAT
    cols = int(width // location['spacing']) + 1
    rows = int(depth // location['spacing']) + 1
    if rows * cols > 0xFFFF:
        sys.exit(f'{rows}x{cols} points do not fit 16-bit indices: widen spacing or shrink bbox')

    east = np.linspace(-width / 2, width / 2, cols)
    south = np.linspace(-depth / 2, depth / 2, rows)
    ee, ss = np.meshgrid(east, south)
    lat = lat0 - ss / METRES_PER_DEGREE_LAT
    lon = lon0 + ee / metres_per_lon
    metres = sampler(bbox)(lat, lon)

    # A city's model would carry its rooftops (the DEM is a surface model), so its land is
    # laid flat at flatLand metres and the buildings come from 3d/city-to-glb.py instead.
    if 'flatLand' in location:
        metres = np.where(metres > 0, location['flatLand'], metres)
    y = np.where(metres > 0, metres * upm * location['verticalExaggeration'], SEA_FLOOR)
    points = np.stack([ee * upm, y, ss * upm], axis=-1).reshape(-1, 3).astype(np.float32)

    # Two triangles per cell, wound counter-clockwise seen from above (+y).
    i = np.arange(rows - 1)[:, None] * cols + np.arange(cols - 1)[None, :]
    a, b, c, d = i, i + 1, i + cols, i + cols + 1
    triangles = np.stack([a, c, b, b, c, d], axis=-1).reshape(-1).astype(np.uint16)
    print(f'{rows}x{cols} grid, {len(triangles) // 3} triangles, highest {metres.max():.0f} m')
    return points, triangles


def pad4(chunk, fill):
    return chunk + fill * ((4 - len(chunk) % 4) % 4)


def write_glb(points, triangles, dst):
    position_bytes = points.tobytes()
    index_bytes = pad4(triangles.tobytes(), b'\0')
    gltf = {
        'asset': {'version': '2.0', 'generator': '3d/dem-to-glb.py'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': [{'mesh': 0, 'name': 'Terrain'}],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0}, 'indices': 1}]}],
        'buffers': [{'byteLength': len(position_bytes) + len(index_bytes)}],
        'bufferViews': [
            {'buffer': 0, 'byteOffset': 0, 'byteLength': len(position_bytes), 'target': 34962},
            {
                'buffer': 0,
                'byteOffset': len(position_bytes),
                'byteLength': triangles.nbytes,
                'target': 34963,
            },
        ],
        'accessors': [
            {
                'bufferView': 0,
                'componentType': FLOAT,
                'count': len(points),
                'type': 'VEC3',
                'min': points.min(axis=0).tolist(),
                'max': points.max(axis=0).tolist(),
            },
            {'bufferView': 1, 'componentType': UINT16, 'count': len(triangles), 'type': 'SCALAR'},
        ],
    }
    json_chunk = pad4(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
    bin_chunk = position_bytes + index_bytes
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
    points, triangles = build_grid(json.load(open(sys.argv[1])))
    write_glb(points, triangles, sys.argv[2])
