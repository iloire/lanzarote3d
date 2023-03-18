import * as THREE from "three";

export enum TrajectoryPointType {
  Normal,
  TouchGround,
  SpeedBar,
  Ears,
}

export type TrajectoryPoint = {
  vector: THREE.Vector3;
  type: TrajectoryPointType;
};

const getColor = (type: TrajectoryPointType): number => {
  if (type === TrajectoryPointType.Normal) {
    return 0xffffff;
  } else if (type === TrajectoryPointType.SpeedBar) {
    return 0x000000;
  } else if (type === TrajectoryPointType.TouchGround) {
    return 0xff0000;
  } else if (type === TrajectoryPointType.Ears) {
    return 0x000000;
  } else {
    throw new Error("unsupported type");
  }
};

class Trajectory {
  points: TrajectoryPoint[];
  mesh: THREE.Object3D;

  createDot(radius: number, point: TrajectoryPoint): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: getColor(point.type),
    });
    const dot = new THREE.Mesh(geometry, material);
    dot.position.copy(point.vector);
    return dot;
  }

  constructor(points: TrajectoryPoint[], dotRadius: number) {
    this.points = points;
    const vectors = points.map((p) => p.vector);
    const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const group = new THREE.Group();
    const line = new THREE.Line(geometry, material);
    group.add(line);

    const balls = points.map((point) => this.createDot(dotRadius, point));
    balls.forEach((ball) => group.add(ball));
    this.mesh = group;
  }

  getPoints(): TrajectoryPoint[] {
    return this.points;
  }

  getMesh(): THREE.Object3D {
    return this.mesh;
  }
}

export default Trajectory;
