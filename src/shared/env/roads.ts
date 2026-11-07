import * as THREE from 'three';
import roadsData from './roads.json';
import { ISLAND_ANCHOR, geoToWorld } from '../geo';
import { ProceduralRoad } from '../../foundation/components/scenery';
import { RoadTraffic } from './roadTraffic';
import { CUTE_CARS } from './cuteCars';

interface RoadsData {
  roads: { name: string; points: [number, number][] }[];
}

// JSON arrays type as number[][], not as the [lat, lon] pairs they hold
const data = roadsData as unknown as RoadsData;

// World units of road per ribbon segment, so bends stay smooth on the long roads
const SEGMENT_LENGTH = 15;

// Dusty tracks a shade lighter than the terrain underlay (#34302d): no markings, which read as
// bright 1px wires at island scale, and opaque so they don't sort badly
const ROAD_STYLE = {
  width: 11,
  roadColor: '#3e3833',
  showCenterLine: false,
  showEdgeLines: false,
  heightOffset: 1.5,
};

// A handful of toy cars pottering along at 40-60 km/h, one lane each way, on the right. The lane
// sits about a quarter of the (widened) road out from its middle, so the doubled cars fit
const TRAFFIC = {
  maxCars: 22,
  spacing: 60,
  speed: [11, 16.5] as [number, number],
  laneWidth: 7,
  keepLeft: false,
  look: CUTE_CARS,
};

/**
 * The roads between the Famara towns, traced from OpenStreetMap, laid on the terrain, and the
 * cars that drive them (add its mesh to the scene and update it every frame)
 */
export const createIslandRoads = async (
  terrain: THREE.Mesh
): Promise<{ roads: THREE.Object3D[]; traffic: RoadTraffic }> => {
  const built = data.roads.map(({ points }) => {
    const controlPoints = points.map(([lat, lon]) => {
      const { x, z } = geoToWorld(lat, lon, ISLAND_ANCHOR);
      return new THREE.Vector3(x, 0, z);
    });
    const length = controlPoints.reduce(
      (sum, p, i) => (i === 0 ? 0 : sum + p.distanceTo(controlPoints[i - 1]!)),
      0
    );
    return new ProceduralRoad({
      ...ROAD_STYLE,
      terrain,
      controlPoints,
      segments: Math.ceil(length / SEGMENT_LENGTH),
    });
  });
  const roads = await Promise.all(built.map(road => road.load()));
  // RoadTraffic's roads: two-way with one lane each way (-1), then each point's x, y, z
  const lanes = built.map(road => [-1, ...road.path.flatMap(p => [p.x, p.y, p.z])]);
  const traffic = new RoadTraffic(lanes, {
    ...TRAFFIC,
    unitsPerMetre: ISLAND_ANCHOR.unitsPerMetre,
  });
  return { roads, traffic };
};
