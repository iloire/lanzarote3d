import * as THREE from 'three';
import { TrajectoryPoint, TrajectoryPointType } from '../../components/ui/Trajectory';

export interface TrajectoryTrackerOptions {
  recordInterval?: number; // How often to record points (in frames, default 10)
  maxPoints?: number; // Maximum number of points to keep (0 = unlimited)
}

/**
 * TrajectoryTracker records the flight path of an object over time.
 * Useful for visualizing flight paths, analyzing performance, and debugging.
 */
export class TrajectoryTracker {
  private trajectory: TrajectoryPoint[] = [];
  private frameCounter: number = 0;
  private recordInterval: number;
  private maxPoints: number;

  constructor(options: TrajectoryTrackerOptions = {}) {
    this.recordInterval = options.recordInterval ?? 10;
    this.maxPoints = options.maxPoints ?? 0; // 0 = unlimited
  }

  /**
   * Update tracker - call this every frame
   * Returns true if a point was recorded this frame
   */
  update(position: THREE.Vector3, type: TrajectoryPointType = TrajectoryPointType.Normal): boolean {
    this.frameCounter++;

    if (this.frameCounter % this.recordInterval === 0) {
      this.addPoint(position, type);
      return true;
    }

    return false;
  }

  /**
   * Manually add a point (e.g., for special events)
   */
  addPoint(position: THREE.Vector3, type: TrajectoryPointType = TrajectoryPointType.Normal): void {
    this.trajectory.push({
      type,
      vector: position.clone(),
    });

    // Limit number of points if maxPoints is set
    if (this.maxPoints > 0 && this.trajectory.length > this.maxPoints) {
      this.trajectory.shift(); // Remove oldest point
    }
  }

  /**
   * Add a ground touch point
   */
  addGroundTouch(position: THREE.Vector3): void {
    this.addPoint(position, TrajectoryPointType.TouchGround);
  }

  /**
   * Get the full trajectory
   */
  getTrajectory(): TrajectoryPoint[] {
    return this.trajectory;
  }

  /**
   * Get trajectory as simple Vector3 array
   */
  getPositions(): THREE.Vector3[] {
    return this.trajectory.map(point => point.vector);
  }

  /**
   * Get the last recorded position
   */
  getLastPosition(): THREE.Vector3 | null {
    if (this.trajectory.length === 0) {
      return null;
    }
    return this.trajectory[this.trajectory.length - 1].vector.clone();
  }

  /**
   * Calculate total distance traveled
   */
  getTotalDistance(): number {
    if (this.trajectory.length < 2) {
      return 0;
    }

    let distance = 0;
    for (let i = 1; i < this.trajectory.length; i++) {
      distance += this.trajectory[i].vector.distanceTo(this.trajectory[i - 1].vector);
    }

    return distance;
  }

  /**
   * Calculate average altitude
   */
  getAverageAltitude(): number {
    if (this.trajectory.length === 0) {
      return 0;
    }

    const totalAltitude = this.trajectory.reduce((sum, point) => sum + point.vector.y, 0);
    return totalAltitude / this.trajectory.length;
  }

  /**
   * Get min/max altitude
   */
  getAltitudeRange(): { min: number; max: number } {
    if (this.trajectory.length === 0) {
      return { min: 0, max: 0 };
    }

    let min = Infinity;
    let max = -Infinity;

    for (const point of this.trajectory) {
      if (point.vector.y < min) min = point.vector.y;
      if (point.vector.y > max) max = point.vector.y;
    }

    return { min, max };
  }

  /**
   * Count points of specific type
   */
  countPointsOfType(type: TrajectoryPointType): number {
    return this.trajectory.filter(point => point.type === type).length;
  }

  /**
   * Clear all trajectory data
   */
  clear(): void {
    this.trajectory = [];
    this.frameCounter = 0;
  }

  /**
   * Export trajectory as JSON
   */
  export(): string {
    return JSON.stringify(
      this.trajectory.map(point => ({
        type: point.type,
        x: point.vector.x,
        y: point.vector.y,
        z: point.vector.z,
      })),
      null,
      2
    );
  }

  /**
   * Import trajectory from JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json);
      this.trajectory = data.map((point: { type: TrajectoryPointType; x: number; y: number; z: number }) => ({
        type: point.type,
        vector: new THREE.Vector3(point.x, point.y, point.z),
      }));
    } catch (error) {
      throw new Error('Invalid trajectory JSON format');
    }
  }

  // Configuration
  setRecordInterval(interval: number): void {
    this.recordInterval = Math.max(1, interval);
  }

  setMaxPoints(maxPoints: number): void {
    this.maxPoints = Math.max(0, maxPoints);

    // Trim if needed
    if (this.maxPoints > 0 && this.trajectory.length > this.maxPoints) {
      this.trajectory = this.trajectory.slice(-this.maxPoints);
    }
  }

  getRecordInterval(): number {
    return this.recordInterval;
  }

  getMaxPoints(): number {
    return this.maxPoints;
  }

  getPointCount(): number {
    return this.trajectory.length;
  }
}
