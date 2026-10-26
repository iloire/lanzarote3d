import * as THREE from 'three';

/**
 * Distance from the sea to the nearest coast, baked once from the island mesh.
 *
 * The island is drawn from straight above into a small render target (white where the
 * ground is above sea level), read back, and run through a two-pass chamfer distance
 * transform on the CPU. The result is a texture the ocean shader samples by world x/z
 * to tint shallow water, draw surf lines and fade the waves near the shore.
 */
export interface CoastField {
  texture: THREE.DataTexture;
  // World-space min x, min z, size x, size z of the area the texture covers.
  bounds: THREE.Vector4;
  // Distance encoded by a texel value of 1.0, in world units.
  maxDistance: number;
}

const RESOLUTION = 2048;
const MARGIN = 4000;
const MAX_DISTANCE = 2500;

export function bakeCoastField(
  renderer: THREE.WebGLRenderer,
  terrain: THREE.Object3D,
  seaLevel = 0
): CoastField {
  terrain.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(terrain);
  const minX = box.min.x - MARGIN;
  const minZ = box.min.z - MARGIN;
  const sizeX = box.max.x - box.min.x + MARGIN * 2;
  const sizeZ = box.max.z - box.min.z + MARGIN * 2;
  const width = RESOLUTION;
  const height = Math.max(64, Math.round((RESOLUTION * sizeZ) / sizeX));

  // Top-down orthographic view: image x = world x, image y (row 0 at the bottom) = world z.
  const camera = new THREE.OrthographicCamera(0, sizeX, 0, -sizeZ, 1, box.max.y + 10000);
  camera.position.set(minX, box.max.y + 5000, minZ);
  camera.up.set(0, 0, -1);
  camera.lookAt(minX, 0, minZ);
  camera.updateMatrixWorld();

  const landMaterial = new THREE.ShaderMaterial({
    uniforms: { uSeaLevel: { value: seaLevel } },
    vertexShader: /* glsl */ `
      varying float vY;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vY = world.y;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uSeaLevel;
      varying float vY;
      void main() {
        if (vY < uSeaLevel + 1.0) discard;
        gl_FragColor = vec4(1.0);
      }
    `,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });

  const target = new THREE.WebGLRenderTarget(width, height);
  const bakeScene = new THREE.Scene();
  bakeScene.background = new THREE.Color(0x000000);
  const proxy = new THREE.Group();
  terrain.traverse(child => {
    if (child instanceof THREE.Mesh) {
      const mesh = new THREE.Mesh(child.geometry, landMaterial);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(child.matrixWorld);
      mesh.frustumCulled = false;
      proxy.add(mesh);
    }
  });
  bakeScene.add(proxy);

  const previousTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(bakeScene, camera);
  const pixels = new Uint8Array(width * height * 4);
  renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
  renderer.setRenderTarget(previousTarget);
  target.dispose();
  landMaterial.dispose();

  const texelSize = sizeX / width;
  const distance = chamferDistance(pixels, width, height);
  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.min(255, Math.round(((distance[i]! * texelSize) / MAX_DISTANCE) * 255));
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RedFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return {
    texture,
    bounds: new THREE.Vector4(minX, minZ, sizeX, sizeZ),
    maxDistance: MAX_DISTANCE,
  };
}

/**
 * Distance in texels from each sea texel to the nearest land texel (3-4 chamfer, /3).
 * Land texels get 0.
 */
export function chamferDistance(rgba: Uint8Array, width: number, height: number): Float32Array {
  const far = 1e9;
  const d = new Float32Array(width * height);
  for (let i = 0; i < d.length; i++) d[i] = rgba[i * 4]! > 127 ? 0 : far;

  const at = (x: number, y: number) => d[y * width + x]!;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let v = d[i]!;
      if (v === 0) continue;
      if (x > 0) v = Math.min(v, at(x - 1, y) + 3);
      if (y > 0) {
        v = Math.min(v, at(x, y - 1) + 3);
        if (x > 0) v = Math.min(v, at(x - 1, y - 1) + 4);
        if (x < width - 1) v = Math.min(v, at(x + 1, y - 1) + 4);
      }
      d[i] = v;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      let v = d[i]!;
      if (v === 0) continue;
      if (x < width - 1) v = Math.min(v, at(x + 1, y) + 3);
      if (y < height - 1) {
        v = Math.min(v, at(x, y + 1) + 3);
        if (x < width - 1) v = Math.min(v, at(x + 1, y + 1) + 4);
        if (x > 0) v = Math.min(v, at(x - 1, y + 1) + 4);
      }
      d[i] = v;
    }
  }
  for (let i = 0; i < d.length; i++) d[i] = d[i]! / 3;
  return d;
}
