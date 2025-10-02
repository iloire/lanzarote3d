import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';
import { logger } from '../../utils/logger';

/**
 * A preset camera viewpoint for showcase applications
 */
export interface CameraViewpoint {
  name: string;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  metadata?: Record<string, unknown>;
}

/**
 * ShowcaseCameraController - Reusable camera system for component showcases
 *
 * Designed for static showcases (buildings, vehicles, props, etc.) where you want
 * preset camera viewpoints rather than object-following behavior.
 *
 * Features:
 * - Named viewpoints with position + lookAt
 * - Sequential navigation (next/previous)
 * - Direct jump to any viewpoint
 * - Optional GUI integration
 * - Smooth camera transitions
 * - Overview/reset position support
 *
 * Use cases:
 * - Buildings showcase (view each building type)
 * - Vehicles showcase (view each vehicle)
 * - Props/furniture showcase
 * - Character showcase
 * - LOD comparison views
 */
export class ShowcaseCameraController {
  private viewpoints: CameraViewpoint[] = [];
  private currentIndex: number = -1;
  private camera?: THREE.Camera;
  private controls?: OrbitControls;
  private overviewPosition?: { position: THREE.Vector3; lookAt: THREE.Vector3 };

  constructor(camera?: THREE.Camera, controls?: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
  }

  /**
   * Set camera and controls references
   */
  public setCamera(camera: THREE.Camera, controls?: OrbitControls): void {
    this.camera = camera;
    this.controls = controls;
  }

  /**
   * Add a camera viewpoint
   * @returns The index of the added viewpoint
   */
  public addViewpoint(name: string, position: THREE.Vector3, lookAt: THREE.Vector3, metadata?: Record<string, unknown>): number {
    const index = this.viewpoints.length;
    this.viewpoints.push({ name, position, lookAt, metadata });
    return index;
  }

  /**
   * Add a viewpoint based on an object's position
   * Automatically calculates camera position offset
   */
  public addViewpointForObject(
    name: string,
    objectPosition: THREE.Vector3,
    offset: { distance: number; height: number; angle?: number },
    metadata?: Record<string, unknown>
  ): number {
    const angle = offset.angle || 0;
    const cameraPosition = new THREE.Vector3(
      objectPosition.x + offset.distance * Math.cos(angle),
      objectPosition.y + offset.height,
      objectPosition.z + offset.distance * Math.sin(angle)
    );

    return this.addViewpoint(name, cameraPosition, objectPosition.clone(), metadata);
  }

  /**
   * Set the overview/reset position
   */
  public setOverview(position: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.overviewPosition = { position, lookAt };
  }

  /**
   * Move camera to specific viewpoint index
   */
  public moveToViewpoint(index: number, instant: boolean = false): void {
    if (!this.camera || index < 0 || index >= this.viewpoints.length) {
      logger.warn(`Invalid viewpoint index: ${index}`);
      return;
    }

    const viewpoint = this.viewpoints[index];
    this.currentIndex = index;

    if (instant) {
      this.camera.position.copy(viewpoint.position);
      this.camera.lookAt(viewpoint.lookAt);
      if (this.controls) {
        this.controls.target.copy(viewpoint.lookAt);
        this.controls.update();
      }
    } else {
      // Smooth transition - you could add animation here
      // For now, instant transition (future: integrate with animator)
      this.camera.position.copy(viewpoint.position);
      this.camera.lookAt(viewpoint.lookAt);
      if (this.controls) {
        this.controls.target.copy(viewpoint.lookAt);
        this.controls.update();
      }
    }

    logger.info(`📷 Camera moved to: ${viewpoint.name}`);
  }

  /**
   * Move to overview position
   */
  public moveToOverview(): void {
    if (!this.camera || !this.overviewPosition) {
      logger.warn('No overview position set');
      return;
    }

    this.currentIndex = -1;
    this.camera.position.copy(this.overviewPosition.position);
    this.camera.lookAt(this.overviewPosition.lookAt);

    if (this.controls) {
      this.controls.target.copy(this.overviewPosition.lookAt);
      this.controls.update();
    }

    logger.info('📷 Camera moved to: Overview');
  }

  /**
   * Move to next viewpoint (wraps around)
   */
  public next(): void {
    if (this.viewpoints.length === 0) return;
    const nextIndex = (this.currentIndex + 1) % this.viewpoints.length;
    this.moveToViewpoint(nextIndex);
  }

  /**
   * Move to previous viewpoint (wraps around)
   */
  public previous(): void {
    if (this.viewpoints.length === 0) return;
    const prevIndex = (this.currentIndex - 1 + this.viewpoints.length) % this.viewpoints.length;
    this.moveToViewpoint(prevIndex);
  }

  /**
   * Get all viewpoint names
   */
  public getViewpointNames(): string[] {
    return this.viewpoints.map(v => v.name);
  }

  /**
   * Get current viewpoint
   */
  public getCurrentViewpoint(): CameraViewpoint | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.viewpoints.length) {
      return this.viewpoints[this.currentIndex];
    }
    return null;
  }

  /**
   * Create GUI controls for camera navigation
   */
  public createGUI(gui: GUI, folderName: string = 'Camera Navigation'): void {
    const folder = gui.addFolder(folderName);

    const controls = {
      viewpoint: 'Overview',
      previous: () => this.previous(),
      next: () => this.next()
    };

    // Create dropdown with viewpoint names
    const viewpointNames = ['Overview', ...this.getViewpointNames()];
    folder.add(controls, 'viewpoint', viewpointNames).name('Jump to')
      .onChange((value: string) => {
        if (value === 'Overview') {
          this.moveToOverview();
        } else {
          const index = this.viewpoints.findIndex(v => v.name === value);
          if (index !== -1) {
            this.moveToViewpoint(index);
          }
        }
      });

    folder.add(controls, 'previous').name('⬅ Previous');
    folder.add(controls, 'next').name('Next ➡');
    folder.open();
  }

  /**
   * Get viewpoint count
   */
  public getViewpointCount(): number {
    return this.viewpoints.length;
  }

  /**
   * Clear all viewpoints
   */
  public clear(): void {
    this.viewpoints = [];
    this.currentIndex = -1;
  }
}
