/**
 * Shrink a GLB written by 3d/city-to-glb.py or 3d/city-on-hills.py for the web: positions
 * quantised to 16 bits (KHR_mesh_quantization, the node's scale and translation put them back)
 * and every vertex and index buffer packed with EXT_meshopt_compression. Images and extras are
 * kept as they are. three.js decodes it when GLTFLoader has the meshopt decoder (Models.loadGltf).
 *
 * Hong Kong's city came to 27 MB as written, 6 MB like this.
 *
 * Usage: node 3d/meshopt-glb.mjs in.glb out.glb
 */
import fs from 'fs';
import { MeshoptEncoder } from 'meshoptimizer';

const FLOAT = 5126;
const UNSIGNED_SHORT = 5123;
const SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const ARRAY = 34962;
const ELEMENT_ARRAY = 34963;

const [src, dst] = process.argv.slice(2);
if (!src || !dst) {
  console.error('Usage: node 3d/meshopt-glb.mjs in.glb out.glb');
  process.exit(1);
}
await MeshoptEncoder.ready;

const glb = fs.readFileSync(src);
const jsonLength = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
const binStart = 20 + jsonLength + 8;
const bin = glb.subarray(binStart, binStart + glb.readUInt32LE(20 + jsonLength));
const viewBytes = view =>
  bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);

// Each view's new contents, keyed by view index: { data, stride, count, mode }
const packed = new Map();

// Positions to unsigned 16-bit, normalised, and the node's scale and translation to undo it
gltf.nodes.forEach(node => {
  if (node.mesh === undefined) return;
  gltf.meshes[node.mesh].primitives.forEach(primitive => {
    const accessor = gltf.accessors[primitive.attributes.POSITION];
    if (accessor.componentType !== FLOAT) return;
    const source = new Float32Array(
      Uint8Array.from(viewBytes(gltf.bufferViews[accessor.bufferView])).buffer
    );
    const { min, max } = accessor;
    const range = max.map((top, k) => top - min[k] || 1);
    const data = new Uint16Array(accessor.count * 4);
    for (let i = 0; i < accessor.count; i++) {
      for (let k = 0; k < 3; k++) {
        data[i * 4 + k] = Math.round(((source[i * 3 + k] - min[k]) / range[k]) * 65535);
      }
    }
    accessor.componentType = UNSIGNED_SHORT;
    accessor.normalized = true;
    accessor.min = [0, 0, 0];
    // In the stored values, which three.js scales by 1/65535 itself
    accessor.max = [65535, 65535, 65535];
    node.scale = range;
    node.translation = min;
    packed.set(accessor.bufferView, {
      data: new Uint8Array(data.buffer),
      stride: 8,
      count: accessor.count,
    });
  });
});

// Every other vertex attribute padded to a stride of 4, the indices as they are
gltf.accessors.forEach(accessor => {
  const index = accessor.bufferView;
  if (packed.has(index)) return;
  const view = gltf.bufferViews[index];
  if (view.target !== ARRAY && view.target !== ELEMENT_ARRAY) return;
  const size = SIZE[accessor.componentType] * COMPONENTS[accessor.type];
  const bytes = viewBytes(view);
  if (view.target === ELEMENT_ARRAY) {
    packed.set(index, {
      data: Uint8Array.from(bytes.subarray(0, accessor.count * size)),
      stride: size,
      count: accessor.count,
      mode: 'TRIANGLES',
    });
    return;
  }
  const stride = Math.ceil(size / 4) * 4;
  const data = new Uint8Array(accessor.count * stride);
  for (let i = 0; i < accessor.count; i++) {
    data.set(bytes.subarray(i * size, i * size + size), i * stride);
  }
  packed.set(index, { data, stride, count: accessor.count });
});

// Buffer 0 (the GLB's own) holds the compressed views and everything else; buffer 1 is the
// uncompressed layout, which only exists once decoded
const chunks = [];
let offset = 0;
let fallback = 0;
const add = bytes => {
  const at = offset;
  chunks.push(bytes);
  offset += bytes.length;
  const pad = (4 - (offset % 4)) % 4;
  if (pad) {
    chunks.push(new Uint8Array(pad));
    offset += pad;
  }
  return at;
};
gltf.bufferViews = gltf.bufferViews.map((view, index) => {
  const entry = packed.get(index);
  if (!entry) {
    const byteOffset = add(viewBytes(view));
    return { ...view, buffer: 0, byteOffset };
  }
  const mode = entry.mode ?? 'ATTRIBUTES';
  const compressed = MeshoptEncoder.encodeGltfBuffer(entry.data, entry.count, entry.stride, mode);
  const byteOffset = add(compressed);
  const out = {
    buffer: 1,
    byteOffset: fallback,
    byteLength: entry.data.length,
    target: view.target,
    extensions: {
      EXT_meshopt_compression: {
        buffer: 0,
        byteOffset,
        byteLength: compressed.length,
        byteStride: entry.stride,
        count: entry.count,
        mode,
      },
    },
  };
  if (mode === 'ATTRIBUTES') out.byteStride = entry.stride;
  fallback += Math.ceil(entry.data.length / 4) * 4;
  return out;
});
gltf.buffers = [
  { byteLength: offset },
  { byteLength: fallback, extensions: { EXT_meshopt_compression: { fallback: true } } },
];
const extensions = ['EXT_meshopt_compression', 'KHR_mesh_quantization'];
gltf.extensionsUsed = extensions;
gltf.extensionsRequired = extensions;

const pad4 = (buffer, fill) =>
  Buffer.concat([buffer, Buffer.alloc((4 - (buffer.length % 4)) % 4, fill)]);
const json = pad4(Buffer.from(JSON.stringify(gltf)), 0x20);
const body = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
const header = Buffer.alloc(12);
header.write('glTF', 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + body.length, 8);
const chunkHeader = (length, type) => {
  const out = Buffer.alloc(8);
  out.writeUInt32LE(length, 0);
  out.write(type, 4);
  return out;
};
fs.writeFileSync(
  dst,
  Buffer.concat([
    header,
    chunkHeader(json.length, 'JSON'),
    json,
    chunkHeader(body.length, 'BIN\0'),
    body,
  ])
);
console.log(`wrote ${dst}, ${12 + 16 + json.length + body.length} bytes (from ${glb.length})`);
