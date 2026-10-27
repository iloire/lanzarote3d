import * as THREE from 'three';
import harbourData from './harbour.json';
import { geoToWorld } from '../../shared/geo';
import type { HarbourFeature, HarbourFeatureKind } from '../../foundation/components/scenery';
import { HARBOUR_PLACEMENT } from './config';

interface HarbourData {
  centre: [number, number];
  features: { kind: HarbourFeatureKind; name: string; points: [number, number][] }[];
}

// JSON arrays type as number[][], not as the [lat, lon] pairs they hold
const data = harbourData as unknown as HarbourData;
const origin = geoToWorld(...data.centre);

/** A [lat, lon] in the harbour's own x/z: from its centre, at its exaggerated size */
const toLocal = ([lat, lon]: [number, number]): [number, number] => {
  const { x, z } = geoToWorld(lat, lon);
  const k = HARBOUR_PLACEMENT.exaggeration;
  return [(x - origin.x) * k, (z - origin.z) * k];
};

/** The harbour's structures, around its centre, for the Harbour component */
export const HARBOUR_FEATURES: HarbourFeature[] = data.features.map(({ kind, points }) => ({
  kind,
  points: points.map(toLocal),
}));

/** A point of the harbour in world coordinates, placed as the scene places the Harbour mesh */
const toWorld = ([x, z]: [number, number]) =>
  new THREE.Vector3(x, 0, z)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), HARBOUR_PLACEMENT.rotation)
    .add(HARBOUR_PLACEMENT.centre);

/** Each pontoon from its root on the breakwater to its tip, in world coordinates */
export const PONTOONS: [THREE.Vector3, THREE.Vector3][] = HARBOUR_FEATURES.filter(
  f => f.kind === 'pontoon'
).map(f => [toWorld(f.points[0]!), toWorld(f.points[f.points.length - 1]!)]);

/** The north quay, west to east, in world coordinates */
const northQuay = data.features.find(f => f.name.startsWith('North quay'))!.points.map(toLocal);
export const NORTH_QUAY: [THREE.Vector3, THREE.Vector3] = [
  toWorld(northQuay[0]!),
  toWorld(northQuay[northQuay.length - 1]!),
];
