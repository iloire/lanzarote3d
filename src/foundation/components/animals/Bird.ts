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
    // Return empty geometry - bird is created procedurally in createProceduralBird
    return new THREE.BufferGeometry();
  }

  private createProceduralBird(): void {
    // Create procedural bird geometry using Three.js shapes
    const group = new THREE.Group();
    group.name = `${this._metadata.name}_ProceduralBird`;

    // Scale and position the model
    const scale = this.getModelScale();
    group.scale.setScalar(scale);

    // Body - streamlined teardrop shape (thin and aerodynamic)
    const bodyGeometry = new THREE.SphereGeometry(0.25, 16, 12);
    bodyGeometry.scale(0.7, 0.5, 1.8); // Very lean, thin, elongated
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: this.getSpeciesColor(),
      metalness: 0.1,
      roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    body.name = 'body';
    group.add(body);

    // Wings - BIGGER wings with realistic bird wing shape
    // Create wing with primary and secondary feathers
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    // Primary feathers (long outer section)
    wingShape.quadraticCurveTo(1.0, 0.5, 2.2, 0.3);
    wingShape.quadraticCurveTo(2.0, 0.1, 1.8, -0.1);
    // Secondary feathers (inner section)
    wingShape.quadraticCurveTo(1.2, -0.3, 0.6, -0.5);
    wingShape.quadraticCurveTo(0.3, -0.3, 0, 0);

    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: this.getSpeciesColor(),
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.8
    });

    // Left wing - attach at body, rotate from shoulder
    this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.leftWing.position.set(-0.3, 0.05, -0.1);
    this.leftWing.rotation.set(0, 0, 0);
    this.leftWing.userData.originalRotation = this.leftWing.rotation.clone();
    this.leftWing.userData.originalPosition = this.leftWing.position.clone();
    this.leftWing.name = 'leftWing';
    group.add(this.leftWing);

    // Right wing - mirror of left
    this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    this.rightWing.position.set(0.3, 0.05, -0.1);
    this.rightWing.rotation.set(0, Math.PI, 0);
    this.rightWing.userData.originalRotation = this.rightWing.rotation.clone();
    this.rightWing.userData.originalPosition = this.rightWing.position.clone();
    this.rightWing.name = 'rightWing';
    group.add(this.rightWing);

    // Tail - more streamlined
    const tailGeometry = new THREE.ConeGeometry(0.25, 0.9, 8);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, 0, -0.9);
    tail.rotation.x = Math.PI / 2;
    tail.scale.set(1, 0.25, 1);
    group.add(tail);

    // Head - smaller to match leaner body
    const headGeometry = new THREE.SphereGeometry(0.18, 12, 10);
    headGeometry.scale(0.95, 0.95, 1.1);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.12, 0.6);
    group.add(head);

    // Beak - proportional to smaller head
    const beakGeometry = new THREE.ConeGeometry(0.035, 0.22, 8);
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xD2691E,
      metalness: 0.2,
      roughness: 0.6
    });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0, 0.04, 0.78);
    beak.rotation.x = -Math.PI / 2;
    group.add(beak);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.028, 8, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: 0.3
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.11, 0.15, 0.65);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.11, 0.15, 0.65);
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

  // Wing animation - proper flapping motion (not oscillation)
  private updateWingAnimation(deltaTime: number): void {
    if (!this.leftWing || !this.rightWing) return;

    const frequency = (this._options as BirdOptions).wingBeatFrequency || 2.0;
    const amplitude = (this._options as BirdOptions).wingBeatAmplitude || 0.5;

    this.wingBeatTime += deltaTime * frequency * Math.PI * 2;

    // Flapping cycle: down -> up -> down (not simple oscillation)
    const cycle = this.wingBeatTime % (Math.PI * 2);
    let flapAngle: number;

    if (cycle < Math.PI) {
      // Downstroke - powerful, fast motion
      const t = cycle / Math.PI;
      flapAngle = Math.sin(t * Math.PI) * amplitude * 1.5; // Down
    } else {
      // Upstroke - recovery, slower motion
      const t = (cycle - Math.PI) / Math.PI;
      flapAngle = -Math.sin(t * Math.PI) * amplitude * 0.8; // Up
    }

    // Apply flapping rotation around Z axis (up/down motion)
    if (this.leftWing.userData.originalRotation) {
      this.leftWing.rotation.copy(this.leftWing.userData.originalRotation);
      this.leftWing.rotation.z = -flapAngle; // Flap down/up
    }

    if (this.rightWing.userData.originalRotation) {
      this.rightWing.rotation.copy(this.rightWing.userData.originalRotation);
      this.rightWing.rotation.z = flapAngle; // Mirror flapping
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