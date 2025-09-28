import { IThreeComponent, ComponentOptions, ComponentMetadata } from '../base/IThreeComponent';

/**
 * Component constructor signature
 */
export type ComponentConstructor<T extends IThreeComponent = IThreeComponent> = new (
  options?: ComponentOptions,
  ...args: any[]
) => T;

/**
 * Component registration information
 */
export interface ComponentRegistration<T extends IThreeComponent = IThreeComponent> {
  readonly constructor: ComponentConstructor<T>;
  readonly metadata: ComponentMetadata;
  readonly defaultOptions?: ComponentOptions;
  readonly category?: string;
  readonly dependencies?: string[];
}

/**
 * Factory configuration options
 */
export interface FactoryOptions {
  enableCaching?: boolean;
  enableDependencyInjection?: boolean;
  defaultCategory?: string;
}

/**
 * Component creation result
 */
export interface ComponentCreationResult<T extends IThreeComponent = IThreeComponent> {
  component: T;
  dependencies?: IThreeComponent[];
  metadata: ComponentMetadata;
}

/**
 * Factory for creating Three.js components with dependency injection and caching
 *
 * Features:
 * - Component registration and discovery
 * - Dependency injection and resolution
 * - Configuration-based component creation
 * - Component caching and reuse
 * - Automatic lifecycle management
 * - Hot-reloading support for development
 */
export class ComponentFactory {
  private static instance: ComponentFactory;

  private registrations = new Map<string, ComponentRegistration>();
  private instances = new Map<string, IThreeComponent>();
  private dependencies = new Map<string, string[]>();

  private options: FactoryOptions;

  private constructor(options: FactoryOptions = {}) {
    this.options = {
      enableCaching: true,
      enableDependencyInjection: true,
      defaultCategory: 'general',
      ...options
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(options?: FactoryOptions): ComponentFactory {
    if (!ComponentFactory.instance) {
      ComponentFactory.instance = new ComponentFactory(options);
    }
    return ComponentFactory.instance;
  }

  /**
   * Register a component type
   */
  public register<T extends IThreeComponent>(
    name: string,
    registration: ComponentRegistration<T>
  ): void {
    this.registrations.set(name, registration);

    // Register dependencies
    if (registration.dependencies) {
      this.dependencies.set(name, registration.dependencies);
    }

    console.log(`📦 Registered component: ${name}`);
  }

  /**
   * Create a component by name
   */
  public async create<T extends IThreeComponent>(
    name: string,
    options: ComponentOptions = {}
  ): Promise<ComponentCreationResult<T>> {
    const registration = this.registrations.get(name);
    if (!registration) {
      throw new Error(`Component '${name}' is not registered`);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(name, options);
    if (this.options.enableCaching && this.instances.has(cacheKey)) {
      const cached = this.instances.get(cacheKey)! as T;
      return {
        component: cached,
        metadata: registration.metadata
      };
    }

    // Resolve dependencies
    let dependencies: IThreeComponent[] | undefined;
    if (this.options.enableDependencyInjection) {
      dependencies = await this.resolveDependencies(name);
    }

    // Merge options
    const mergedOptions = {
      ...registration.defaultOptions,
      ...options
    };

    // Create component instance
    const component = new registration.constructor(mergedOptions) as T;

    // Cache if enabled
    if (this.options.enableCaching) {
      this.instances.set(cacheKey, component);
    }

    const result: ComponentCreationResult<T> = {
      component,
      dependencies,
      metadata: registration.metadata
    };

    console.log(`✨ Created component: ${name}`);
    return result;
  }

  /**
   * Create component from configuration
   */
  public async createFromConfig(config: ComponentConfig): Promise<ComponentCreationResult> {
    return this.create(config.type, config.options);
  }

  /**
   * Create multiple components from configurations
   */
  public async createBatch(configs: ComponentConfig[]): Promise<ComponentCreationResult[]> {
    const results: ComponentCreationResult[] = [];

    for (const config of configs) {
      try {
        const result = await this.createFromConfig(config);
        results.push(result);
      } catch (error) {
        console.error(`Failed to create component ${config.type}:`, error);
        // Continue with other components
      }
    }

    return results;
  }

  /**
   * Get all registered component names
   */
  public getRegisteredComponents(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get components by category
   */
  public getComponentsByCategory(category: string): string[] {
    return Array.from(this.registrations.entries())
      .filter(([_, reg]) => reg.category === category)
      .map(([name]) => name);
  }

  /**
   * Get component metadata
   */
  public getComponentMetadata(name: string): ComponentMetadata | undefined {
    return this.registrations.get(name)?.metadata;
  }

  /**
   * Check if component is registered
   */
  public isRegistered(name: string): boolean {
    return this.registrations.has(name);
  }

  /**
   * Unregister a component
   */
  public unregister(name: string): void {
    this.registrations.delete(name);
    this.dependencies.delete(name);

    // Remove cached instances
    const keysToRemove = Array.from(this.instances.keys())
      .filter(key => key.startsWith(`${name}:`));

    keysToRemove.forEach(key => {
      const instance = this.instances.get(key);
      if (instance) {
        instance.dispose();
      }
      this.instances.delete(key);
    });

    console.log(`🗑️ Unregistered component: ${name}`);
  }

  /**
   * Clear component cache
   */
  public clearCache(): void {
    this.instances.forEach(instance => {
      instance.dispose();
    });
    this.instances.clear();
    console.log('🧹 Cleared component cache');
  }

  /**
   * Dispose of the factory
   */
  public dispose(): void {
    this.clearCache();
    this.registrations.clear();
    this.dependencies.clear();
  }

  // Private methods

  private async resolveDependencies(name: string): Promise<IThreeComponent[]> {
    const deps = this.dependencies.get(name);
    if (!deps || deps.length === 0) {
      return [];
    }

    const resolvedDeps: IThreeComponent[] = [];

    for (const depName of deps) {
      try {
        const result = await this.create(depName);
        resolvedDeps.push(result.component);
      } catch (error) {
        console.warn(`Failed to resolve dependency '${depName}' for '${name}':`, error);
      }
    }

    return resolvedDeps;
  }

  private getCacheKey(name: string, options: ComponentOptions): string {
    // Create cache key from name and options hash
    const optionsHash = this.hashObject(options);
    return `${name}:${optionsHash}`;
  }

  private hashObject(obj: any): string {
    // Simple hash function for cache keys
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

/**
 * Component configuration for factory creation
 */
export interface ComponentConfig {
  type: string;
  options?: ComponentOptions;
  id?: string;
}

/**
 * Scene configuration containing multiple components
 */
export interface SceneConfig {
  components: ComponentConfig[];
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
  };
}

/**
 * Utility class for common component registration patterns
 */
export class ComponentRegistry {

  /**
   * Register common component types
   */
  public static registerDefaults(): void {
    // This will be implemented when we refactor existing components
    console.log('📋 Default component registration will be implemented during refactoring phase');
  }

  /**
   * Register components from a configuration file
   */
  public static async registerFromConfig(configUrl: string): Promise<void> {
    try {
      const response = await fetch(configUrl);
      const config = await response.json();

      // Process component registrations from config
      if (config.components) {
        for (const comp of config.components) {
          // Dynamic import and registration logic would go here
          console.log(`Loading component configuration: ${comp.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to load component configuration:', error);
    }
  }

  /**
   * Auto-discover and register components from a directory
   */
  public static async autoRegister(basePath: string): Promise<void> {
    // This would scan for component files and auto-register them
    // Implementation depends on the build system and file structure
    console.log(`Auto-registration from ${basePath} will be implemented in build phase`);
  }
}

// Export singleton instance
export const componentFactory = ComponentFactory.getInstance();

// Helper function for quick component creation
export async function createComponent<T extends IThreeComponent>(
  name: string,
  options?: ComponentOptions
): Promise<T> {
  const result = await componentFactory.create<T>(name, options);
  return result.component;
}