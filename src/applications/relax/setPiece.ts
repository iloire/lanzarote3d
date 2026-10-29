import type * as THREE from 'three';
import type { StoryOptions } from '../../shared/types';

/**
 * A place's own show, beyond terrain, gliders and buildings: loaded once the environment is up,
 * ticked every frame and torn down with the scene (Mont-Saint-Michel's tide)
 */
export interface SetPiece {
  /** `elapsed` is seconds since the scene started */
  update(deltaTime: number, elapsed: number): void;
  dispose(): void;
}

export type SetPieceLoader = (options: StoryOptions & { terrain: THREE.Mesh }) => Promise<SetPiece>;
