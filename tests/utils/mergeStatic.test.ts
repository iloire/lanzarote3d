import * as THREE from 'three';
import { mergeStaticMeshes } from '../../src/foundation/utils/mergeStatic';

const box = (material: THREE.Material, x: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.position.x = x;
  mesh.castShadow = true;
  return mesh;
};

describe('mergeStaticMeshes', () => {
  it('bakes meshes into one mesh per distinct material, in world space', () => {
    const scene = new THREE.Scene();
    const red = new THREE.MeshLambertMaterial({ color: 'red' });
    const sameRed = new THREE.MeshLambertMaterial({ color: 'red' });
    const blue = new THREE.MeshLambertMaterial({ color: 'blue' });

    const house = new THREE.Group();
    house.position.x = 100;
    house.add(box(red, 0), box(sameRed, 10), box(blue, 20));
    scene.add(house);

    const merged = mergeStaticMeshes([house], scene);

    expect(merged).toHaveLength(2);
    expect(house.parent).toBeNull();
    expect(scene.children).toEqual(merged);

    const redMesh = merged.find(m => (m.material as THREE.MeshLambertMaterial).color.getHex() === 0xff0000)!;
    expect(redMesh.geometry.getAttribute('position').count).toBe(36 * 2);
    expect(redMesh.castShadow).toBe(true);

    redMesh.geometry.computeBoundingBox();
    expect(redMesh.geometry.boundingBox!.min.x).toBeCloseTo(99.5);
    expect(redMesh.geometry.boundingBox!.max.x).toBeCloseTo(110.5);
  });

  it('leaves meshes it cannot merge in place', () => {
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    const shader = box(new THREE.ShaderMaterial(), 0);
    group.add(shader, box(new THREE.MeshBasicMaterial(), 5));
    scene.add(group);

    const merged = mergeStaticMeshes([group], scene);

    expect(merged).toHaveLength(1);
    expect(shader.parent).toBe(group);
    expect(group.parent).toBe(scene);
  });
});
