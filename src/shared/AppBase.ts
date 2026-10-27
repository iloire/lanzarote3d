import { StoryOptions } from './types';

export interface AppConfig {
  name: string;
  description: string;
}

/**
 * AppBase - Common foundation for all Lanzarote3D apps: a name, error reporting and a
 * dispose() for subclasses to chain onto
 */
export abstract class AppBase {
  protected config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    console.log(`🚀 Initializing app: ${config.name}`);
  }

  abstract load(options: StoryOptions): Promise<void> | void;

  protected handleError(error: Error, context: string): void {
    console.error(`❌ ${this.config.name} Error in ${context}:`, error);
  }

  public dispose(): void {}
}

export default AppBase;
