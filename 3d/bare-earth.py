"""
The ground under a city on hills, with its buildings taken out of the elevation model.

Copernicus GLO-30 is a surface model: where towers stand it carries their rooftops, so Kowloon
would come out as a field of 200 m spikes. Where OpenStreetMap has buildings, this opens the
model where its tall buildings are (the lowest height within `radius` metres, then the highest of those within the same
radius), which takes away anything narrower than the radius and keeps the hills, and blends that
in over the built-up area. Away from the buildings the model is left as it is.

Imported by 3d/dem-to-glb.py (for the terrain) and 3d/city-on-hills.py (for where each building
stands), so the two agree. Turned on by `bareEarth` in the location JSON:
`{ "radius": metres, "reach": metres }`, how wide the widest building is and how far round the
buildings the ground is opened.
"""
import importlib.util
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

METRES_PER_DEGREE_LAT = 110574
METRES_PER_DEGREE_LON_AT_EQUATOR = 111320
# The opened ground is worked out on a grid this fine, metres
STEP = 15
# Buildings at least this tall, metres, are taken out
TALL = 20


def _module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).parent / file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _filter(z, cells, pick):
    """The min or max of the square `cells` round each point, edges padded"""
    padded = np.pad(z, cells, mode='edge')
    windows = np.lib.stride_tricks.sliding_window_view(padded, (2 * cells + 1, 2 * cells + 1))
    return pick(pick(windows, axis=-1), axis=-1)


def _blur(mask, cells):
    k = 2 * cells + 1
    summed = np.pad(np.pad(mask.astype(np.float32), cells, mode='edge').cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    return (summed[k:, k:] - summed[:-k, k:] - summed[k:, :-k] + summed[:-k, :-k]) / (k * k)


def ground_sampler(location):
    """Bilinear bare-ground height (m) at any lat/lon in the bbox"""
    dem = _module('dem_to_glb', 'dem-to-glb.py')
    city = _module('city_to_glb', 'city-to-glb.py')
    bbox, settings = location['bbox'], location['bareEarth']
    lat0 = (bbox['north'] + bbox['south']) / 2
    mlon = math.cos(math.radians(lat0)) * METRES_PER_DEGREE_LON_AT_EQUATOR
    width = (bbox['east'] - bbox['west']) * mlon
    depth = (bbox['north'] - bbox['south']) * METRES_PER_DEGREE_LAT
    cols, rows = int(width // STEP) + 2, int(depth // STEP) + 2
    lons = bbox['west'] + np.arange(cols) * STEP / mlon
    lats = bbox['north'] - np.arange(rows) * STEP / METRES_PER_DEGREE_LAT
    lon, lat = np.meshgrid(lons, lats)
    surface = dem.sampler(bbox)(lat, lon)

    # Where the buildings are, a pixel a grid point
    mask = Image.new('1', (cols, rows), 0)
    draw = ImageDraw.Draw(mask)
    for element in city.fetch(location, 'buildings'):
        # Only the tall ones: a house's few metres don't matter, and the summits have houses
        if city.height_of(element.get('tags', {}), 0) < TALL:
            continue
        outer, _ = city.rings(element)
        for ring in outer:
            points = [((p_lon - bbox['west']) * mlon / STEP, (bbox['north'] - p_lat) * METRES_PER_DEGREE_LAT / STEP) for p_lat, p_lon in ring]
            if len(points) >= 3:
                draw.polygon(points, fill=1)
    built = np.array(mask, bool)

    cells = max(1, round(settings['radius'] / STEP))
    opened = _filter(_filter(surface, cells, np.min), cells, np.max)
    # Smooth the terraces the opening leaves, then never above the surface itself
    opened = np.minimum(_blur(opened, 2), surface)
    weight = np.clip(_blur(built, max(1, round(settings['reach'] / STEP))) * 4, 0, 1)
    ground = surface * (1 - weight) + opened * weight
    # The sea stays the sea
    ground = np.where(surface <= 0, surface, np.maximum(ground, 0.5))

    def height(lat_, lon_):
        col = np.clip((np.asarray(lon_) - bbox['west']) * mlon / STEP, 0, cols - 1.001)
        row = np.clip((bbox['north'] - np.asarray(lat_)) * METRES_PER_DEGREE_LAT / STEP, 0, rows - 1.001)
        c0, r0 = col.astype(int), row.astype(int)
        fc, fr = col - c0, row - r0
        top = ground[r0, c0] * (1 - fc) + ground[r0, c0 + 1] * fc
        bottom = ground[r0 + 1, c0] * (1 - fc) + ground[r0 + 1, c0 + 1] * fc
        return top * (1 - fr) + bottom * fr

    return height
