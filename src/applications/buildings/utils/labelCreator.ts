import * as THREE from 'three';
import { formatPolygonCount } from './polygonCounter';

/**
 * Create a 3D text label sprite with polygon count
 */
export const createLabel = (text: string, position: THREE.Vector3, polygonCount?: number): THREE.Sprite => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 500;
  canvas.height = 140;

  if (context) {
    // Background with rounded corners
    context.fillStyle = 'rgba(0, 0, 0, 0.85)';
    context.roundRect(5, 5, canvas.width - 10, canvas.height - 10, 8);
    context.fill();

    // Border
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 2;
    context.stroke();

    // Main title - BIGGER FONT
    context.fillStyle = '#ffffff';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, 50);

    // Polygon count with better styling - BIGGER FONT
    if (polygonCount !== undefined) {
      context.fillStyle = '#00ff88'; // Bright green
      context.font = 'bold 22px Arial';
      context.fillText(`${formatPolygonCount(polygonCount)} triangles`, canvas.width / 2, 95);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1
  });
  const sprite = new THREE.Sprite(spriteMaterial);

  sprite.position.copy(position);
  sprite.scale.set(16, 4.5, 1); // Much larger labels

  return sprite;
};
