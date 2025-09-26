import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export class AssetManager {
  private static cache = new Map<string, any>();
  private static gltfLoader = new GLTFLoader();
  private static objLoader = new OBJLoader();
  private static textureLoader = new THREE.TextureLoader();
  private static audioLoader = new THREE.AudioLoader();
  private static audioContext: AudioContext | null = null;

  /**
   * Initialize audio context (call this after user interaction)
   */
  static initAudio(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Load a 3D model (GLB/GLTF or OBJ)
   */
  static async loadModel(path: string): Promise<THREE.Object3D> {
    const fullPath = `/assets/foundation/models/${path}`;

    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath).clone();
    }

    try {
      let model: THREE.Object3D;

      if (path.endsWith('.glb') || path.endsWith('.gltf')) {
        const gltf = await this.loadGLTF(fullPath);
        model = gltf.scene;
      } else if (path.endsWith('.obj')) {
        model = await this.loadOBJ(fullPath);
      } else {
        throw new Error(`Unsupported model format: ${path}`);
      }

      this.cache.set(fullPath, model);
      return model.clone();
    } catch (error) {
      console.error(`Failed to load model: ${path}`, error);
      throw error;
    }
  }

  /**
   * Load a texture
   */
  static async loadTexture(path: string): Promise<THREE.Texture> {
    const fullPath = `/assets/foundation/textures/${path}`;

    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath);
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        fullPath,
        texture => {
          this.cache.set(fullPath, texture);
          resolve(texture);
        },
        undefined,
        error => {
          console.error(`Failed to load texture: ${path}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load an audio file
   */
  static async loadAudio(path: string): Promise<AudioBuffer> {
    const fullPath = `/assets/foundation/audio/${path}`;

    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath);
    }

    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        fullPath,
        buffer => {
          this.cache.set(fullPath, buffer);
          resolve(buffer);
        },
        undefined,
        error => {
          console.error(`Failed to load audio: ${path}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load an app-specific asset
   */
  static async loadAppAsset(appName: string, path: string): Promise<any> {
    const fullPath = `/assets/apps/${appName}/${path}`;

    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath);
    }

    // Determine loader based on file extension
    const extension = path.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'glb':
      case 'gltf':
        return this.loadGLTF(fullPath);
      case 'obj':
        return this.loadOBJ(fullPath);
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return this.loadTextureFromPath(fullPath);
      case 'mp3':
      case 'wav':
      case 'ogg':
        return this.loadAudioFromPath(fullPath);
      default:
        throw new Error(`Unsupported asset format: ${extension}`);
    }
  }

  /**
   * Preload multiple assets
   */
  static async preloadAssets(assets: string[]): Promise<any[]> {
    const promises = assets.map(asset => {
      if (asset.startsWith('apps/')) {
        const [, appName, ...pathParts] = asset.split('/');
        const assetPath = pathParts.join('/');
        return this.loadAppAsset(appName || '', assetPath || '');
      } else if (asset.startsWith('models/')) {
        return this.loadModel(asset.replace('models/', ''));
      } else if (asset.startsWith('textures/')) {
        return this.loadTexture(asset.replace('textures/', ''));
      } else if (asset.startsWith('audio/')) {
        return this.loadAudio(asset.replace('audio/', ''));
      } else {
        throw new Error(`Invalid asset path: ${asset}`);
      }
    });

    return Promise.all(promises);
  }

  /**
   * Clear cache for memory management
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size information
   */
  static getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Private helper methods
  private static loadGLTF(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        gltf => {
          this.cache.set(path, gltf);
          resolve(gltf);
        },
        undefined,
        reject
      );
    });
  }

  private static loadOBJ(path: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        path,
        object => {
          this.cache.set(path, object);
          resolve(object);
        },
        undefined,
        reject
      );
    });
  }

  private static loadTextureFromPath(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        texture => {
          this.cache.set(path, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  private static loadAudioFromPath(path: string): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        path,
        buffer => {
          this.cache.set(path, buffer);
          resolve(buffer);
        },
        undefined,
        reject
      );
    });
  }
}
