import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface DomeOptions extends SimpleComponentOptions {
  frameColor?: string;
  glassColor?: string;
  baseColor?: string;
  radius?: number;
  scale?: number;
  panelRows?: number;
  panelColumns?: number;
}

/**
 * Dome building component - Glass panel geodesic dome for glamping/sleeping
 */
export class Dome extends SimpleThreeComponent {
  constructor(options: DomeOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Dome',
      version: '1.0.0',
      description: 'Glass panel geodesic dome structure for glamping and accommodation',
      tags: ['scenery', 'building', 'dome', 'geodesic', 'accommodation', 'modern'],
    };

    super(metadata, {
      frameColor: '#C0C0C0', // Silver for metal frame
      glassColor: '#87CEEB', // Sky blue tinted glass
      baseColor: '#696969', // Dim gray for base platform
      radius: 8,
      scale: 1,
      panelRows: 8,
      panelColumns: 16,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const dome = new THREE.Group();
    dome.name = 'Dome';

    const options = this.options as DomeOptions;
    const scale = options.scale || 1;
    const radius = options.radius || 8;
    const panelRows = Math.max(4, Math.min(12, options.panelRows || 8));
    const panelColumns = Math.max(8, Math.min(24, options.panelColumns || 16));

    // Create materials with resource sharing
    const frameMaterial = resourceManager.getOrCreateMaterial(
      `dome_frame_${options.frameColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.frameColor })
    );

    const glassMaterial = resourceManager.getOrCreateMaterial(
      `dome_glass_${options.glassColor}`,
      () => new THREE.MeshLambertMaterial({
        color: options.glassColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
    );

    const baseMaterial = resourceManager.getOrCreateMaterial(
      `dome_base_${options.baseColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.baseColor })
    );

    // Create base platform
    const baseGeometry = resourceManager.getOrCreateGeometry(
      `dome_base_${radius}`,
      () => new THREE.CylinderGeometry(radius * 1.1, radius * 1.2, 0.5, 32)
    );
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.25;
    base.castShadow = this.options.castShadow ?? true;
    base.receiveShadow = this.options.receiveShadow ?? true;
    dome.add(base);

    // Create geodesic dome structure
    // Using a more-than-half sphere (about 60% of a full sphere)
    const phiStart = 0;
    const phiLength = Math.PI * 2;
    const thetaStart = 0;
    const thetaLength = Math.PI * 0.6; // 60% of hemisphere for sleeping dome

    // Create frame structure
    for (let row = 0; row <= panelRows; row++) {
      const theta = (row / panelRows) * thetaLength;
      const y = Math.cos(theta) * radius;
      const ringRadius = Math.sin(theta) * radius;

      // Horizontal rings
      if (row < panelRows) {
        const ringGeometry = resourceManager.getOrCreateGeometry(
          `dome_ring_${row}_${radius}_${ringRadius}`,
          () => new THREE.TorusGeometry(ringRadius, 0.1, 8, panelColumns)
        );
        const ring = new THREE.Mesh(ringGeometry, frameMaterial);
        ring.position.y = y;
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = this.options.castShadow ?? true;
        dome.add(ring);
      }

      // Vertical struts and glass panels
      for (let col = 0; col < panelColumns; col++) {
        const phi = (col / panelColumns) * phiLength;

        // Calculate positions
        const x = ringRadius * Math.cos(phi);
        const z = ringRadius * Math.sin(phi);

        // Vertical struts (from this ring to next)
        if (row < panelRows) {
          const nextTheta = ((row + 1) / panelRows) * thetaLength;
          const nextY = Math.cos(nextTheta) * radius;
          const nextRingRadius = Math.sin(nextTheta) * radius;
          const nextX = nextRingRadius * Math.cos(phi);
          const nextZ = nextRingRadius * Math.sin(phi);

          const strutLength = Math.sqrt(
            Math.pow(nextX - x, 2) +
            Math.pow(nextY - y, 2) +
            Math.pow(nextZ - z, 2)
          );

          const strutGeometry = resourceManager.getOrCreateGeometry(
            `dome_strut_${row}_${col}`,
            () => new THREE.CylinderGeometry(0.1, 0.1, strutLength)
          );

          const strut = new THREE.Mesh(strutGeometry, frameMaterial);
          strut.position.set(
            (x + nextX) / 2,
            (y + nextY) / 2,
            (z + nextZ) / 2
          );

          // Orient strut to connect the two points
          const direction = new THREE.Vector3(nextX - x, nextY - y, nextZ - z).normalize();
          const axis = new THREE.Vector3(0, 1, 0);
          strut.quaternion.setFromUnitVectors(axis, direction);

          strut.castShadow = this.options.castShadow ?? true;
          dome.add(strut);

          // Add glass panel
          if (col < panelColumns - 1) {
            const nextColPhi = ((col + 1) / panelColumns) * phiLength;
            const panelVertices = [
              new THREE.Vector3(x, y, z),
              new THREE.Vector3(ringRadius * Math.cos(nextColPhi), y, ringRadius * Math.sin(nextColPhi)),
              new THREE.Vector3(nextRingRadius * Math.cos(nextColPhi), nextY, nextRingRadius * Math.sin(nextColPhi)),
              new THREE.Vector3(nextX, nextY, nextZ)
            ];

            const panelGeometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
              panelVertices[0].x, panelVertices[0].y, panelVertices[0].z,
              panelVertices[1].x, panelVertices[1].y, panelVertices[1].z,
              panelVertices[2].x, panelVertices[2].y, panelVertices[2].z,
              panelVertices[0].x, panelVertices[0].y, panelVertices[0].z,
              panelVertices[2].x, panelVertices[2].y, panelVertices[2].z,
              panelVertices[3].x, panelVertices[3].y, panelVertices[3].z,
            ]);
            panelGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            panelGeometry.computeVertexNormals();

            const panel = new THREE.Mesh(panelGeometry, glassMaterial);
            dome.add(panel);
          }
        }

        // Add diagonal struts for structural stability
        if (row > 0 && row < panelRows && col % 2 === 0) {
          const diagCol = (col + 1) % panelColumns;
          const diagPhi = (diagCol / panelColumns) * phiLength;
          const prevTheta = ((row - 1) / panelRows) * thetaLength;
          const prevY = Math.cos(prevTheta) * radius;
          const prevRingRadius = Math.sin(prevTheta) * radius;
          const diagX = prevRingRadius * Math.cos(diagPhi);
          const diagZ = prevRingRadius * Math.sin(diagPhi);

          const diagLength = Math.sqrt(
            Math.pow(x - diagX, 2) +
            Math.pow(y - prevY, 2) +
            Math.pow(z - diagZ, 2)
          );

          const diagGeometry = resourceManager.getOrCreateGeometry(
            `dome_diag_${row}_${col}`,
            () => new THREE.CylinderGeometry(0.05, 0.05, diagLength)
          );

          const diag = new THREE.Mesh(diagGeometry, frameMaterial);
          diag.position.set(
            (x + diagX) / 2,
            (y + prevY) / 2,
            (z + diagZ) / 2
          );

          const diagDirection = new THREE.Vector3(x - diagX, y - prevY, z - diagZ).normalize();
          const axis = new THREE.Vector3(0, 1, 0);
          diag.quaternion.setFromUnitVectors(axis, diagDirection);

          diag.castShadow = this.options.castShadow ?? true;
          dome.add(diag);
        }
      }
    }

    // Add entrance door frame
    const doorWidth = 2;
    const doorHeight = 2.5;
    const doorFrameGeometry = resourceManager.getOrCreateGeometry(
      'dome_door_frame',
      () => new THREE.BoxGeometry(doorWidth + 0.4, doorHeight, 0.4)
    );

    const doorFrame = new THREE.Mesh(doorFrameGeometry, frameMaterial);
    doorFrame.position.set(0, doorHeight/2, radius);
    doorFrame.castShadow = this.options.castShadow ?? true;
    dome.add(doorFrame);

    // Add door
    const doorMaterial = resourceManager.getOrCreateMaterial(
      'dome_door',
      () => new THREE.MeshLambertMaterial({
        color: options.glassColor,
        transparent: true,
        opacity: 0.5
      })
    );

    const doorGeometry = resourceManager.getOrCreateGeometry(
      'dome_door',
      () => new THREE.BoxGeometry(doorWidth, doorHeight - 0.2, 0.2)
    );

    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, doorHeight/2, radius);
    dome.add(door);

    // Add interior floor
    const floorGeometry = resourceManager.getOrCreateGeometry(
      `dome_floor_${radius}`,
      () => new THREE.CircleGeometry(radius * 0.95, 32)
    );

    const floorMaterial = resourceManager.getOrCreateMaterial(
      'dome_floor',
      () => new THREE.MeshLambertMaterial({ color: '#8B7355' }) // Tan/wood color
    );

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.1;
    floor.receiveShadow = this.options.receiveShadow ?? true;
    dome.add(floor);

    // Add ventilation cap at top
    const ventGeometry = resourceManager.getOrCreateGeometry(
      'dome_vent',
      () => new THREE.ConeGeometry(0.8, 1.5, 8)
    );

    const vent = new THREE.Mesh(ventGeometry, frameMaterial);
    vent.position.y = radius * 0.95;
    vent.castShadow = this.options.castShadow ?? true;
    dome.add(vent);

    // Add bed inside dome for sleeping
    const bedFrameGeometry = resourceManager.getOrCreateGeometry(
      'dome_bed_frame',
      () => new THREE.BoxGeometry(4, 0.8, 6)
    );

    const bedMaterial = resourceManager.getOrCreateMaterial(
      'dome_bed',
      () => new THREE.MeshLambertMaterial({ color: '#8B4513' }) // Brown wood frame
    );

    const bedFrame = new THREE.Mesh(bedFrameGeometry, bedMaterial);
    bedFrame.position.set(0, 0.4, 0);
    bedFrame.castShadow = this.options.castShadow ?? true;
    bedFrame.receiveShadow = this.options.receiveShadow ?? true;
    dome.add(bedFrame);

    // Add mattress
    const mattressGeometry = resourceManager.getOrCreateGeometry(
      'dome_mattress',
      () => new THREE.BoxGeometry(3.8, 0.5, 5.8)
    );

    const mattressMaterial = resourceManager.getOrCreateMaterial(
      'dome_mattress',
      () => new THREE.MeshLambertMaterial({ color: '#FFFFFF' }) // White mattress
    );

    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
    mattress.position.set(0, 1.05, 0);
    mattress.castShadow = this.options.castShadow ?? true;
    mattress.receiveShadow = this.options.receiveShadow ?? true;
    dome.add(mattress);

    // Add pillows
    for (let i = 0; i < 2; i++) {
      const pillowGeometry = resourceManager.getOrCreateGeometry(
        `dome_pillow_${i}`,
        () => new THREE.BoxGeometry(1, 0.3, 1.5)
      );

      const pillowMaterial = resourceManager.getOrCreateMaterial(
        'dome_pillow',
        () => new THREE.MeshLambertMaterial({ color: '#F0F8FF' }) // Alice blue
      );

      const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
      pillow.position.set((i - 0.5) * 1.5, 1.45, -2);
      pillow.castShadow = this.options.castShadow ?? true;
      pillow.receiveShadow = this.options.receiveShadow ?? true;
      dome.add(pillow);
    }

    // Apply scale
    if (scale !== 1) {
      dome.scale.setScalar(scale);
    }

    return dome;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as DomeOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.radius && options.radius <= 0) {
      issues.push('Radius must be greater than 0');
    }

    if (options.panelRows && (options.panelRows < 4 || options.panelRows > 12)) {
      issues.push('Panel rows must be between 4 and 12');
    }

    if (options.panelColumns && (options.panelColumns < 8 || options.panelColumns > 24)) {
      issues.push('Panel columns must be between 8 and 24');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as DomeOptions;

    return {
      name: 'Dome',
      version: '1.0.0',
      type: 'building',
      subtype: 'accommodation',
      style: 'geodesic',
      radius: options.radius,
      frameColor: options.frameColor,
      glassColor: options.glassColor,
      panelConfiguration: {
        rows: options.panelRows,
        columns: options.panelColumns
      },
      scale: options.scale,
    };
  }
}

export default Dome;