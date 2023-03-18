import * as THREE from "three";
import Clouds from "../../elements/clouds";
import Weather from "../../elements/weather";
import Thermal, { ThermalDimensions } from "../../elements/thermal";
import { rndIntBetween } from "../../utils/math";
import Tree from "../../components/tree";
import Stone from "../../components/stone";

const generateRandomLcl = (lclLevel: number): number => {
  return lclLevel + rndIntBetween(-200, 3000);
};

const generateRandomThermalDimensions = (
  lclLevel: number
): ThermalDimensions => {
  return {
    bottomRadius: rndIntBetween(220, 350),
    topRadius: rndIntBetween(400, 600),
    height: generateRandomLcl(lclLevel),
  };
};

const generateThermalPair = (
  position: THREE.Vector3,
  weather: Weather,
  dimensions?: ThermalDimensions
): Thermal[] => {
  const thermal = new Thermal(
    dimensions || generateRandomThermalDimensions(weather.getLclLevel()),
    position,
    0.05,
    weather,
    true
  );

  const interiorThermalDimensions = {
    bottomRadius: rndIntBetween(190, 250) / 2,
    topRadius: rndIntBetween(400, 600) / 2,
    height: generateRandomLcl(weather.getLclLevel()),
  };

  const thermalInside = new Thermal(
    interiorThermalDimensions,
    position,
    0.09,
    weather,
    false
  );
  return [thermal, thermalInside];
};

const getTerrainHeight = (pos: THREE.Vector3, terrain: THREE.Mesh) => {
  const rayVertical = new THREE.Raycaster(
    new THREE.Vector3(pos.x, 10000, pos.z), // big enough value for Y
    new THREE.Vector3(0, -1, 0) // vertical
  );
  const intersects = rayVertical.intersectObject(terrain);
  if (intersects.length === 1) {
    return intersects[0].point.y;
  } else {
    return NaN;
  }
};

const addTreesAroundArea = (
  pos: THREE.Vector3,
  numberTrees: number,
  terrain: THREE.Mesh,
  scene: THREE.Scene
) => {
  const tree = new Tree().load();
  const scale = 3;
  tree.scale.set(scale, scale, scale);
  addMeshAroundArea(tree, pos, numberTrees, terrain, scene);
};

const addMeshAroundArea = (
  obj: THREE.Object3D,
  pos: THREE.Vector3,
  number: number,
  terrain: THREE.Mesh,
  scene: THREE.Scene
) => {
  for (let index = 0; index < number; index++) {
    const newX = pos.x + 10 * index * rndIntBetween(0, 5);
    const newZ = pos.z + 10 * index * rndIntBetween(0, 10);

    const terrainHeight = getTerrainHeight(
      new THREE.Vector3(newX, 0, newZ),
      terrain
    );
    if (isNaN(terrainHeight)) {
      break;
    }
    const meshPos = new THREE.Vector3(newX, terrainHeight, newZ);

    const meshClone = obj.clone();
    meshClone.position.copy(meshPos);
    scene.add(meshClone);
  }
};

const Environment = {
  addStones: (scene: THREE.Scene, terrain: THREE.Mesh) => {
    const stone = new Stone().load();
    const scale = 4;
    stone.scale.set(scale, scale, scale);
    const pos = new THREE.Vector3(6879, 600, -545);
    addMeshAroundArea(stone, pos, 100, terrain, scene);
  },
  addTrees: (scene: THREE.Scene, terrain: THREE.Mesh) => {
    const pos = new THREE.Vector3(6879, 600, -545);
    const tree = new Tree().load();
    const scale = 5;
    tree.scale.set(scale, scale, scale);
    addMeshAroundArea(tree, pos, 100, terrain, scene);
  },
  addThermals: (scene: THREE.Scene, weather: Weather): Thermal[] => {
    const lclLevel = weather.getLclLevel();
    // famara
    const t1 = generateThermalPair(new THREE.Vector3(5727, 0, -535), weather);
    const t2 = generateThermalPair(new THREE.Vector3(7127, 0, -1405), weather);
    const t3 = generateThermalPair(new THREE.Vector3(3027, 0, 1005), weather);

    // tenesar
    const t4 = generateThermalPair(new THREE.Vector3(-4827, 0, -855), weather);
    // mirador
    const t5 = generateThermalPair(
      new THREE.Vector3(15027, 0, -12555),
      weather
    );

    // pq
    const t6 = generateThermalPair(new THREE.Vector3(-6227, 0, 14055), weather);
    // mala
    const t7 = generateThermalPair(new THREE.Vector3(14227, 0, -3755), weather);

    // close to pq
    const t8 = generateThermalPair(new THREE.Vector3(-3927, 0, 9830), weather);
    const t9 = generateThermalPair(new THREE.Vector3(592, 0, 5530), weather);

    const allThermals = t1
      .concat(t2)
      .concat(t3)
      .concat(t4)
      .concat(t5)
      .concat(t6)
      .concat(t7)
      .concat(t8)
      .concat(t9);
    allThermals.forEach((t) => {
      scene.add(t.getMesh());
    });
    return allThermals;
  },

  async addClouds(
    scene: THREE.Scene,
    weather: Weather,
    thermals: Thermal[]
  ): Promise<THREE.Object3D[]> {
    const lclLevel = weather.getLclLevel();
    const mainThermals = thermals.filter((t) => t.isMainThermal());
    const clouds = await Promise.all(
      mainThermals.map((t) => {
        return Clouds.load(
          1,
          new THREE.Vector3(
            t.getPosition().x,
            t.getDimensions().height * (1 + 0.05 * rndIntBetween(1, 5)),
            t.getPosition().z
          )
        );
      })
    );
    clouds.forEach((c) => {
      scene.add(c);
    });
    return clouds;
  },
};

export default Environment;
