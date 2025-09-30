import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';
import { TerrainNavigator } from '../../systems/behaviors/TerrainNavigator';

export interface ProceduralRoadOptions extends SimpleComponentOptions {
  // Path definition
  controlPoints: THREE.Vector3[];
  tension?: number; // Catmull-Rom curve tension (0-1, default: 0.5)

  // Terrain reference
  terrain: THREE.Mesh;
  heightOffset?: number; // Elevation above terrain (default: 0.1)

  // Road dimensions
  width?: number; // Road width (default: 6)
  segments?: number; // Path subdivision count (default: 100)

  // Visual options
  roadColor?: string; // Asphalt color (default: '#2C2C2C')
  lineColor?: string; // Center/edge line color (default: '#FFFF00')
  showCenterLine?: boolean; // Yellow center line (default: true)
  showEdgeLines?: boolean; // White edge lines (default: true)
  lineWidth?: number; // Line width as % of road (default: 0.05)

  // Material options
  roughness?: number; // Material roughness (default: 0.9)
  metalness?: number; // Material metalness (default: 0.0)
  opacity?: number; // Material opacity (0-1, default: 1.0)
  transparent?: boolean; // Enable transparency (default: false)

  // Advanced features
  smoothSlopes?: boolean; // Smooth steep transitions (default: true)
  maxSlope?: number; // Max slope before smoothing (default: Math.PI/4)
}

/**
 * ProceduralRoad - Generates roads on terrain based on control points
 *
 * Creates smooth roads that follow terrain contours using Catmull-Rom splines.
 * Supports customizable road width, markings, and visual options.
 */
export class ProceduralRoad extends SimpleThreeComponent {
  private terrainNavigator: TerrainNavigator | null = null;
  private curve: THREE.CatmullRomCurve3 | null = null;
  private pathPoints: THREE.Vector3[] = [];

  constructor(options: ProceduralRoadOptions) {
    const metadata: ComponentMetadata = {
      name: 'ProceduralRoad',
      version: '1.0.0',
      description: 'Procedurally generated road that follows terrain contours',
      tags: ['scenery', 'road', 'procedural', 'terrain', 'infrastructure'],
    };

    super(metadata, {
      // Path defaults
      tension: 0.5,

      // Terrain defaults
      heightOffset: 2, // Higher offset to ensure roads are visible above terrain

      // Road dimension defaults
      width: 6,
      segments: 100,

      // Visual defaults
      roadColor: '#2C2C2C',
      lineColor: '#FFFF00',
      showCenterLine: true,
      showEdgeLines: true,
      lineWidth: 0.05,

      // Material defaults
      roughness: 0.9,
      metalness: 0.0,
      opacity: 1.0,
      transparent: false,

      // Advanced defaults
      smoothSlopes: true,
      maxSlope: Math.PI / 4, // 45 degrees

      ...options,
    });

    // Initialize terrain navigator if terrain provided
    const opts = this.options as ProceduralRoadOptions;
    if (opts.terrain) {
      this.terrainNavigator = new TerrainNavigator({
        smoothingFactor: 0.1,
      });
      this.terrainNavigator.setTerrain(opts.terrain);
    }
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Placeholder - actual geometry created in createContent
    return new THREE.BufferGeometry();
  }

  protected override createContent(): THREE.Object3D {
    const roadGroup = new THREE.Group();
    roadGroup.name = 'ProceduralRoad';

    const options = this.options as ProceduralRoadOptions;

    // Validate control points
    if (!options.controlPoints || options.controlPoints.length < 2) {
      console.error('ProceduralRoad requires at least 2 control points');
      return roadGroup;
    }

    if (!this.terrainNavigator) {
      console.error('ProceduralRoad requires a terrain mesh');
      return roadGroup;
    }

    // Generate the path curve
    this.generatePath();

    // Create road surface
    const roadMesh = this.createRoadSurface();
    if (roadMesh) {
      roadGroup.add(roadMesh);
    }

    // Add road markings
    if (options.showCenterLine) {
      const centerLine = this.createCenterLine();
      if (centerLine) {
        roadGroup.add(centerLine);
      }
    }

    if (options.showEdgeLines) {
      const edgeLines = this.createEdgeLines();
      edgeLines.forEach(line => roadGroup.add(line));
    }

    return roadGroup;
  }

  /**
   * Generate smooth path from control points using Catmull-Rom spline
   */
  private generatePath(): void {
    const options = this.options as ProceduralRoadOptions;

    // Create curve from control points
    this.curve = new THREE.CatmullRomCurve3(
      options.controlPoints,
      false, // Not closed
      'catmullrom',
      options.tension || 0.5
    );

    // Sample curve at regular intervals
    const segments = options.segments || 100;
    this.pathPoints = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.curve.getPoint(t);

      // Get terrain height at this point
      if (this.terrainNavigator) {
        const terrainHeight = this.terrainNavigator.getHeightAt(point);
        if (terrainHeight !== null) {
          point.y = terrainHeight + (options.heightOffset || 0.1);
        }
      }

      this.pathPoints.push(point);
    }
  }

  /**
   * Create the main road surface mesh
   */
  private createRoadSurface(): THREE.Mesh | null {
    if (this.pathPoints.length < 2 || !this.curve) {
      return null;
    }

    const options = this.options as ProceduralRoadOptions;
    const width = options.width || 6;
    const halfWidth = width / 2;

    // Create vertices for road ribbon
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < this.pathPoints.length; i++) {
      const point = this.pathPoints[i];
      const t = i / (this.pathPoints.length - 1);

      // Get tangent for perpendicular calculation
      const tangent = this.curve.getTangent(t).normalize();

      // Calculate perpendicular vector (cross with up)
      const perpendicular = new THREE.Vector3()
        .crossVectors(tangent, new THREE.Vector3(0, 1, 0))
        .normalize();

      // Create left and right edge points
      const leftPoint = point.clone().add(perpendicular.clone().multiplyScalar(halfWidth));
      const rightPoint = point.clone().sub(perpendicular.clone().multiplyScalar(halfWidth));

      // Adjust heights to terrain if needed
      if (this.terrainNavigator) {
        const leftHeight = this.terrainNavigator.getHeightAt(leftPoint);
        const rightHeight = this.terrainNavigator.getHeightAt(rightPoint);

        if (leftHeight !== null) {
          leftPoint.y = leftHeight + (options.heightOffset || 0.1);
        }
        if (rightHeight !== null) {
          rightPoint.y = rightHeight + (options.heightOffset || 0.1);
        }
      }

      // Add vertices
      vertices.push(leftPoint.x, leftPoint.y, leftPoint.z);
      vertices.push(rightPoint.x, rightPoint.y, rightPoint.z);

      // Add UVs
      const vCoord = i / (this.pathPoints.length - 1);
      uvs.push(0, vCoord);
      uvs.push(1, vCoord);

      // Create triangles (except for last segment)
      if (i < this.pathPoints.length - 1) {
        const baseIndex = i * 2;

        // Triangle 1
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);

        // Triangle 2
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
      }
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // Create material
    const material = resourceManager.getOrCreateMaterial(
      `road_surface_${options.roadColor}_${options.roughness}_${options.metalness}_${options.opacity}_${options.transparent}`,
      () => new THREE.MeshStandardMaterial({
        color: options.roadColor,
        roughness: options.roughness || 0.9,
        metalness: options.metalness || 0.0,
        opacity: options.opacity ?? 1.0,
        transparent: options.transparent ?? false,
        side: THREE.DoubleSide,
      })
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = this.options.castShadow ?? true;
    mesh.receiveShadow = this.options.receiveShadow ?? true;

    return mesh;
  }

  /**
   * Create center line marking
   */
  private createCenterLine(): THREE.Line | null {
    if (this.pathPoints.length < 2) {
      return null;
    }

    const options = this.options as ProceduralRoadOptions;
    const lineVertices: number[] = [];

    // Create dashed center line
    for (let i = 0; i < this.pathPoints.length; i++) {
      const point = this.pathPoints[i];

      // Create dashed effect - only add points for visible segments
      const dashLength = 3; // meters
      const gapLength = 3; // meters
      const totalLength = dashLength + gapLength;
      const distance = i * (this.getRoadLength() / this.pathPoints.length);
      const posInCycle = distance % totalLength;

      if (posInCycle < dashLength) {
        lineVertices.push(point.x, point.y + 0.02, point.z); // Slightly above road
      } else if (lineVertices.length > 0 && posInCycle >= dashLength) {
        // End of dash segment, create line
        if (lineVertices.length >= 6) { // At least 2 points
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute([...lineVertices], 3));

          const material = new THREE.LineBasicMaterial({
            color: options.lineColor,
            linewidth: 2,
          });

          const line = new THREE.Line(geometry, material);
          return line; // Simplified: return first dash segment
        }
      }
    }

    // Create full center line as fallback
    const allVertices: number[] = [];
    for (const point of this.pathPoints) {
      allVertices.push(point.x, point.y + 0.02, point.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));

    const material = new THREE.LineBasicMaterial({
      color: options.lineColor,
      linewidth: 2,
    });

    return new THREE.Line(geometry, material);
  }

  /**
   * Create edge line markings (white lines on sides)
   */
  private createEdgeLines(): THREE.Line[] {
    if (this.pathPoints.length < 2 || !this.curve) {
      return [];
    }

    const options = this.options as ProceduralRoadOptions;
    const width = options.width || 6;
    const halfWidth = width / 2;
    const lines: THREE.Line[] = [];

    // Create left and right edge lines
    for (const side of [-1, 1]) {
      const edgeVertices: number[] = [];

      for (let i = 0; i < this.pathPoints.length; i++) {
        const point = this.pathPoints[i];
        const t = i / (this.pathPoints.length - 1);

        const tangent = this.curve.getTangent(t).normalize();
        const perpendicular = new THREE.Vector3()
          .crossVectors(tangent, new THREE.Vector3(0, 1, 0))
          .normalize();

        const edgePoint = point.clone().add(
          perpendicular.clone().multiplyScalar(halfWidth * 0.9 * side)
        );

        edgeVertices.push(edgePoint.x, edgePoint.y + 0.02, edgePoint.z);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));

      const material = new THREE.LineBasicMaterial({
        color: '#FFFFFF', // White edge lines
        linewidth: 1,
      });

      lines.push(new THREE.Line(geometry, material));
    }

    return lines;
  }

  /**
   * Calculate approximate road length
   */
  private getRoadLength(): number {
    if (!this.curve) {
      return 0;
    }
    return this.curve.getLength();
  }

  /**
   * Get point on road at specific distance along path
   */
  public getPointAtDistance(distance: number): THREE.Vector3 | null {
    if (!this.curve) {
      return null;
    }

    const length = this.curve.getLength();
    const t = Math.min(Math.max(distance / length, 0), 1);
    return this.curve.getPoint(t);
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as ProceduralRoadOptions;

    if (!options.controlPoints || options.controlPoints.length < 2) {
      issues.push('At least 2 control points are required');
    }

    if (!options.terrain) {
      issues.push('Terrain mesh is required');
    }

    if (options.width && options.width <= 0) {
      issues.push('Road width must be greater than 0');
    }

    if (options.segments && options.segments < 10) {
      issues.push('Segments must be at least 10 for smooth curves');
    }

    if (options.tension && (options.tension < 0 || options.tension > 1)) {
      issues.push('Tension must be between 0 and 1');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as ProceduralRoadOptions;

    return {
      name: 'ProceduralRoad',
      version: '1.0.0',
      type: 'infrastructure',
      subtype: 'road',
      controlPoints: options.controlPoints?.length || 0,
      roadLength: this.getRoadLength(),
      width: options.width,
      segments: options.segments,
      roadColor: options.roadColor,
      showCenterLine: options.showCenterLine,
      showEdgeLines: options.showEdgeLines,
    };
  }

  public override dispose(): void {
    if (this.terrainNavigator) {
      this.terrainNavigator.dispose();
      this.terrainNavigator = null;
    }

    this.curve = null;
    this.pathPoints = [];

    super.dispose();
  }
}

export default ProceduralRoad;
