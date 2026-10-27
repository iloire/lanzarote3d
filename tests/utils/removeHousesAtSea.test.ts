import * as THREE from 'three';
import { removeHousesAtSea } from '../../src/shared/env/house-group-utils';

// Land west of x = 0, sea (the model's seabed) east of it
const groundHeight = (x: number) => (x < 0 ? 20 : -8);

const house = (scene: THREE.Scene, x: number) => {
  const mesh = new THREE.Object3D();
  mesh.position.set(x, 0, 5);
  scene.add(mesh);
  return mesh;
};

const yard = (scene: THREE.Scene, home: THREE.Object3D, dx: number) => {
  const obj = new THREE.Object3D();
  obj.position.set(home.position.x + dx, 0, 5);
  obj.userData.parentHousePosition = home.position.clone();
  scene.add(obj);
  return obj;
};

describe('removeHousesAtSea', () => {
  it('keeps the houses on land and removes the ones in the sea', () => {
    const scene = new THREE.Scene();
    const onLand = house(scene, -50);
    const atSea = house(scene, 50);

    const kept = removeHousesAtSea(scene, [onLand, atSea], groundHeight, 2);

    expect(kept).toEqual([onLand]);
    expect(scene.children).toContain(onLand);
    expect(scene.children).not.toContain(atSea);
  });

  it('takes a removed house’s plot, pool and garden with it, even where they reach land', () => {
    const scene = new THREE.Scene();
    const onLand = house(scene, -50);
    const atSea = house(scene, 10);
    const landYard = yard(scene, onLand, 5);
    const seaYardOnLand = yard(scene, atSea, -30);

    removeHousesAtSea(scene, [onLand, atSea], groundHeight, 2);

    expect(scene.children).toContain(landYard);
    expect(scene.children).not.toContain(seaYardOnLand);
  });

  it('treats ground it cannot find as sea', () => {
    const scene = new THREE.Scene();
    const lost = house(scene, -50);
    expect(removeHousesAtSea(scene, [lost], () => NaN, 2)).toEqual([]);
  });
});
