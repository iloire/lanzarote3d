import * as THREE from 'three';
import type { CityGrid } from '../../foundation/rendering/cityWindows';
import { neonSigns, SignSpots } from '../../shared/env/neonSigns';
import { harbourGlow, GlowSpots } from '../../shared/env/harbourGlow';
import { Road, RoadTraffic } from '../../shared/env/roadTraffic';
import { HarbourBoats } from '../../shared/env/harbourBoats';
import { LightShow } from '../../shared/env/lightShow';
import type { RelaxScene } from './scenes';

// Cars with their lights on, on the left (Hong Kong)
const TRAFFIC = { maxCars: 2600, spacing: 22, speed: [8, 15] as [number, number], laneWidth: 3.4 };
// How brightly the street layer's lamps glow
const STREET_GLOW = 0.8;
// The harbour's reflections lie just over the water
const WATER_LIFT = 0.6;

/** What a city at night moves every frame */
export interface NightCity {
  update(deltaTime: number): void;
  dispose(): void;
}

/**
 * A city at night, from what 3d/city-on-hills.py wrote into its GLB and the place's harbour and
 * light show: lamplit streets, neon on the walls, the lights mirrored in the harbour, cars with
 * their lights on, boats with lit cabins, and beams from the towers.
 */
export function addNightCity(
  scene: THREE.Scene,
  city: THREE.Object3D,
  relax: RelaxScene
): NightCity {
  const moving: { update(deltaTime: number): void; dispose(): void }[] = [];
  let unitsPerMetre = 1;
  city.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = object.material as THREE.MeshStandardMaterial;
    if (material.emissiveMap) {
      material.emissiveIntensity = STREET_GLOW;
      // Lamplight spreads; the street's own texels stay crisp
      material.emissiveMap = material.emissiveMap.clone();
      material.emissiveMap.magFilter = THREE.LinearFilter;
      material.emissiveMap.needsUpdate = true;
      // The streets lie on the ground; they cast nothing
      object.castShadow = false;
    }
    const grid = object.userData['grid'] as CityGrid | undefined;
    if (!grid) return;
    unitsPerMetre = grid.unitsPerMetre;
    const signs = object.userData['signs'] as SignSpots | undefined;
    if (signs?.length) scene.add(neonSigns(signs, grid.unitsPerMetre));
    const glows = object.userData['glows'] as GlowSpots | undefined;
    if (glows?.length) scene.add(harbourGlow(glows, WATER_LIFT * grid.up));
    const roads = object.userData['roads'] as Road[] | undefined;
    if (roads?.length) {
      const traffic = new RoadTraffic(roads, {
        ...TRAFFIC,
        unitsPerMetre: grid.unitsPerMetre,
        keepLeft: true,
      });
      scene.add(traffic.mesh);
      moving.push(traffic);
    }
  });
  if (relax.harbour) {
    const boats = new HarbourBoats({ ...relax.harbour, unitsPerMetre, waterY: 0 });
    scene.add(boats.group);
    moving.push(boats);
  }
  if (relax.lasers?.length) {
    const show = new LightShow(relax.lasers);
    scene.add(show.group);
    moving.push(show);
  }
  return {
    update: deltaTime => moving.forEach(thing => thing.update(deltaTime)),
    dispose: () => moving.forEach(thing => thing.dispose()),
  };
}
