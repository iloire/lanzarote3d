import * as THREE from 'three';
import { SimpleThreeComponent } from './SimpleThreeComponent';
import { FloatingBehavior, FloatingBehaviorOptions } from '../../systems/behaviors/FloatingBehavior';
import type { ComponentOptions, ComponentMetadata } from './BaseThreeComponent';

export interface FloatingComponentOptions extends ComponentOptions {
  floatingScale?: number;
  autoStartFloating?: boolean;
  wavePhaseOffset?: number;
}

/**
 * Base class that combines modern component architecture with floating behavior
 * for objects that should realistically float on water
 */
export abstract class FloatingThreeComponent extends SimpleThreeComponent {
  private floatingBehavior: FloatingBehavior;

  constructor(metadata: ComponentMetadata, options: FloatingComponentOptions = {}) {
    super(metadata, options);

    this.floatingBehavior = new FloatingBehavior({
      scaleMultiplier: options.floatingScale || 1,
      autoStart: options.autoStartFloating ?? true,
      wavePhaseOffset: options.wavePhaseOffset
    });
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    const object = await super.createObject();

    // Integrate floating behavior
    this.floatingBehavior.attachTo(object);

    if ((this.options as FloatingComponentOptions).autoStartFloating ?? true) {
      this.floatingBehavior.start();
    }

    return object;
  }

  // Floating control methods
  public startFloating(): void {
    this.floatingBehavior.start();
  }

  public stopFloating(): void {
    this.floatingBehavior.stop();
  }

  public setFloatingScale(scale: number): void {
    this.floatingBehavior.setScale(scale);
  }

  public isFloating(): boolean {
    return this.floatingBehavior.isActive();
  }

  public override dispose(): void {
    this.floatingBehavior.dispose();
    super.dispose();
  }
}