import * as THREE from 'three';

/** The flag's height (hoist) and length (fly), in the paraglider's units, and the pole it hangs on */
const HOIST = 760;
const FLY = 1140;
const POLE_LENGTH = 1040;
const SEGMENTS_X = 16;
const SEGMENTS_Y = 8;
/** The ripple running from the pole to the free edge: wavelengths along the fly, speed, height */
const WAVES = 1.6;
const WAVE_SPEED = 9;
const WAVE_AMPLITUDE = 90;

/** A black flag with a white skull and crossbones, drawn once onto a canvas */
function jollyRogerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = ctx.strokeStyle = '#f2f0e8';

  const cx = canvas.width / 2;
  // Crossbones behind the skull, with a knuckle at each end
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  for (const [x0, y0, x1, y1] of [
    [cx - 95, 70, cx + 95, 215],
    [cx + 95, 70, cx - 95, 215],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    for (const [x, y] of [
      [x0, y0],
      [x1, y1],
    ]) {
      ctx.beginPath();
      ctx.arc(x - 9, y, 13, 0, Math.PI * 2);
      ctx.arc(x + 9, y, 13, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Skull and jaw
  ctx.beginPath();
  ctx.arc(cx, 110, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 34, 140, 68, 50);
  // Eyes, nose and teeth
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx - 25, 108, 17, 0, Math.PI * 2);
  ctx.arc(cx + 25, 108, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, 128);
  ctx.lineTo(cx - 9, 146);
  ctx.lineTo(cx + 9, 146);
  ctx.fill();
  for (const x of [-17, 0, 17]) ctx.fillRect(cx + x - 2, 168, 4, 22);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * A pirate flag flown open on a short pole hung from the origin: the flag is made fast to the
 * bottom of the pole and streams back along +Z, rippling in the airflow. The ripple runs on its
 * own clock whenever the flag is drawn, so it needs no update call.
 */
export function createPirateFlag(): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'pirate-flag';

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(12, 12, POLE_LENGTH, 6),
    new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 0.9 })
  );
  pole.position.y = -POLE_LENGTH / 2;
  group.add(pole);

  // The cloth in the YZ plane: the hoist up the bottom of the pole, the fly back along +Z
  const geometry = new THREE.PlaneGeometry(FLY, HOIST, SEGMENTS_X, SEGMENTS_Y);
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(0, HOIST / 2 - POLE_LENGTH, FLY / 2);
  const rest = Float32Array.from(geometry.attributes.position.array);
  const cloth = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: jollyRogerTexture(),
      side: THREE.DoubleSide,
      roughness: 0.95,
    })
  );
  cloth.castShadow = true;
  group.add(cloth);

  const position = geometry.attributes.position as THREE.BufferAttribute;
  let lastTime = -1;
  cloth.onBeforeRender = () => {
    // Drawn more than once a frame (shadows), so wave once per frame
    const time = performance.now() / 1000;
    if (time === lastTime) return;
    lastTime = time;
    for (let i = 0; i < position.count; i++) {
      const y = rest[i * 3 + 1];
      const z = rest[i * 3 + 2];
      // Held still at the pole, flapping more towards the free edge
      const along = z / FLY;
      const phase = along * WAVES * Math.PI * 2 - time * WAVE_SPEED + y * 0.002;
      position.setX(i, Math.sin(phase) * WAVE_AMPLITUDE * along);
      // The free edge droops a little and shortens as the cloth folds into the wave
      position.setY(i, y - along * along * 80);
      position.setZ(i, z * (1 - 0.06 * Math.abs(Math.sin(phase)) * along));
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  return group;
}
