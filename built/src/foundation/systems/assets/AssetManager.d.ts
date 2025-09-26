import * as THREE from 'three';
export declare class AssetManager {
    private static cache;
    private static gltfLoader;
    private static objLoader;
    private static textureLoader;
    private static audioLoader;
    private static audioContext;
    /**
     * Initialize audio context (call this after user interaction)
     */
    static initAudio(): void;
    /**
     * Load a 3D model (GLB/GLTF or OBJ)
     */
    static loadModel(path: string): Promise<THREE.Object3D>;
    /**
     * Load a texture
     */
    static loadTexture(path: string): Promise<THREE.Texture>;
    /**
     * Load an audio file
     */
    static loadAudio(path: string): Promise<AudioBuffer>;
    /**
     * Load an app-specific asset
     */
    static loadAppAsset(appName: string, path: string): Promise<any>;
    /**
     * Preload multiple assets
     */
    static preloadAssets(assets: string[]): Promise<any[]>;
    /**
     * Clear cache for memory management
     */
    static clearCache(): void;
    /**
     * Get cache size information
     */
    static getCacheInfo(): {
        size: number;
        keys: string[];
    };
    private static loadGLTF;
    private static loadOBJ;
    private static loadTextureFromPath;
    private static loadAudioFromPath;
}
//# sourceMappingURL=AssetManager.d.ts.map