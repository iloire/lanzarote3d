import * as THREE from 'three';
import roadsData from './roads.json';
import { ISLAND_ANCHOR, geoToWorld } from '../geo';
import { ProceduralRoad } from '../../foundation/components/scenery';

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

/** The roads between the Famara towns, traced from OpenStreetMap, laid on the terrain */
export const createIslandRoads = (terrain: THREE.Mesh): Promise<THREE.Object3D[]> =>
  Promise.all(
    data.roads.map(({ points }) => {
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
      }).load();
    })
  );
