import * as THREE from "three";
import Clouds from "../../components/clouds";
import Weather from "../../elements/weather";
import Thermal, { ThermalDimensions } from "../../components/thermal";
import { rndBetween, rndIntBetween } from "../../utils/math";
import Tree from "../../components/tree";
import PineTree from "../../components/pinetree";
import Stone from "../../components/stone";
import House, { HouseType } from "../../components/house";
import Boat from "../../components/boat";
import Birds from "../../components/birds";
import Paraglider, { ParagliderConstructor } from "../../elements/pg";
import HangGlider from "../../components/hangglider";

const KMH_TO_MS = 3.6;

const generateRandomLcl = (lclLevel: number): number => {
  return lclLevel + rndIntBetween(-200, 3000);
};

const generateRandomThermalDimensions = (
  lclLevel: number,
  isSuperThermal: boolean
): ThermalDimensions => {
  const multiplier = isSuperThermal ? 1.4 : 1;
  const heightMultiplier = isSuperThermal ? 1.3 : 1;
  return {
    bottomRadius: rndIntBetween(420 * multiplier, 490 * multiplier),
    topRadius: rndIntBetween(500 * multiplier, 700 * multiplier),
    height: generateRandomLcl(lclLevel) * heightMultiplier,
  };
};

const generateThermalPair = (
  position: THREE.Vector3,
  weather: Weather,
  superThermal: boolean = false,
  dimensions?: ThermalDimensions
): Thermal[] => {
  const thermal = new Thermal(
    dimensions ||
      generateRandomThermalDimensions(weather.getLclLevel(), superThermal),
    position,
    0.05,
    weather,
    true,
    superThermal
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
    false,
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

const getRandomRotation = (): THREE.Euler => {
  return new THREE.Euler(0, rndBetween(0, Math.PI), 0);
};

type MeshAroundAreaParam = THREE.Object3D | (() => THREE.Object3D);

const addMeshAroundArea = (
  params: MeshAroundAreaParam[],
  pos: THREE.Vector3,
  number: number,
  terrain: THREE.Mesh,
  scene: THREE.Scene,
  minDistance?: number,
  y?: number
) => {
  for (let index = 0; index < number; index++) {
    const param = params[rndIntBetween(0, params.length)];
    let obj;
    if (typeof param === "function") {
      obj = param();
    } else {
      obj = param;
    }
    const newX = pos.x + (minDistance || 30 + index) * rndIntBetween(1, 5);
    const newZ = pos.z + (minDistance || 30 + index) * rndIntBetween(1, 10);

    const terrainHeight = getTerrainHeight(
      new THREE.Vector3(newX, 0, newZ),
      terrain
    );
    if (isNaN(terrainHeight)) {
      break;
    }
    const meshPos = new THREE.Vector3(newX, terrainHeight, newZ);
    const currentScale = obj.scale.x;
    const newScale = currentScale * (1 + 0.1 * rndIntBetween(-3, 3));

    const meshClone = obj.clone();
    meshClone.scale.set(newScale, newScale, newScale);
    meshClone.position.copy(meshPos);
    meshClone.rotation.copy(getRandomRotation());
    if (y) {
      meshClone.position.y += y;
    }
    scene.add(meshClone);
  }
};

const createPg = async (
  options: ParagliderConstructor,
  weather: Weather,
  terrain: THREE.Mesh,
  water: THREE.Mesh,
  pos: THREE.Vector3
): Promise<Paraglider> => {
  const pg = new Paraglider(options, weather, terrain, water, [], false);
  const pgMesh = await pg.loadModel(1);
  pg.setPosition(pos);
  pg.init();
  return pg;
};

class Environment {
  birds: Birds;
  hg: HangGlider;

  updateWrapSpeed(wrapSpeed: number) {
    this.birds.updateWrapSpeed(wrapSpeed);
    this.hg.updateWrapSpeed(wrapSpeed);
  }

  async addBirds(scene: THREE.Scene, path: THREE.Vector3[], gui?: any) {
    this.birds = new Birds();
    const birdsMesh = await this.birds.load(path, gui);
    scene.add(birdsMesh);
  }

  async addHangGlider(scene: THREE.Scene, path: THREE.Vector3[], gui?: any) {
    this.hg = new HangGlider();
    const hgMesh = await this.hg.load(path, gui);
    scene.add(hgMesh);
  }

  async addOtherGliders(
    scene: THREE.Scene,
    weather: Weather,
    terrain: THREE.Mesh,
    water: THREE.Mesh
  ) {
    const pgOptions: ParagliderConstructor = {
      glidingRatio: 9,
      trimSpeed: 35 / KMH_TO_MS,
      fullSpeedBarSpeed: 45 / KMH_TO_MS,
      bigEarsSpeed: 27 / KMH_TO_MS,
    };
    const pos = new THREE.Vector3(1379, 600, -545);
    const pg = await createPg(pgOptions, weather, terrain, water, pos);
    scene.add(pg.getMesh());

    const pos2 = new THREE.Vector3(3379, 900, -1545);
    const pg2 = await createPg(pgOptions, weather, terrain, water, pos2);
    scene.add(pg2.getMesh());

    // const pos3 = new THREE.Vector3(379, 1200, -145);
    // const pg3 = await createPg(pgOptions, weather, terrain, water, pos3);
    // scene.add(pg3.getMesh());
    //
    // const pos4 = new THREE.Vector3(8179, 1200, -3945);
    // const pg4 = await createPg(pgOptions, weather, terrain, water, pos4);
    // scene.add(pg4.getMesh());
  }

  addBoats(scene: THREE.Scene, terrain: THREE.Mesh) {
    const boat = new Boat().load();
    const scale = 3;
    boat.scale.set(scale, scale, scale);
    addMeshAroundArea(
      [boat],
      new THREE.Vector3(7879, 0, -4445),
      5,
      terrain,
      scene
    );
    addMeshAroundArea(
      [boat],
      new THREE.Vector3(8279, 0, -6155),
      4,
      terrain,
      scene
    );
  }

  addHouses(scene: THREE.Scene, terrain: THREE.Mesh) {
    const house = new House(HouseType.Medium).load();
    const house2 = new House(HouseType.Small).load();

    addMeshAroundArea(
      [house2, house],
      new THREE.Vector3(6879, 0, -545),
      20,
      terrain,
      scene,
      70,
      9
    );
    addMeshAroundArea(
      // famara
      [house, house2],
      new THREE.Vector3(6279, 0, -3155),
      40,
      terrain,
      scene,
      40,
      10
    );
    addMeshAroundArea(
      // noruegos
      [house, house2],
      new THREE.Vector3(7827, 0, -3460),
      10,
      terrain,
      scene,
      20,
      11
    );
    addMeshAroundArea(
      // tenesar
      [house, house2],
      new THREE.Vector3(-5200, 0, -480),
      10,
      terrain,
      scene,
      40,
      9
    );
    addMeshAroundArea(
      // teguise
      [house],
      new THREE.Vector3(5600, 0, 705),
      50,
      terrain,
      scene,
      70,
      7
    );
  }

  addStones(scene: THREE.Scene, terrain: THREE.Mesh) {
    const stone = new Stone().load();
    const scale = 1;
    stone.scale.set(scale, scale, scale);
    const pos = new THREE.Vector3(6879, 600, -545);
    addMeshAroundArea([stone], pos, 100, terrain, scene, 200, 2);
  }

  addTrees(scene: THREE.Scene, terrain: THREE.Mesh) {
    const tree = new Tree().load();
    const scale = 1;
    tree.scale.set(scale, scale, scale);
    addMeshAroundArea(
      [tree],
      new THREE.Vector3(6879, 0, -545),
      100,
      terrain,
      scene,
      100,
      5
    );
    addMeshAroundArea(
      [tree],
      new THREE.Vector3(8879, 0, -2245),
      100,
      terrain,
      scene,
      100,
      5
    );
    addMeshAroundArea(
      [tree],
      new THREE.Vector3(5600, 0, 705),
      100,
      terrain,
      scene,
      40,
      5
    );
    addMeshAroundArea(
      [
        () => {
          const pineTree = new PineTree().load();
          const scalePineTree = 10;
          pineTree.scale.set(scalePineTree, scalePineTree, scalePineTree);
          return pineTree;
        },
      ],
      new THREE.Vector3(8379, 0, -2145),
      100,
      terrain,
      scene,
      400,
      5
    );
  }

  addThermals(scene: THREE.Scene, weather: Weather): Thermal[] {
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
      weather,
      true
    );

    // pq
    const t6 = generateThermalPair(new THREE.Vector3(-6227, 0, 14055), weather);
    // mala
    const t7 = generateThermalPair(new THREE.Vector3(14227, 0, -3755), weather);

    // close to pq
    const t8 = generateThermalPair(new THREE.Vector3(-3927, 0, 9830), weather);
    const t9 = generateThermalPair(new THREE.Vector3(592, 0, 5530), weather);

    const superT1 = generateThermalPair(
      new THREE.Vector3(15027, 0, -12555),
      weather,
      true
    );

    const allThermals = t1
      .concat(t2)
      .concat(t3)
      .concat(t4)
      .concat(t5)
      .concat(t6)
      .concat(t7)
      .concat(t8)
      .concat(t9)
      .concat(superT1);

    allThermals.forEach((t) => {
      scene.add(t.getMesh());
    });
    return allThermals;
  }

  async addClouds(
    scene: THREE.Scene,
    weather: Weather,
    thermals: Thermal[]
  ): Promise<THREE.Object3D[]> {
    const lclLevel = weather.getLclLevel();
    // from thermals
    const mainThermals = thermals.filter((t) => t.isMainThermal());
    const clouds = await Promise.all(
      mainThermals.map((t) => {
        if (t.isSuperThermal()) {
          return new Clouds().load(
            3,
            new THREE.Vector3(
              t.getPosition().x,
              t.getDimensions().height * (1 + 0.01 * rndIntBetween(10, 30)),
              t.getPosition().z
            )
          );
        } else {
          return new Clouds().load(
            1,
            new THREE.Vector3(
              t.getPosition().x,
              t.getDimensions().height * (1 + 0.01 * rndIntBetween(10, 30)),
              t.getPosition().z
            )
          );
        }
      })
    );
    clouds.forEach((c) => {
      scene.add(c);
    });

    // custom clouds
    [
      { x: 5120, y: 2000, z: -10100 },
      { x: 2600, y: 2300, z: 842 },
      { x: -3600, y: 2300, z: 8042 },
    ].map(async (pos) => {
      const cloud = await new Clouds().load(
        1,
        new THREE.Vector3(pos.x, pos.y, pos.z)
      );
      scene.add(cloud);
    });
    return clouds;
  }
}

export default Environment;
