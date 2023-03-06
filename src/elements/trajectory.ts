import * as THREE from "three";

class Trajectory {
  points: THREE.Vector3[];
  mesh: THREE.Object3D;

  createDot(radius: number, point: THREE.Vector3): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const ball = new THREE.Mesh(geometry, material);
    ball.position.copy(point);
    return ball;
  }

  constructor(points: THREE.Vector3[], dotRadius: number = 50) {
    this.points = points;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const group = new THREE.Group();
    const line = new THREE.Line(geometry, material);
    group.add(line);

    const balls = points.map((center) => this.createDot(dotRadius, center));
    balls.forEach((ball) => group.add(ball));
    this.mesh = group;
  }

  getPoints(): THREE.Vector3[] {
    return this.points;
  }

  getMesh(): THREE.Object3D {
    return this.mesh;
  }
}

export default Trajectory;
