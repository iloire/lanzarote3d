#!/usr/bin/env python3
"""
Shrink the island GLB that Blender exports to what the scenes actually use.

Blender writes the flat-shaded island with every point repeated for each normal and UV
around it (230k vertices for 58k points), plus normals and UVs. The scenes read neither:
the ground is flat-shaded on the GPU and has no texture. This keeps only the positions,
welds the repeated points and stores the triangles with 16-bit indices when they fit.
Triangle and corner order are kept, so the per-face jitter in faceShading.ts is unchanged.

Usage: python3 3d/slim-glb.py <exported.glb> assets/foundation/models/environment/lanzarote.glb
"""
import array
import json
import struct
import sys

FLOAT, UINT16, UINT32 = 5126, 5123, 5125


def read_glb(path):
    data = open(path, 'rb').read()
    json_len = struct.unpack('<I', data[12:16])[0]
    gltf = json.loads(data[20 : 20 + json_len])
    return gltf, data[20 + json_len + 8 :]


def accessor_bytes(gltf, binary, index):
    view = gltf['bufferViews'][gltf['accessors'][index]['bufferView']]
    start = view.get('byteOffset', 0)
    return binary[start : start + view['byteLength']]


def pad4(chunk, fill):
    return chunk + fill * ((4 - len(chunk) % 4) % 4)


def main(src, dst):
    gltf, binary = read_glb(src)
    primitive = gltf['meshes'][0]['primitives'][0]
    positions = array.array('f', accessor_bytes(gltf, binary, primitive['attributes']['POSITION']))
    index_accessor = gltf['accessors'][primitive['indices']]
    index_type = 'I' if index_accessor['componentType'] == UINT32 else 'H'
    indices = array.array(index_type, accessor_bytes(gltf, binary, primitive['indices']))

    welded, remap, points = {}, [], array.array('f')
    for i in range(len(positions) // 3):
        point = tuple(positions[3 * i : 3 * i + 3])
        if point not in welded:
            welded[point] = len(welded)
            points.extend(point)
        remap.append(welded[point])
    count = len(welded)
    small = count <= 0xFFFF
    triangles = array.array('H' if small else 'I', (remap[i] for i in indices))

    position_bytes = points.tobytes()
    index_bytes = pad4(triangles.tobytes(), b'\0')
    gltf['buffers'] = [{'byteLength': len(position_bytes) + len(index_bytes)}]
    gltf['bufferViews'] = [
        {'buffer': 0, 'byteOffset': 0, 'byteLength': len(position_bytes), 'target': 34962},
        {'buffer': 0, 'byteOffset': len(position_bytes), 'byteLength': len(triangles.tobytes()), 'target': 34963},
    ]
    gltf['accessors'] = [
        {
            'bufferView': 0,
            'componentType': FLOAT,
            'count': count,
            'type': 'VEC3',
            'min': [min(points[k::3]) for k in range(3)],
            'max': [max(points[k::3]) for k in range(3)],
        },
        {'bufferView': 1, 'componentType': UINT16 if small else UINT32, 'count': len(triangles), 'type': 'SCALAR'},
    ]
    primitive['attributes'] = {'POSITION': 0}
    primitive['indices'] = 1
    primitive.pop('material', None)
    gltf.pop('materials', None)

    json_chunk = pad4(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
    bin_chunk = position_bytes + index_bytes
    total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    with open(dst, 'wb') as out:
        out.write(struct.pack('<4sII', b'glTF', 2, total))
        out.write(struct.pack('<I4s', len(json_chunk), b'JSON') + json_chunk)
        out.write(struct.pack('<I4s', len(bin_chunk), b'BIN\0') + bin_chunk)
    print(f'{len(positions) // 3} vertices -> {count}, {len(indices) // 3} triangles, {total} bytes')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
