import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';
import { logger } from '../../utils/logger';

export interface CameraViewpoint {
  name: string;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

export class ShowcaseCameraController {
  private viewpoints: CameraViewpoint[] = [];
  private currentIndex: number = -1;
  private camera?: THREE.Camera;
  private controls?: OrbitControls;
  private overviewPosition?: { position: THREE.Vector3; lookAt: THREE.Vector3 };

  public setCamera(camera: THREE.Camera, controls?: OrbitControls): void {
    this.camera = camera;
    this.controls = controls;
  }

  public addViewpoint(name: string, position: THREE.Vector3, lookAt: THREE.Vector3): number {
    return this.viewpoints.push({ name, position, lookAt }) - 1;
  }

  public setOverview(position: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.overviewPosition = { position, lookAt };
  }

  public moveToViewpoint(index: number): void {
    if (!this.camera || index < 0 || index >= this.viewpoints.length) return;
    
    const viewpoint = this.viewpoints[index];
    this.currentIndex = index;
    this.camera.position.copy(viewpoint.position);
    this.camera.lookAt(viewpoint.lookAt);
    
    if (this.controls) {
      this.controls.target.copy(viewpoint.lookAt);
      this.controls.update();
    }
    
    logger.info(`📷 Camera moved to: ${viewpoint.name}`);
  }

  public moveToOverview(): void {
    if (!this.camera || !this.overviewPosition) return;
    
    this.currentIndex = -1;
    this.camera.position.copy(this.overviewPosition.position);
    this.camera.lookAt(this.overviewPosition.lookAt);
    
    if (this.controls) {
      this.controls.target.copy(this.overviewPosition.lookAt);
      this.controls.update();
    }
  }

  public next(): void {
    if (this.viewpoints.length === 0) return;
    this.moveToViewpoint((this.currentIndex + 1) % this.viewpoints.length);
  }

  public previous(): void {
    if (this.viewpoints.length === 0) return;
    this.moveToViewpoint((this.currentIndex - 1 + this.viewpoints.length) % this.viewpoints.length);
  }

  public getViewpointNames(): string[] {
    return this.viewpoints.map(v => v.name);
  }

  public createGUI(gui: GUI, folderName: string = 'Building Navigation'): void {
    const folder = gui.addFolder(folderName);
    
    const controls = {
      viewpoint: 'Overview',
      previous: () => this.previous(),
      next: () => this.next()
    };
    
    const viewpointNames = ['Overview', ...this.getViewpointNames()];
    folder.add(controls, 'viewpoint', viewpointNames).name('Jump to')
      .onChange((value: string) => {
        if (value === 'Overview') {
          this.moveToOverview();
        } else {
          const index = this.viewpoints.findIndex(v => v.name === value);
          if (index !== -1) this.moveToViewpoint(index);
        }
      });
    
    folder.add(controls, 'previous').name('⬅ Previous');
    folder.add(controls, 'next').name('Next ➡');
    folder.open();
  }
}
