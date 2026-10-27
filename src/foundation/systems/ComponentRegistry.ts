import * as THREE from 'three';
import { IThreeComponent } from '../components/base/IThreeComponent';

/**
 * Component registry for managing all Three.js component instances
 *
 * This system maintains both the component instances and their meshes,
 * ensuring that behaviors like floating animations are preserved.
 * It avoids reference problems by keeping the original component instances
 * rather than just cloning meshes.
 */
export class ComponentRegistry {
  private components: Map<string, IThreeComponent> = new Map();
  private meshToComponentId: Map<THREE.Object3D, string> = new Map();
  private nextId: number = 0;

  /**
   * Register a component and return its mesh
   *
   * IMPORTANT: This maintains a reference to the actual component instance,
   * not just the mesh, ensuring behaviors like floating animations continue working.
   */
  async register(
    component: IThreeComponent,
    prefix: string = 'component'
  ): Promise<THREE.Object3D> {
    const id = `${prefix}_${this.nextId++}`;
    this.components.set(id, component);

    const mesh = await component.load();
    this.meshToComponentId.set(mesh, id);

    return mesh;
  }

  /**
   * Get all registered components
   */
  getAllComponents(): Map<string, IThreeComponent> {
    return this.components;
  }

  /**
   * Update all registered components
   *
   * This ensures all component behaviors (like floating animations)
   * continue to run properly.
   */
  update(deltaTime: number): void {
    this.components.forEach(component => {
      if (component.update) {
        component.update(deltaTime);
      }
    });
  }

  /**
   * Dispose all components and clear registry
   */
  dispose(): void {
    this.components.forEach(component => {
      component.dispose();
    });
    this.components.clear();
    this.meshToComponentId.clear();
  }

  /**
   * Get statistics about registered components
   */
  getStats(): { totalComponents: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};

    this.components.forEach(component => {
      const typeName = component.metadata.name;
      byType[typeName] = (byType[typeName] || 0) + 1;
    });

    return {
      totalComponents: this.components.size,
      byType,
    };
  }
}
