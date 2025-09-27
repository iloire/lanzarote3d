#!/usr/bin/env python3
"""
Download satellite tiles for Lanzarote based on verified GPS coordinates
Downloads a 4x7 grid (28 tiles) covering the exact island bounds
"""

import os
import sys
import requests
from PIL import Image
import time

def download_tile(x, y, zoom, output_dir):
    """Download a single tile from Esri World Imagery"""
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        filename = f"tile_{x}_{y}.jpg"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(response.content)

        print(f"✅ Downloaded {filename}")
        return True

    except Exception as e:
        print(f"❌ Failed to download tile {x},{y}: {e}")
        return False

def create_atlas(tile_dir, output_path, grid_width, grid_height):
    """Create a texture atlas from individual tiles"""
    tile_size = 256  # Standard tile size
    atlas_width = grid_width * tile_size
    atlas_height = grid_height * tile_size

    # Create the atlas image
    atlas = Image.new('RGB', (atlas_width, atlas_height))

    # Load and paste each tile
    for row in range(grid_height):
        for col in range(grid_width):
            x_tile = 1891 + col  # Starting X tile
            y_tile = 1699 + row  # Starting Y tile

            tile_path = os.path.join(tile_dir, f"tile_{x_tile}_{y_tile}.jpg")

            if os.path.exists(tile_path):
                tile = Image.open(tile_path)
                atlas_x = col * tile_size
                atlas_y = row * tile_size
                atlas.paste(tile, (atlas_x, atlas_y))
                print(f"✅ Added tile {x_tile},{y_tile} to atlas at ({atlas_x},{atlas_y})")
            else:
                print(f"⚠️ Missing tile: {tile_path}")

    # Save the atlas
    atlas.save(output_path, 'JPEG', quality=95)
    print(f"🎨 Atlas saved: {output_path}")

def main():
    print("🛰️ Downloading Lanzarote satellite tiles based on verified GPS coordinates")
    print("📍 Coverage: 29.25°N to 28.84°S, -13.47°E to -13.79°W")
    print("🔢 Tiles: X(1891-1894) Y(1699-1705) = 4×7 = 28 tiles")
    print()

    # Create output directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    tile_dir = os.path.join(project_dir, 'temp_tiles')
    textures_dir = os.path.join(project_dir, 'public', 'assets', 'textures')

    os.makedirs(tile_dir, exist_ok=True)

    # Download tiles
    zoom = 12
    grid_width = 4  # X: 1891-1894
    grid_height = 7  # Y: 1699-1705
    total_tiles = grid_width * grid_height
    downloaded = 0

    print("⬇️ Downloading tiles...")
    for row in range(grid_height):
        for col in range(grid_width):
            x_tile = 1891 + col
            y_tile = 1699 + row

            if download_tile(x_tile, y_tile, zoom, tile_dir):
                downloaded += 1

            # Be nice to the server
            time.sleep(0.1)

    print(f"\n📊 Downloaded {downloaded}/{total_tiles} tiles")

    if downloaded == total_tiles:
        print("\n🎨 Creating texture atlas...")
        atlas_path = os.path.join(textures_dir, 'lanzarote-satellite-atlas-verified.jpg')
        create_atlas(tile_dir, atlas_path, grid_width, grid_height)

        print(f"\n✅ Success! Atlas created: {atlas_path}")
        print("🧹 Cleaning up temporary tiles...")

        # Clean up individual tiles
        import shutil
        shutil.rmtree(tile_dir)

        print("🎉 Complete! New verified satellite texture is ready.")
    else:
        print(f"\n❌ Failed to download all tiles. Only got {downloaded}/{total_tiles}")
        sys.exit(1)

if __name__ == "__main__":
    main()