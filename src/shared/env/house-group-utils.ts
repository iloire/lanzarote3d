import * as THREE from 'three';
import { HouseConfig, HouseGroupConfig, HouseStyle, DEFAULT_VARIATION } from './house-group-types';

/**
 * Calculate positions for houses based on neighborhood formation type
 */
export function calculateHousePositions(
  houseCount: number,
  groupConfig: HouseGroupConfig
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const { center, formation, spacing, neighborhoodSize = 300, randomVariation = 0.2 } = groupConfig;
  const streetWidth = 30;

  switch (formation) {
    case 'street': {
      // Houses along both sides of a street
      const housesPerSide = Math.ceil(houseCount / 2);
      for (let i = 0; i < houseCount; i++) {
        const side = i < housesPerSide ? -1 : 1; // Left or right side of street
        const indexOnSide = i < housesPerSide ? i : i - housesPerSide;
        const x = center.x + (indexOnSide - (housesPerSide - 1) / 2) * spacing;
        const z = center.z + side * (streetWidth / 2 + 20); // 20 units back from street

        // Add random variation
        const variation = randomVariation * spacing * 0.5;
        const randomX = x + (Math.random() - 0.5) * variation;
        const randomZ = z + (Math.random() - 0.5) * variation * 0.5;

        const position = new THREE.Vector3(randomX, center.y, randomZ);
        positions.push(position);
      }
      break;
    }

    case 'grid': {
      // Regular grid pattern
      const actualRowCount = 3;
      const actualColCount = 3;

      for (let i = 0; i < houseCount; i++) {
        const row = Math.floor(i / actualColCount);
        const col = i % actualColCount;
        let x = center.x + (col - (actualColCount - 1) / 2) * spacing;
        let z = center.z + (row - (actualRowCount - 1) / 2) * spacing;

        // Add random variation
        const variation = randomVariation * spacing * 0.3;
        x += (Math.random() - 0.5) * variation;
        z += (Math.random() - 0.5) * variation;

        const position = new THREE.Vector3(x, center.y, z);
        positions.push(position);
      }
      break;
    }

    case 'suburban': {
      // Mixed layout with curved streets and varied positioning
      // Scale sectors based on house count for better distribution
      const sectors = Math.max(4, Math.ceil(houseCount / 8));
      let houseIndex = 0;

      for (let sector = 0; sector < sectors && houseIndex < houseCount; sector++) {
        const sectorAngle = (sector / sectors) * Math.PI * 2;
        const sectorRadius = neighborhoodSize * 0.3 + Math.random() * neighborhoodSize * 0.2;
        const sectorCenter = new THREE.Vector3(
          center.x + Math.cos(sectorAngle) * sectorRadius,
          center.y,
          center.z + Math.sin(sectorAngle) * sectorRadius
        );

        // Distribute remaining houses evenly across remaining sectors
        const remainingHouses = houseCount - houseIndex;
        const remainingSectors = sectors - sector;
        const housesInSector = Math.ceil(remainingHouses / remainingSectors);

        for (let h = 0; h < housesInSector && houseIndex < houseCount; h++) {
          const localAngle = (h / housesInSector) * Math.PI + sectorAngle - Math.PI / 2;
          const localRadius = spacing * 0.8 + Math.random() * spacing * 0.6;
          const x = sectorCenter.x + Math.cos(localAngle) * localRadius;
          const z = sectorCenter.z + Math.sin(localAngle) * localRadius;
          const position = new THREE.Vector3(x, center.y, z);
          positions.push(position);
          houseIndex++;
        }
      }
      break;
    }

    case 'rural':
      // Scattered placement with larger spacing
      for (let i = 0; i < houseCount; i++) {
        let position: THREE.Vector3;
        let attempts = 0;

        do {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * neighborhoodSize * 0.8;
          position = new THREE.Vector3(
            center.x + Math.cos(angle) * radius,
            center.y,
            center.z + Math.sin(angle) * radius
          );
          attempts++;
        } while (
          attempts < 20 &&
          positions.some(existingPos => existingPos.distanceTo(position) < spacing)
        );
        positions.push(position);
      }
      break;

    case 'random':
      // Random placement within neighborhood bounds
      for (let i = 0; i < houseCount; i++) {
        let position: THREE.Vector3;
        let attempts = 0;

        do {
          const x = center.x + (Math.random() - 0.5) * neighborhoodSize;
          const z = center.z + (Math.random() - 0.5) * neighborhoodSize;
          position = new THREE.Vector3(x, center.y, z);
          attempts++;
        } while (
          attempts < 30 &&
          positions.some(existingPos => existingPos.distanceTo(position) < spacing * 0.8)
        );
        positions.push(position);
      }
      break;

    default:
      // Fallback to grid
      return calculateHousePositions(houseCount, { ...groupConfig, formation: 'grid' });
  }

  return positions;
}

/**
 * Select a house type based on weighted probabilities
 */
function selectWeightedHouseType(types: Array<{ type: HouseConfig['type']; weight: number }>): {
  type: HouseConfig['type'];
} {
  const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
  const random = Math.random() * totalWeight;
  let accumulated = 0;

  for (const typeOption of types) {
    accumulated += typeOption.weight;
    if (random <= accumulated) {
      return { type: typeOption.type };
    }
  }

  // Fallback
  return types[0];
}

/**
 * Generate random color variations for houses
 */
function generateRandomColors(): { [key: string]: string } {
  const wallColors = ['#F5DEB3', '#FFFACD', '#F5F5DC', '#FAF0E6', '#FDF5E6'];
  const roofColors = ['#DEB887', '#D2B48C', '#BC986A', '#CD853F'];
  const accentColors = ['#8B4513', '#A0522D', '#228B22', '#4169E1', '#654321'];

  return {
    wallColor: wallColors[Math.floor(Math.random() * wallColors.length)],
    roofColor: roofColors[Math.floor(Math.random() * roofColors.length)],
    accentColor: accentColors[Math.floor(Math.random() * accentColors.length)],
  };
}

/**
 * Generate a random land plot for a house based on house type and scale, sized and coloured by
 * the town's style when it has one
 */
function generateLandPlot(
  houseType: HouseConfig['type'],
  scale: number = 1,
  plot?: HouseStyle['plot']
): { width: number; depth: number; color?: string } {
  const baseWidths: Record<HouseConfig['type'], number> = {
    House: 60,
    Villa: 100,
    Townhouse: 50,
    Barn: 80,
    DesertHouse: 70,
    DesertHouseWithPool: 90,
  };

  const baseDepths: Record<HouseConfig['type'], number> = {
    House: 60,
    Villa: 90,
    Townhouse: 70,
    Barn: 100,
    DesertHouse: 80,
    DesertHouseWithPool: 100,
  };

  const landColors = plot?.colors ?? ['#D2B48C', '#DEB887', '#F5DEB3', '#D2691E', '#CD853F']; // Desert sand shades
  const plotScale = plot?.scale ?? 1;

  // Add some random variation to land plot size
  const widthVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation
  const depthVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation

  return {
    width: Math.max(40 * plotScale, baseWidths[houseType] * scale * widthVariation * plotScale),
    depth: Math.max(40 * plotScale, baseDepths[houseType] * scale * depthVariation * plotScale),
    color: landColors[Math.floor(Math.random() * landColors.length)],
  };
}

/** One colour for each option in the palette */
function pickColors(palette: Record<string, string[]>): { [key: string]: string } {
  return Object.fromEntries(
    Object.entries(palette).map(([option, hexes]) => [
      option,
      hexes[Math.floor(Math.random() * hexes.length)]!,
    ])
  );
}

/**
 * Create a mixed neighborhood with custom house distribution, or with a town's own style
 */
export function generateMixedNeighborhood(count: number, style?: HouseStyle): HouseConfig[] {
  const variation = DEFAULT_VARIATION;
  const houses: HouseConfig[] = [];
  const distribution = style?.types ?? {
    House: 0.4,
    Villa: 0.15,
    Townhouse: 0.15,
    Barn: 0.1,
    DesertHouse: 0.1,
    DesertHouseWithPool: 0.05,
  };

  // Create house types based on distribution
  const types: Array<{ type: HouseConfig['type']; weight: number }> = Object.entries(
    distribution
  ).map(([type, weight]) => ({ type: type as HouseConfig['type'], weight }));

  for (let i = 0; i < count; i++) {
    const selectedType = selectWeightedHouseType(types);
    const baseScale = 0.8 + Math.random() * 0.4;

    // Generate 90-degree increment rotation
    const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const rotation = variation.rotationVariation
      ? rotations[Math.floor(Math.random() * rotations.length)]
      : 0;

    houses.push({
      ...selectedType,
      scale: baseScale,
      includePool: Math.random() < variation.poolChance,
      rotation,
      colors: style
        ? pickColors(style.palette)
        : variation.colorVariation
          ? generateRandomColors()
          : undefined,
      landPlot: generateLandPlot(selectedType.type, baseScale, style?.plot),
    });
  }

  return houses;
}

/**
 * Removes the houses whose ground is below `minHeight` from the scene, with the land plot, pool
 * and garden tagged with their position, and returns the ones left. The island model carries on
 * under the sea as a seabed, so a town on the coast gets ground heights for houses in the water.
 */
export function removeHousesAtSea(
  scene: THREE.Object3D,
  houses: THREE.Object3D[],
  groundHeight: (x: number, z: number) => number,
  minHeight: number
): THREE.Object3D[] {
  const atSea = houses.filter(house => {
    const height = groundHeight(house.position.x, house.position.z);
    return isNaN(height) || height < minHeight;
  });
  if (atSea.length === 0) return houses;

  const belongsTo = (obj: THREE.Object3D, house: THREE.Object3D) => {
    const at = obj.userData?.parentHousePosition as THREE.Vector3 | undefined;
    return (
      at !== undefined &&
      Math.abs(at.x - house.position.x) < 0.01 &&
      Math.abs(at.z - house.position.z) < 0.01
    );
  };
  const removed = scene.children.filter(
    obj => atSea.includes(obj) || atSea.some(house => belongsTo(obj, house))
  );
  removed.forEach(obj => scene.remove(obj));

  return houses.filter(house => !atSea.includes(house));
}
