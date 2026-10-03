import * as THREE from 'three';

type MergeableMaterial = THREE.MeshLambertMaterial | THREE.MeshBasicMaterial;

const isMergeable = (mesh: THREE.Mesh): boolean => {
  const material = mesh.material;
  return (
    !Array.isArray(material) &&
    (material instanceof THREE.MeshLambertMaterial ||
      material instanceof THREE.MeshBasicMaterial) &&
    !(mesh instanceof THREE.InstancedMesh) &&
    !(mesh instanceof THREE.SkinnedMesh) &&
    !mesh.morphTargetInfluences
  );
};

/** Meshes whose materials share this key render identically, so they can share one draw call. */
const materialKey = (material: MergeableMaterial): string =>
  [
    material.type,
    material.color.getHexString(),
    material.opacity,
    material.transparent,
    material.side,
    material.vertexColors,
    material.map?.uuid ?? '',
    material instanceof THREE.MeshLambertMaterial
      ? `${material.emissive.getHexString()}:${material.flatShading}`
      : '',
  ].join('|');

const isVisibleInTree = (object: THREE.Object3D): boolean => {
  for (let o: THREE.Object3D | null = object; o; o = o.parent) {
    if (!o.visible) return false;
  }
  return true;
};

/** A copy of the mesh's geometry in world space, non-indexed, with only the attributes the material reads. */
const worldGeometry = (mesh: THREE.Mesh, keepUv: boolean): THREE.BufferGeometry => {
  const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', source.getAttribute('position'));
  if (source.getAttribute('normal')) geometry.setAttribute('normal', source.getAttribute('normal'));
  if (keepUv && source.getAttribute('uv')) geometry.setAttribute('uv', source.getAttribute('uv'));

  geometry.applyMatrix4(mesh.matrixWorld);
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();

  // A mirroring transform flips the triangle winding, which would turn the faces inside out.
  if (mesh.matrixWorld.determinant() < 0) {
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.getAttribute(name) as THREE.BufferAttribute;
      const size = attribute.itemSize;
      const array = attribute.array;
      for (let i = 0; i < attribute.count; i += 3) {
        for (let k = 0; k < size; k++) {
          const a = (i + 1) * size + k;
          const b = (i + 2) * size + k;
          [array[a], array[b]] = [array[b], array[a]];
        }
      }
    }
  }
  return geometry;
};

/** Concatenates non-indexed geometries; null when their attributes differ. */
const concatGeometries = (geometries: THREE.BufferGeometry[]): THREE.BufferGeometry | null => {
  const names = Object.keys(geometries[0].attributes).sort();
  if (geometries.some(g => Object.keys(g.attributes).sort().join() !== names.join())) return null;

  const merged = new THREE.BufferGeometry();
  for (const name of names) {
    const parts = geometries.map(g => g.getAttribute(name) as THREE.BufferAttribute);
    const array = new Float32Array(parts.reduce((sum, p) => sum + p.array.length, 0));
    let offset = 0;
    for (const part of parts) {
      array.set(part.array, offset);
      offset += part.array.length;
    }
    merged.setAttribute(name, new THREE.BufferAttribute(array, parts[0].itemSize));
  }
  return merged;
};

/**
 * Bakes static objects into one mesh per distinct material, so thousands of small
 * meshes (houses, pools, cacti) cost a few dozen draw calls instead of one each.
 *
 * Only plain Lambert/Basic meshes are merged; anything else stays where it is. The
 * objects must already be positioned and must not move or change afterwards, since
 * the originals are removed. Roots left with nothing to draw are removed from their parent.
 */
export function mergeStaticMeshes(roots: THREE.Object3D[], parent: THREE.Object3D): THREE.Mesh[] {
  const groups = new Map<string, { material: MergeableMaterial; meshes: THREE.Mesh[] }>();

  for (const root of roots) {
    root.updateWorldMatrix(true, true);
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh) || !isMergeable(object) || !isVisibleInTree(object))
        return;
      const material = object.material as MergeableMaterial;
      const key = materialKey(material);
      const group = groups.get(key) ?? { material, meshes: [] };
      group.meshes.push(object);
      groups.set(key, group);
    });
  }

  parent.updateWorldMatrix(true, false);
  const toParentSpace = parent.matrixWorld.clone().invert();

  const merged: THREE.Mesh[] = [];
  for (const { material, meshes } of groups.values()) {
    const geometry = concatGeometries(meshes.map(mesh => worldGeometry(mesh, !!material.map)));
    if (!geometry) continue;
    geometry.applyMatrix4(toParentSpace);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Merged ${material.type} #${material.color.getHexString()}`;
    mesh.castShadow = meshes.some(m => m.castShadow);
    mesh.receiveShadow = meshes.some(m => m.receiveShadow);
    parent.add(mesh);
    merged.push(mesh);

    meshes.forEach(m => m.removeFromParent());
  }

  for (const root of roots) {
    let drawsSomething = false;
    root.traverse(o => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points) {
        drawsSomething = true;
      }
    });
    if (!drawsSomething) root.removeFromParent();
  }

  return merged;
}
