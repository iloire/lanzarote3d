import * as THREE from "three";
import Clouds from "../../../components/clouds";
import Weather from "../../../elements/weather";
import Thermal, { ThermalDimensions } from "../../../components/thermal";
import { rndBetween, rndIntBetween } from "../../../utils/math";
import Tree from "../../../components/tree";
import PineTree from "../../../components/pinetree";
import Stone from "../../../components/stone";
import House, { HouseType } from "../../../components/house";
import Boat from "../../../components/boat";
import Birds from "../../../components/birds";
import Paraglider, {
  ParagliderConstructor,
  EnvOptions,
} from "../../../components/pg";
import HangGlider from "../../../components/hangglider";
import { addMeshAroundArea } from "./mesh-utils";
import { generateThermalPair } from "./thermal-utils";

const KMH_TO_MS = 3.6;
const THERMAL_OPACITY = 0.04;

const createPg = async (
  options: ParagliderConstructor,
  env: EnvOptions,
  pos: THREE.Vector3
): Promise<Paraglider> => {
  const pg = new Paraglider(options, env, false);
  const pgMesh = await pg.loadModel(1);
  pg.setPosition(pos);
  pg.init();
  return pg;
};

class Environment {
  birds: Birds;
  hg: HangGlider;
  thermals: Thermal[] = [];
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  updateWrapSpeed(wrapSpeed: number) {
    this.birds && this.birds.updateWrapSpeed(wrapSpeed);
    this.hg && this.hg.updateWrapSpeed(wrapSpeed);
  }

  async addBirds(path: THREE.Vector3[], gui?: any) {
    this.birds = new Birds();
    const birdsMesh = await this.birds.load(path, gui);
    this.scene.add(birdsMesh);
  }

  async addHangGlider(path: THREE.Vector3[], gui?: any) {
    this.hg = new HangGlider();
    const hgMesh = await this.hg.load(path, gui);
    this.scene.add(hgMesh);
  }

  async addOtherGliders(
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
    const envOptions = {
      weather,
      terrain,
      water,
      thermals: [],
    };
    const pos = new THREE.Vector3(1379, 600, -545);
    const pg = await createPg(pgOptions, envOptions, pos);
    this.scene.add(pg.getMesh());

    const pos2 = new THREE.Vector3(3379, 900, -1545);
    const pg2 = await createPg(pgOptions, envOptions, pos2);
    this.scene.add(pg2.getMesh());

    // const pos3 = new THREE.Vector3(379, 1200, -145);
    // const pg3 = await createPg(pgOptions, weather, terrain, water, pos3);
    // scene.add(pg3.getMesh());
    //
    // const pos4 = new THREE.Vector3(8179, 1200, -3945);
    // const pg4 = await createPg(pgOptions, weather, terrain, water, pos4);
    // scene.add(pg4.getMesh());
  }

  addBoats(water: THREE.Mesh) {
    const boat = new Boat().load();
    const scale = 3;
    boat.scale.set(scale, scale, scale);
    addMeshAroundArea(
      [boat],
      new THREE.Vector3(7879, 0, -4445),
      5,
      water,
      this.scene
    );
    addMeshAroundArea(
      [boat],
      new THREE.Vector3(8279, 0, -6155),
      4,
      water,
      this.scene
    );
  }

  addHouses(terrain: THREE.Mesh) {
    const house = new House(HouseType.Medium).load();
    const house2 = new House(HouseType.Small).load();

    addMeshAroundArea(
      [house2, house],
      new THREE.Vector3(6879, 0, -545),
      20,
      terrain,
      this.scene,
      70,
      9
    );
    addMeshAroundArea(
      // famara
      [house, house2],
      new THREE.Vector3(6279, 0, -3155),
      40,
      terrain,
      this.scene,
      40,
      10
    );
    addMeshAroundArea(
      // noruegos
      [house, house2],
      new THREE.Vector3(7827, 0, -3460),
      10,
      terrain,
      this.scene,
      20,
      11
    );
    addMeshAroundArea(
      // tenesar
      [house, house2],
      new THREE.Vector3(-5200, 0, -480),
      10,
      terrain,
      this.scene,
      40,
      9
    );
    addMeshAroundArea(
      // teguise
      [house],
      new THREE.Vector3(5600, 0, 705),
      50,
      terrain,
      this.scene,
      70,
      7
    );
  }

  addStones(terrain: THREE.Mesh) {
    const stone = new Stone().load();
    const scale = 1;
    stone.scale.set(scale, scale, scale);
    const pos = new THREE.Vector3(6879, 600, -545);
    addMeshAroundArea([stone], pos, 100, terrain, this.scene, 200, 2);
  }

  addTrees(terrain: THREE.Mesh) {
    const tree = new Tree().load();
    const scale = 1;
    tree.scale.set(scale, scale, scale);
    addMeshAroundArea(
      [tree],
      new THREE.Vector3(6879, 0, -545),
      100,
      terrain,
      this.scene,
      100,
      5
    );
    addMeshAroundArea(
      [tree],
      new THREE.Vector3(8879, 0, -2245),
      100,
      terrain,
      this.scene,
      100,
      5
    );
    addMeshAroundArea(
      [tree],
      new THREE.Vector3(5600, 0, 705),
      100,
      terrain,
      this.scene,
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
      this.scene,
      400,
      5
    );
  }

  addThermals(weather: Weather): Thermal[] {
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
      this.scene.add(t.getMesh());
    });

    this.thermals.concat(allThermals);

    return allThermals;
  }

  async addClouds(
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
      this.scene.add(c);
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
      this.scene.add(cloud);
    });
    return clouds;
  }

  getThermals(): Thermal[] {
    return this.thermals;
  }
}

export default Environment;
