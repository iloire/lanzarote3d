import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import birdModelUrl from '../../../../assets/foundation/models/environment/birds.glb';

export interface BirdOptions extends SimpleComponentOptions {
  wingSpan?: number;
  bodyLength?: number;
  wingBeatFrequency?: number;
  wingBeatAmplitude?: number;
}

/**
 * Base Bird class with wing animation
 * Uses GLB model for realistic bird appearance with procedural wing animation
 */
export abstract class Bird extends SimpleThreeComponent {
  protected mixer?: THREE.AnimationMixer;
  protected wingBeatClip?: THREE.AnimationClip;
  protected wingBeatAction?: THREE.AnimationAction;
  protected leftWing?: THREE.Object3D;
  protected rightWing?: THREE.Object3D;
  protected bodyMesh?: THREE.Object3D;
  protected birdModel?: THREE.Group;

  // Animation properties
  protected wingBeatTime: number = 0;

  constructor(metadata: ComponentMetadata, options: BirdOptions = {}) {
    super(metadata, {
      wingSpan: 2.0,
      bodyLength: 1.5,
      wingBeatFrequency: 2.0,
      wingBeatAmplitude: 0.5,
      ...options
    });
  }

  override async load(): Promise<THREE.Object3D> {
    // First call the parent load to get the base object
    this._object = await super.load();

    await this.loadBirdModel();
    this.setupWingAnimation();

    return this._object;
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Fallback geometry - will be replaced by loaded model
    return new THREE.BoxGeometry(1, 0.5, 2);
  }

  private async loadBirdModel(): Promise<void> {
    const loader = new GLTFLoader();

    try {
      console.log(`Loading bird model from: ${birdModelUrl}`);
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(birdModelUrl, resolve, undefined, reject);
      });

      this.birdModel = gltf.scene;
      console.log(`✅ Bird model loaded successfully for ${this._metadata.name}`);

      // Scale and position the model
      const scale = this.getModelScale();
      this.birdModel.scale.setScalar(scale);

      // Apply species-specific coloring
      this.applySpeciesColoring(this.birdModel);

      // Find wing meshes for animation
      this.findWingMeshes(this.birdModel);

      // Add to the main mesh
      if (this._object) {
        this._object.add(this.birdModel);

        // Debug: log model info
        const boundingBox = new THREE.Box3().setFromObject(this.birdModel);
        const size = boundingBox.getSize(new THREE.Vector3());
        console.log(`✅ Bird model added to scene for ${this._metadata.name}`);
        console.log(`📏 Model size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
        console.log(`📦 Scale: ${this.birdModel.scale.x.toFixed(2)}`);
      }

    } catch (error) {
      console.error('Failed to load bird model:', error);
      // Fallback to procedural geometry
      console.log(`🔧 Creating fallback geometry for ${this._metadata.name}`);
      this.createFallbackGeometry();
    }
  }

  private findWingMeshes(model: THREE.Group): void {
    model.traverse((child) => {
      if (child.name.toLowerCase().includes('wing_left') || child.name.toLowerCase().includes('left_wing')) {
        this.leftWing = child;
      } else if (child.name.toLowerCase().includes('wing_right') || child.name.toLowerCase().includes('right_wing')) {
        this.rightWing = child;
      } else if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('torso')) {
        this.bodyMesh = child;
      }
    });

    // If specific wing names not found, use first two mesh children as wings
    if (!this.leftWing || !this.rightWing) {
      const meshChildren = model.children.filter(child => child instanceof THREE.Mesh);
      if (meshChildren.length >= 2) {
        this.leftWing = meshChildren[0];
        this.rightWing = meshChildren[1];
      }
    }
  }

  private setupWingAnimation(): void {
    if (!this.leftWing || !this.rightWing) {
      console.warn('Wings not found, animation may not work properly');
      return;
    }

    // Store original wing rotations
    this.leftWing.userData.originalRotation = this.leftWing.rotation.clone();
    this.rightWing.userData.originalRotation = this.rightWing.rotation.clone();
  }

  private createFallbackGeometry(): void {
    // Create simple procedural bird shape if GLB fails to load
    const group = new THREE.Group();

    // Body (ellipsoid)
    const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 8);
    bodyGeometry.scale(1, 0.6, 2); // Elongate for bird body
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getSpeciesColor(),
      metalness: 0.1,
      roughness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Wings
    const wingGeometry = new THREE.PlaneGeometry(1.2, 0.6);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: this.getSpeciesColor(),
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.9
    });

    this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.leftWing.position.set(-0.8, 0, 0);
    this.leftWing.rotation.z = Math.PI / 6;
    this.leftWing.userData.originalRotation = this.leftWing.rotation.clone();
    group.add(this.leftWing);

    this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.rightWing.position.set(0.8, 0, 0);
    this.rightWing.rotation.z = -Math.PI / 6;
    this.rightWing.userData.originalRotation = this.rightWing.rotation.clone();
    group.add(this.rightWing);

    // Tail
    const tailGeometry = new THREE.ConeGeometry(0.2, 0.8, 6);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0, -1.2);
    tail.rotation.x = Math.PI / 2;
    group.add(tail);

    this.birdModel = group;
    if (this._object) {
      this._object.add(this.birdModel);
    }
  }

  // Abstract methods to be implemented by species
  protected abstract getModelScale(): number;
  protected abstract getSpeciesColor(): number;
  protected abstract applySpeciesColoring(model: THREE.Group): void;

  // Add getMesh method for compatibility
  public getMesh(): THREE.Object3D {
    return this._object;
  }

  // Wing animation
  private updateWingAnimation(deltaTime: number): void {
    if (!this.leftWing || !this.rightWing) return;

    const frequency = (this._options as BirdOptions).wingBeatFrequency || 2.0;
    const amplitude = (this._options as BirdOptions).wingBeatAmplitude || 0.5;

    this.wingBeatTime += deltaTime * frequency;
    const wingAngle = Math.sin(this.wingBeatTime) * amplitude;

    // Animate wings with opposite phases for realistic flapping
    if (this.leftWing.userData.originalRotation) {
      this.leftWing.rotation.copy(this.leftWing.userData.originalRotation);
      this.leftWing.rotation.z += wingAngle;
    }

    if (this.rightWing.userData.originalRotation) {
      this.rightWing.rotation.copy(this.rightWing.userData.originalRotation);
      this.rightWing.rotation.z -= wingAngle;
    }
  }

  // Update method with wing animation
  public override update(deltaTime: number): void {
    super.update(deltaTime);
    this.updateWingAnimation(deltaTime);
  }

  public override dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    super.dispose();
  }
}