import * as THREE from "three";
import Clouds from "../../components/clouds";
import Weather from "../../elements/weather";
import Thermal from "../../components/thermal";
import { rndIntBetween } from "../../utils/math";
import Tree from "../../components/tree";
import PineTree from "../../components/pinetree";
import Stone from "../../components/stone";
import House, { HouseType } from "../../components/house";
import Boat from "../../components/boat";
import Birds from "../../components/birds";
import HangGlider from "../../components/hangglider";
import { addMeshAroundArea } from "./mesh-utils";
import { generateThermalPair, ThermalGenerationOptions } from "./thermal-utils";
import { CloudOptions } from "../../components/cloud";

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

  addPines(terrain: THREE.Mesh) {
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


  addTrees(terrain: THREE.Mesh, scale: number = 2) {
    const tree = new Tree().load();
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
  }

  addThermals(weather: Weather, opacity: number = 0.05): Thermal[] {
    const thermals = this.generateThermals(weather, opacity);
    thermals.forEach((t) => {
      this.scene.add(t.getMesh());
    });
    return thermals;
  }

  generateThermals(weather: Weather, opacity: number = 0.05): Thermal[] {
    // famara
    const options: ThermalGenerationOptions = {
      position: new THREE.Vector3(5727, 0, -535),
      weather,
      superThermal: false,
      opacity
    };

    const allThermals = generateThermalPair(options)
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(7127, 0, -1405) }))
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(3027, 0, 1005) }))
      // tenesar
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(-4827, 0, -855) }))
      // mirador
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(15027, 0, -12555) }))
      //pq
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(-6227, 0, 14055) }))
      //mala
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(14227, 0, -3755) }))
      // pq
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(-3927, 0, 9830) }))
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(592, 0, 5530) }))
      .concat(generateThermalPair({ ...options, position: new THREE.Vector3(15027, 0, -12555), superThermal: true }))


    this.thermals.concat(allThermals);

    return allThermals;
  }

  async addClouds(
    weather: Weather,
    thermals: Thermal[],
    options: CloudOptions
  ): Promise<THREE.Object3D[]> {
    const lclLevel = weather.getLclLevel();
    // from thermals
    const mainThermals = thermals.filter((t) => t.isMainThermal());
    const clouds = await Promise.all(
      mainThermals.map((t) => {
        if (t.isSuperThermal()) {
          return new Clouds(options).load(
            3,
            new THREE.Vector3(
              t.getPosition().x,
              t.getDimensions().height * (1 + 0.01 * rndIntBetween(10, 30)),
              t.getPosition().z
            )
          );
        } else {
          return new Clouds(options).load(
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
      const cloud = await new Clouds(options).load(
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
