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
   * Get component by ID
   */
  getComponent(id: string): IThreeComponent | undefined {
    return this.components.get(id);
  }

  /**
   * Get component by mesh
   *
   * This allows retrieving the full component with all its behaviors
   * when you only have the mesh reference.
   */
  getComponentByMesh(mesh: THREE.Object3D): IThreeComponent | undefined {
    const id = this.meshToComponentId.get(mesh);
    return id ? this.components.get(id) : undefined;
  }

  /**
   * Get all components of a specific type
   */
  getComponentsByType<T extends IThreeComponent>(type: new (...args: any[]) => T): T[] {
    return Array.from(this.components.values()).filter(
      (component): component is T => component instanceof type
    );
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

  /**
   * Remove a specific component from registry
   */
  removeComponent(id: string): boolean {
    const component = this.components.get(id);
    if (component) {
      // Find and remove mesh mapping
      this.meshToComponentId.forEach((meshId, mesh) => {
        if (meshId === id) {
          this.meshToComponentId.delete(mesh);
        }
      });

      // Dispose the component
      component.dispose();

      // Remove from registry
      this.components.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Remove component by mesh reference
   */
  removeComponentByMesh(mesh: THREE.Object3D): boolean {
    const id = this.meshToComponentId.get(mesh);
    if (id) {
      return this.removeComponent(id);
    }
    return false;
  }

  /**
   * Check if a component is registered
   */
  hasComponent(id: string): boolean {
    return this.components.has(id);
  }

  /**
   * Get total count of registered components
   */
  getComponentCount(): number {
    return this.components.size;
  }
}
