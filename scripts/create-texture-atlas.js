const fs = require('fs');
const path = require('path');

// Simple script to create texture atlas by concatenating PNG files
async function createTextureAtlas() {
  const Canvas = require('canvas');
  const Image = Canvas.Image;

  const canvas = Canvas.createCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  // Load images
  const tiles = [
    { file: 'tile_828_1316.png', x: 0, y: 0 },     // top-left
    { file: 'tile_829_1316.png', x: 256, y: 0 },   // top-right
    { file: 'tile_828_1317.png', x: 0, y: 256 },   // bottom-left
    { file: 'tile_829_1317.png', x: 256, y: 256 }  // bottom-right
  ];

  const texturesDir = path.join(__dirname, '..', 'public', 'assets', 'textures');

  for (const tile of tiles) {
    const img = new Image();
    const imgPath = path.join(texturesDir, tile.file);
    const data = fs.readFileSync(imgPath);
    img.src = data;

    ctx.drawImage(img, tile.x, tile.y, 256, 256);
  }

  // Save as JPEG
  const outputPath = path.join(texturesDir, 'lanzarote-satellite-atlas.jpg');
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
  fs.writeFileSync(outputPath, buffer);

  console.log('Texture atlas created successfully');
}

createTextureAtlas().catch(console.error);