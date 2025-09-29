import * as THREE from 'three';
import { HouseConfig, HouseGroupConfig, NEIGHBORHOOD_PRESETS, NeighborhoodVariation, DEFAULT_VARIATION } from './house-group-types';
import { HouseType } from '../../../foundation/components/scenery/buildings/House';

/**
 * Calculate positions for houses based on neighborhood formation type
 */
export function calculateHousePositions(
  houseCount: number,
  groupConfig: HouseGroupConfig
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const {
    center,
    formation,
    spacing,
    neighborhoodSize = 300,
    streetWidth = 30,
    rowCount = 3,
    colCount = 3,
    randomVariation = 0.2,
  } = groupConfig;

  switch (formation) {
    case 'street':
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

        positions.push(new THREE.Vector3(randomX, center.y, randomZ));
      }
      break;

    case 'cul-de-sac':
      // Circular arrangement around a cul-de-sac
      const radius = Math.min(neighborhoodSize * 0.4, spacing * houseCount / (2 * Math.PI) * 1.5);
      for (let i = 0; i < houseCount; i++) {
        const angle = (i / houseCount) * Math.PI * 1.2 + Math.PI * 0.1; // 216 degrees arc
        const houseRadius = radius + (Math.random() - 0.5) * spacing * randomVariation;
        const x = center.x + Math.cos(angle) * houseRadius;
        const z = center.z + Math.sin(angle) * houseRadius;
        positions.push(new THREE.Vector3(x, center.y, z));
      }
      break;

    case 'grid':
      // Regular grid pattern
      const actualRowCount = rowCount || Math.ceil(Math.sqrt(houseCount));
      const actualColCount = colCount || Math.ceil(houseCount / actualRowCount);

      for (let i = 0; i < houseCount; i++) {
        const row = Math.floor(i / actualColCount);
        const col = i % actualColCount;
        let x = center.x + (col - (actualColCount - 1) / 2) * spacing;
        let z = center.z + (row - (actualRowCount - 1) / 2) * spacing;

        // Add random variation
        const variation = randomVariation * spacing * 0.3;
        x += (Math.random() - 0.5) * variation;
        z += (Math.random() - 0.5) * variation;

        positions.push(new THREE.Vector3(x, center.y, z));
      }
      break;

    case 'suburban':
      // Mixed layout with curved streets and varied positioning
      const sectors = Math.min(4, Math.ceil(houseCount / 6));
      let houseIndex = 0;

      for (let sector = 0; sector < sectors && houseIndex < houseCount; sector++) {
        const sectorAngle = (sector / sectors) * Math.PI * 2;
        const sectorRadius = neighborhoodSize * 0.3 + Math.random() * neighborhoodSize * 0.2;
        const sectorCenter = new THREE.Vector3(
          center.x + Math.cos(sectorAngle) * sectorRadius,
          center.y,
          center.z + Math.sin(sectorAngle) * sectorRadius
        );

        const housesInSector = Math.min(8, houseCount - houseIndex);
        for (let h = 0; h < housesInSector; h++) {
          const localAngle = (h / housesInSector) * Math.PI + sectorAngle - Math.PI / 2;
          const localRadius = spacing * 0.8 + Math.random() * spacing * 0.6;
          const x = sectorCenter.x + Math.cos(localAngle) * localRadius;
          const z = sectorCenter.z + Math.sin(localAngle) * localRadius;
          positions.push(new THREE.Vector3(x, center.y, z));
          houseIndex++;
        }
      }
      break;

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
 * Generate a suburban neighborhood with mixed house types
 */
export function generateSuburbanNeighborhood(
  size: 'small' | 'medium' | 'large' = 'medium',
  variation: NeighborhoodVariation = DEFAULT_VARIATION
): HouseConfig[] {
  const preset = NEIGHBORHOOD_PRESETS.suburban[size];
  const houses: HouseConfig[] = [];

  const houseTypes: Array<{ type: HouseConfig['type']; weight: number; houseType?: HouseType }> = [
    { type: 'House', weight: 0.4, houseType: HouseType.Medium },
    { type: 'House', weight: 0.2, houseType: HouseType.Large },
    { type: 'House', weight: 0.15, houseType: HouseType.Modern },
    { type: 'Villa', weight: 0.1 },
    { type: 'Townhouse', weight: 0.1 },
    { type: 'DesertHouse', weight: 0.05 },
  ];

  for (let i = 0; i < preset.count; i++) {
    const selectedType = selectWeightedHouseType(houseTypes);
    const baseScale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const scaleVariation = variation.scaleVariation * (Math.random() - 0.5) * 0.4;

    // Generate 90-degree increment rotation
    const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const rotation = variation.rotationVariation
      ? rotations[Math.floor(Math.random() * rotations.length)]
      : 0;

    const finalScale = Math.max(0.5, baseScale + scaleVariation);

    houses.push({
      ...selectedType,
      scale: finalScale,
      includePool: Math.random() < variation.poolChance,
      rotation,
      colors: variation.colorVariation ? generateRandomColors() : undefined,
      landPlot: generateLandPlot(selectedType.type, finalScale),
    });
  }

  return houses;
}

/**
 * Generate an urban neighborhood with more compact buildings
 */
export function generateUrbanNeighborhood(
  density: 'compact' | 'dense' | 'downtown' = 'dense',
  variation: NeighborhoodVariation = DEFAULT_VARIATION
): HouseConfig[] {
  const preset = NEIGHBORHOOD_PRESETS.urban[density];
  const houses: HouseConfig[] = [];

  const houseTypes: Array<{ type: HouseConfig['type']; weight: number; houseType?: HouseType }> = [
    { type: 'Townhouse', weight: 0.4 },
    { type: 'House', weight: 0.25, houseType: HouseType.Modern },
    { type: 'House', weight: 0.15, houseType: HouseType.Large },
    { type: 'Villa', weight: 0.1 },
  ];

  for (let i = 0; i < preset.count; i++) {
    const selectedType = selectWeightedHouseType(houseTypes);
    const baseScale = 0.7 + Math.random() * 0.3; // Smaller for urban density

    // Generate 90-degree increment rotation
    const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const rotation = variation.rotationVariation
      ? rotations[Math.floor(Math.random() * rotations.length)]
      : 0;

    houses.push({
      ...selectedType,
      scale: baseScale,
      includePool: Math.random() < variation.poolChance * 0.5, // Fewer pools in urban areas
      rotation,
      colors: variation.colorVariation ? generateRandomColors() : undefined,
      landPlot: generateLandPlot(selectedType.type, baseScale),
    });
  }

  return houses;
}

/**
 * Generate a rural neighborhood with farms and scattered buildings
 */
export function generateRuralNeighborhood(
  style: 'farmstead' | 'village' | 'scattered' = 'village',
  variation: NeighborhoodVariation = DEFAULT_VARIATION
): HouseConfig[] {
  const preset = NEIGHBORHOOD_PRESETS.rural[style];
  const houses: HouseConfig[] = [];

  const houseTypes: Array<{ type: HouseConfig['type']; weight: number; houseType?: HouseType }> = [
    { type: 'House', weight: 0.3, houseType: HouseType.Small },
    { type: 'House', weight: 0.2, houseType: HouseType.Medium },
    { type: 'Barn', weight: 0.25 },
    { type: 'DesertHouse', weight: 0.15 },
    { type: 'Villa', weight: 0.1 },
  ];

  for (let i = 0; i < preset.count; i++) {
    const selectedType = selectWeightedHouseType(houseTypes);
    const baseScale = 0.9 + Math.random() * 0.4; // Larger for rural areas

    // Generate 90-degree increment rotation
    const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const rotation = variation.rotationVariation
      ? rotations[Math.floor(Math.random() * rotations.length)]
      : 0;

    houses.push({
      ...selectedType,
      scale: baseScale,
      includePool: Math.random() < variation.poolChance * 0.7,
      rotation,
      colors: variation.colorVariation ? generateRandomColors() : undefined,
      landPlot: generateLandPlot(selectedType.type, baseScale),
    });
  }

  return houses;
}

/**
 * Select a house type based on weighted probabilities
 */
function selectWeightedHouseType(
  types: Array<{ type: HouseConfig['type']; weight: number; houseType?: HouseType }>
): { type: HouseConfig['type']; houseType?: HouseType } {
  const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
  const random = Math.random() * totalWeight;
  let accumulated = 0;

  for (const typeOption of types) {
    accumulated += typeOption.weight;
    if (random <= accumulated) {
      return { type: typeOption.type, houseType: typeOption.houseType };
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
 * Generate a random land plot for a house based on house type and scale
 */
function generateLandPlot(houseType: HouseConfig['type'], scale: number = 1): { width: number; depth: number; color?: string } {
  const baseWidths: Record<HouseConfig['type'], number> = {
    'House': 60,
    'Villa': 100,
    'Townhouse': 50,
    'Barn': 80,
    'DesertHouse': 70,
    'DesertHouseWithPool': 90,
  };

  const baseDepths: Record<HouseConfig['type'], number> = {
    'House': 60,
    'Villa': 90,
    'Townhouse': 70,
    'Barn': 100,
    'DesertHouse': 80,
    'DesertHouseWithPool': 100,
  };

  const landColors = ['#D2B48C', '#DEB887', '#F5DEB3', '#D2691E', '#CD853F']; // Desert sand shades

  // Add some random variation to land plot size
  const widthVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation
  const depthVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation

  return {
    width: Math.max(40, baseWidths[houseType] * scale * widthVariation),
    depth: Math.max(40, baseDepths[houseType] * scale * depthVariation),
    color: landColors[Math.floor(Math.random() * landColors.length)],
  };
}

/**
 * Create a mixed neighborhood with custom house distribution
 */
export function generateMixedNeighborhood(
  count: number,
  houseDistribution?: Partial<Record<HouseConfig['type'], number>>,
  variation: NeighborhoodVariation = DEFAULT_VARIATION
): HouseConfig[] {
  const houses: HouseConfig[] = [];
  const defaultDistribution = {
    'House': 0.4,
    'Villa': 0.15,
    'Townhouse': 0.15,
    'Barn': 0.1,
    'DesertHouse': 0.1,
    'DesertHouseWithPool': 0.05,
  };

  const distribution = { ...defaultDistribution, ...houseDistribution };

  // Create house types based on distribution
  const types: Array<{ type: HouseConfig['type']; weight: number }> = Object.entries(distribution)
    .map(([type, weight]) => ({ type: type as HouseConfig['type'], weight }));

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
      colors: variation.colorVariation ? generateRandomColors() : undefined,
      landPlot: generateLandPlot(selectedType.type, baseScale),
    });
  }

  return houses;
}