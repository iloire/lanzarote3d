import * as THREE from 'three';
import { TakeoffLocation, LandingZone, FlightPhase } from '../types/flyzone-types';

/**
 * FlyzoneMarkers - Visual markers for flyzone elements in 3D scene
 *
 * Provides 3D markers for:
 * - Takeoff locations (launch points)
 * - Landing zones (landing areas)
 * - Flight phases (soaring areas)
 * - Wind direction indicators
 * - Interactive hover and selection states
 */
export class FlyzoneMarkers {
  private scene: THREE.Scene;
  private markers: Map<string, THREE.Object3D> = new Map();
  private materials: Map<string, THREE.Material> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeMaterials();
  }

  private initializeMaterials(): void {
    // Takeoff marker material - green with emission
    this.materials.set('takeoff', new THREE.MeshLambertMaterial({
      color: 0x00ff00,
      emissive: 0x004400,
      transparent: true,
      opacity: 0.8,
    }));

    // Landing marker material - blue with emission
    this.materials.set('landing', new THREE.MeshLambertMaterial({
      color: 0x0088ff,
      emissive: 0x002244,
      transparent: true,
      opacity: 0.8,
    }));

    // Flight phase material - yellow/orange
    this.materials.set('phase', new THREE.MeshLambertMaterial({
      color: 0xffaa00,
      emissive: 0x442200,
      transparent: true,
      opacity: 0.6,
    }));

    // Selected state material - bright white
    this.materials.set('selected', new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0x444444,
      transparent: true,
      opacity: 0.9,
    }));

    // Wind direction material - red
    this.materials.set('wind', new THREE.MeshLambertMaterial({
      color: 0xff4444,
      emissive: 0x220000,
    }));
  }

  public addTakeoffMarker(takeoff: TakeoffLocation): void {
    const group = new THREE.Group();
    group.userData = { type: 'takeoff', id: takeoff.id, data: takeoff };

    // Main marker - vertical cylinder
    const markerGeometry = new THREE.CylinderGeometry(20, 30, 100, 8);
    const markerMesh = new THREE.Mesh(markerGeometry, this.materials.get('takeoff'));
    markerMesh.position.y = 50; // Half height above ground
    group.add(markerMesh);

    // Top indicator - cone pointing up
    const coneGeometry = new THREE.ConeGeometry(15, 40, 6);
    const coneMesh = new THREE.Mesh(coneGeometry, this.materials.get('takeoff'));
    coneMesh.position.y = 120;
    group.add(coneMesh);

    // Wind direction indicators
    if (takeoff.windConditions && takeoff.windConditions.length > 0) {
      takeoff.windConditions.forEach((condition, index) => {
        const windArrow = this.createWindDirectionArrow(condition.direction.ideal);
        windArrow.position.y = 10 + (index * 20);
        windArrow.position.x = Math.cos(index * Math.PI * 2 / takeoff.windConditions.length) * 40;
        windArrow.position.z = Math.sin(index * Math.PI * 2 / takeoff.windConditions.length) * 40;
        group.add(windArrow);
      });
    }

    // Position the group
    group.position.copy(takeoff.position);

    // Add label (would be implemented with CSS2DRenderer or similar)
    const label = this.createLabel(takeoff.title, 'takeoff');
    label.position.y = 150;
    group.add(label);

    this.scene.add(group);
    this.markers.set(takeoff.id, group);

    console.log(`Added takeoff marker: ${takeoff.title} at ${takeoff.position.x}, ${takeoff.position.z}`);
  }

  public addLandingMarker(landing: LandingZone): void {
    const group = new THREE.Group();
    group.userData = { type: 'landing', id: landing.id, data: landing };

    // Landing zone outline - rectangle on ground
    const width = landing.size.width;
    const length = landing.size.length;

    // Create landing zone boundary
    const boundaryGeometry = new THREE.PlaneGeometry(width, length);
    const boundaryMesh = new THREE.Mesh(boundaryGeometry, this.materials.get('landing'));
    boundaryMesh.rotation.x = -Math.PI / 2; // Lay flat on ground
    boundaryMesh.position.y = 2; // Slightly above terrain
    group.add(boundaryMesh);

    // Corner markers
    const cornerPositions = [
      { x: -width / 2, z: -length / 2 },
      { x: width / 2, z: -length / 2 },
      { x: width / 2, z: length / 2 },
      { x: -width / 2, z: length / 2 },
    ];

    cornerPositions.forEach(pos => {
      const cornerGeometry = new THREE.CylinderGeometry(5, 8, 30, 6);
      const cornerMesh = new THREE.Mesh(cornerGeometry, this.materials.get('landing'));
      cornerMesh.position.set(pos.x, 15, pos.z);
      group.add(cornerMesh);
    });

    // Approach direction indicator
    const approachDirection = landing.approach.preferredDirection;
    const approachArrow = this.createApproachArrow(approachDirection);
    approachArrow.position.y = 20;
    group.add(approachArrow);

    // Wind limitation indicators
    if (landing.windLimitations.unsafeDirections.length > 0) {
      landing.windLimitations.unsafeDirections.forEach(direction => {
        const warningIndicator = this.createWarningIndicator(direction);
        warningIndicator.position.y = 25;
        group.add(warningIndicator);
      });
    }

    // Position the group
    group.position.copy(landing.position);

    // Add label
    const label = this.createLabel(landing.title, 'landing');
    label.position.y = 40;
    group.add(label);

    this.scene.add(group);
    this.markers.set(landing.id, group);

    console.log(`Added landing marker: ${landing.title} at ${landing.position.x}, ${landing.position.z}`);
  }

  public addFlightPhaseMarker(phase: FlightPhase): void {
    const group = new THREE.Group();
    group.userData = { type: 'phase', id: phase.id, data: phase };

    // Flight phase volume - wireframe box
    const { width, height, length } = phase.dimensions;
    const phaseGeometry = new THREE.BoxGeometry(width, height, length);
    const wireframe = new THREE.WireframeGeometry(phaseGeometry);
    const phaseMesh = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.6,
    }));

    phaseMesh.position.y = height / 2; // Center vertically
    group.add(phaseMesh);

    // Phase type indicator
    const typeIndicator = this.createPhaseTypeIndicator(phase.type);
    typeIndicator.position.y = height + 20;
    group.add(typeIndicator);

    // Altitude range indicators
    const minAltLine = this.createAltitudeLine(phase.altitudeRange.min, width, length);
    const maxAltLine = this.createAltitudeLine(phase.altitudeRange.max, width, length);

    minAltLine.position.y = phase.altitudeRange.min - phase.position.y;
    maxAltLine.position.y = phase.altitudeRange.max - phase.position.y;

    group.add(minAltLine);
    group.add(maxAltLine);

    // Position the group
    group.position.copy(phase.position);

    // Add label
    const label = this.createLabel(`${phase.type} - ${phase.description}`, 'phase');
    label.position.y = height + 50;
    group.add(label);

    this.scene.add(group);
    this.markers.set(phase.id, group);

    console.log(`Added flight phase marker: ${phase.type} at ${phase.position.x}, ${phase.position.z}`);
  }

  private createWindDirectionArrow(direction: number): THREE.Group {
    const group = new THREE.Group();

    // Arrow shaft
    const shaftGeometry = new THREE.CylinderGeometry(2, 2, 30, 6);
    const shaftMesh = new THREE.Mesh(shaftGeometry, this.materials.get('wind'));
    group.add(shaftMesh);

    // Arrow head
    const headGeometry = new THREE.ConeGeometry(6, 15, 6);
    const headMesh = new THREE.Mesh(headGeometry, this.materials.get('wind'));
    headMesh.position.y = 22;
    group.add(headMesh);

    // Rotate to point in wind direction
    group.rotation.z = -Math.PI / 2; // Horizontal
    group.rotation.y = (direction * Math.PI) / 180; // Convert degrees to radians

    return group;
  }

  private createApproachArrow(direction: number): THREE.Group {
    const group = new THREE.Group();

    // Wider, flatter arrow for approach direction
    const shaftGeometry = new THREE.BoxGeometry(40, 5, 10);
    const shaftMesh = new THREE.Mesh(shaftGeometry, this.materials.get('landing'));
    group.add(shaftMesh);

    // Arrow head
    const headGeometry = new THREE.ConeGeometry(15, 20, 3);
    const headMesh = new THREE.Mesh(headGeometry, this.materials.get('landing'));
    headMesh.position.x = 30;
    headMesh.rotation.z = -Math.PI / 2;
    group.add(headMesh);

    // Rotate to point in approach direction
    group.rotation.y = (direction * Math.PI) / 180;

    return group;
  }

  private createWarningIndicator(direction: number): THREE.Object3D {
    // Red warning cone for unsafe wind directions
    const geometry = new THREE.ConeGeometry(8, 20, 6);
    const material = new THREE.MeshLambertMaterial({
      color: 0xff0000,
      emissive: 0x440000,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Position based on direction
    const distance = 60;
    mesh.position.x = Math.cos(direction * Math.PI / 180) * distance;
    mesh.position.z = Math.sin(direction * Math.PI / 180) * distance;

    return mesh;
  }

  private createPhaseTypeIndicator(type: string): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    switch (type) {
      case 'thermal':
        geometry = new THREE.SphereGeometry(15, 8, 6);
        break;
      case 'ridge':
        geometry = new THREE.BoxGeometry(40, 10, 15);
        break;
      case 'approach':
        geometry = new THREE.ConeGeometry(15, 25, 6);
        break;
      default:
        geometry = new THREE.OctahedronGeometry(12);
    }

    return new THREE.Mesh(geometry, this.materials.get('phase'));
  }

  private createAltitudeLine(altitude: number, width: number, length: number): THREE.Line {
    const points = [
      new THREE.Vector3(-width / 2, 0, -length / 2),
      new THREE.Vector3(width / 2, 0, -length / 2),
      new THREE.Vector3(width / 2, 0, length / 2),
      new THREE.Vector3(-width / 2, 0, length / 2),
      new THREE.Vector3(-width / 2, 0, -length / 2),
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });

    return new THREE.Line(geometry, material);
  }

  private createLabel(text: string, type: string): THREE.Mesh {
    // Simple text label using canvas texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    // Background
    context.fillStyle = type === 'takeoff' ? '#004400' : type === 'landing' ? '#002244' : '#442200';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    context.fillStyle = '#ffffff';
    context.font = 'Bold 20px Arial';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 7);

    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });

    // Create mesh
    const geometry = new THREE.PlaneGeometry(80, 20);
    const mesh = new THREE.Mesh(geometry, material);

    // Billboard effect - always face camera
    mesh.userData.billboard = true;

    return mesh;
  }

  public removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker) {
      this.scene.remove(marker);
      this.markers.delete(id);

      // Dispose of geometries and materials
      marker.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material && !this.materials.has(child.material.uuid)) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
  }

  public selectMarker(id: string): void {
    // Highlight selected marker
    const marker = this.markers.get(id);
    if (marker) {
      marker.traverse(child => {
        if (child instanceof THREE.Mesh && child.material !== this.materials.get('selected')) {
          child.userData.originalMaterial = child.material;
          child.material = this.materials.get('selected')!;
        }
      });
    }
  }

  public deselectMarker(id: string): void {
    // Restore original material
    const marker = this.markers.get(id);
    if (marker) {
      marker.traverse(child => {
        if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
          delete child.userData.originalMaterial;
        }
      });
    }
  }

  public update(): void {
    // Update billboard labels to face camera
    this.markers.forEach(marker => {
      marker.traverse(child => {
        if (child.userData.billboard && child instanceof THREE.Mesh) {
          // This would require camera reference to implement billboard effect
          // For now, just a placeholder
        }
      });
    });
  }

  public clear(): void {
    // Remove all markers
    this.markers.forEach((marker, id) => {
      this.removeMarker(id);
    });
    this.markers.clear();
  }

  public getMarkerAtPosition(position: THREE.Vector3, tolerance: number = 50): string | null {
    // Find marker within tolerance distance
    for (const [id, marker] of this.markers) {
      const distance = marker.position.distanceTo(position);
      if (distance <= tolerance) {
        return id;
      }
    }
    return null;
  }

  public dispose(): void {
    this.clear();

    // Dispose of materials
    this.materials.forEach(material => {
      material.dispose();
    });
    this.materials.clear();
  }
}