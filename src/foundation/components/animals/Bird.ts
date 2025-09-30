import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { logger } from '../../utils/logger';

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

    // Create procedural bird geometry directly
    this.createProceduralBird();
    this.setupWingAnimation();

    return this._object;
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Fallback geometry - will be replaced by loaded model
    return new THREE.BoxGeometry(1, 0.5, 2);
  }

  private createProceduralBird(): void {
    // Create procedural bird geometry using Three.js shapes
    const group = new THREE.Group();
    group.name = `${this._metadata.name}_ProceduralBird`;

    // Scale and position the model
    const scale = this.getModelScale();
    group.scale.setScalar(scale);

    // Body (ellipsoid) - main body shape, more streamlined
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 12);
    bodyGeometry.scale(1.2, 0.8, 1.8); // More realistic bird proportions
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getSpeciesColor(),
      metalness: 0.1,
      roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    group.add(body);

    // Wings - more wing-like shape with better proportions
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.8, 0.3, 1.4, 0);
    wingShape.quadraticCurveTo(1.2, -0.2, 0.8, -0.4);
    wingShape.quadraticCurveTo(0.4, -0.3, 0, 0);

    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: this.getSpeciesColor(),
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.8
    });

    this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.leftWing.position.set(-0.6, 0.1, -0.2);
    this.leftWing.rotation.set(0, 0, Math.PI / 8);
    this.leftWing.userData.originalRotation = this.leftWing.rotation.clone();
    group.add(this.leftWing);

    this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.rightWing.position.set(0.6, 0.1, -0.2);
    this.rightWing.rotation.set(0, Math.PI, -Math.PI / 8);
    this.rightWing.userData.originalRotation = this.rightWing.rotation.clone();
    group.add(this.rightWing);

    // Tail - fan-shaped for better appearance
    const tailGeometry = new THREE.ConeGeometry(0.3, 1.0, 8);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0, -1.0);
    tail.rotation.x = Math.PI / 2;
    tail.scale.set(1, 0.3, 1); // Flatten for fan shape
    group.add(tail);

    // Head - slightly smaller and better positioned
    const headGeometry = new THREE.SphereGeometry(0.2, 12, 10);
    headGeometry.scale(1, 1, 1.1); // Slightly elongated
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.15, 0.65);
    group.add(head);

    // Beak - species-specific later, but better proportions
    const beakGeometry = new THREE.ConeGeometry(0.04, 0.25, 8);
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xD2691E, // Saddle brown - more natural
      metalness: 0.2,
      roughness: 0.6
    });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 0.05, 0.85);
    beak.rotation.x = -Math.PI / 2;
    group.add(beak);

    // Eyes for more character
    const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: 0.3
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 0.18, 0.7);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 0.18, 0.7);
    group.add(rightEye);

    this.birdModel = group;
    if (this._object) {
      this._object.add(this.birdModel);
      logger.debug(`Enhanced procedural bird created for ${this._metadata.name}`);
    }
  }


  private setupWingAnimation(): void {
    if (!this.leftWing || !this.rightWing) {
      logger.warn('Wings not found, animation may not work properly');
      return;
    }

    // Store original wing rotations
    this.leftWing.userData.originalRotation = this.leftWing.rotation.clone();
    this.rightWing.userData.originalRotation = this.rightWing.rotation.clone();
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