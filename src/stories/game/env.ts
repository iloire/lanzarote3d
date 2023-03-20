import * as THREE from "three";
import Clouds from "../../elements/clouds";
import Weather from "../../elements/weather";
import Thermal, { ThermalDimensions } from "../../elements/thermal";
import { rndIntBetween } from "../../utils/math";
import Tree from "../../components/tree";
import Stone from "../../components/stone";
import House from "../../components/house";
import Boat from "../../components/boat";
import Birds from "../../components/birds";
import Paraglider, { ParagliderConstructor } from "../../elements/pg";

const KMH_TO_MS = 3.6;

const generateRandomLcl = (lclLevel: number): number => {
  return lclLevel + rndIntBetween(-200, 3000);
};

const generateRandomThermalDimensions = (
  lclLevel: number
): ThermalDimensions => {
  return {
    bottomRadius: rndIntBetween(320, 450),
    topRadius: rndIntBetween(500, 700),
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

const addMeshAroundArea = (
  obj: THREE.Object3D,
  pos: THREE.Vector3,
  number: number,
  terrain: THREE.Mesh,
  scene: THREE.Scene
) => {
  for (let index = 0; index < number; index++) {
    const newX = pos.x + 2 * index * rndIntBetween(0, 5);
    const newZ = pos.z + 2 * index * rndIntBetween(0, 10);

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

const Environment = {
  addBirds: async (scene: THREE.Scene, path: THREE.Vector3[], gui?: any) => {
    const birds = new Birds();
    const birdsMesh = await birds.load(path, gui);
    scene.add(birdsMesh);
  },

  addOtherGliders: async (
    scene: THREE.Scene,
    weather: Weather,
    terrain: THREE.Mesh,
    water: THREE.Mesh
  ) => {
    const pgOptions: ParagliderConstructor = {
      glidingRatio: 9,
      trimSpeed: 35 / KMH_TO_MS,
      halfSpeedBarSpeed: 40 / KMH_TO_MS,
      fullSpeedBarSpeed: 45 / KMH_TO_MS,
      smallEarsSpeed: 30 / KMH_TO_MS,
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
  },

  addBoats: (scene: THREE.Scene, terrain: THREE.Mesh) => {
    const boat = new Boat().load();
    const scale = 3;
    boat.scale.set(scale, scale, scale);
    addMeshAroundArea(
      boat,
      new THREE.Vector3(7879, 0, -4445),
      5,
      terrain,
      scene
    );
    addMeshAroundArea(
      boat,
      new THREE.Vector3(8279, 0, -6155),
      4,
      terrain,
      scene
    );
  },

  addHouses: (scene: THREE.Scene, terrain: THREE.Mesh) => {
    const house = new House().load();
    const scale = 5;
    house.scale.set(scale, scale, scale);
    addMeshAroundArea(
      house,
      new THREE.Vector3(6879, 0, -545),
      20,
      terrain,
      scene
    );
    addMeshAroundArea(
      house,
      new THREE.Vector3(6279, 0, -3155),
      20,
      terrain,
      scene
    );
  },

  addStones: (scene: THREE.Scene, terrain: THREE.Mesh) => {
    const stone = new Stone().load();
    const scale = 4;
    stone.scale.set(scale, scale, scale);
    const pos = new THREE.Vector3(6879, 600, -545);
    addMeshAroundArea(stone, pos, 100, terrain, scene);
  },

  addTrees: (scene: THREE.Scene, terrain: THREE.Mesh) => {
    const tree = new Tree().load();
    const scale = 3;
    tree.scale.set(scale, scale, scale);
    addMeshAroundArea(
      tree,
      new THREE.Vector3(6879, 600, -545),
      100,
      terrain,
      scene
    );
    addMeshAroundArea(
      tree,
      new THREE.Vector3(8879, 600, -2245),
      100,
      terrain,
      scene
    );
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
