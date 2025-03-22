import * as CANNON from "cannon-es";
import * as THREE from "three";

// Force visualization constants
const FORCE_SCALE = 1; // Scale factor for force visualization

export class ForceVisualization {
  private liftArrow: THREE.ArrowHelper;
  private dragArrow: THREE.ArrowHelper;
  private windArrow: THREE.ArrowHelper;
  private thermalArrow: THREE.ArrowHelper;
  private gravityArrow: THREE.ArrowHelper;
  private forceGroup: THREE.Group;

  constructor(parent: THREE.Object3D) {
    this.forceGroup = new THREE.Group();
    parent.add(this.forceGroup);
    this.setupArrows();
  }

  private setupArrows() {
    // Create materials for different forces with increased opacity
    const liftMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 25 });
    const dragMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 25 });
    const windMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 25 });
    const thermalMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 25 });
    const gravityMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 25 });

    // Create arrows for each force
    this.liftArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      0x00ff00,
      2,
      1
    );
    this.liftArrow.line.material = liftMaterial;
    this.liftArrow.cone.material = liftMaterial;

    this.dragArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      0xff0000,
      2,
      1
    );
    this.dragArrow.line.material = dragMaterial;
    this.dragArrow.cone.material = dragMaterial;

    this.windArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      0x0000ff,
      2,
      1
    );
    this.windArrow.line.material = windMaterial;
    this.windArrow.cone.material = windMaterial;

    this.thermalArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      0xff00ff,
      2,
      1
    );
    this.thermalArrow.line.material = thermalMaterial;
    this.thermalArrow.cone.material = thermalMaterial;

    this.gravityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      0xffff00,
      2,
      1
    );
    this.gravityArrow.line.material = gravityMaterial;
    this.gravityArrow.cone.material = gravityMaterial;

    // Add all arrows to the group
    this.forceGroup.add(this.liftArrow);
    this.forceGroup.add(this.dragArrow);
    this.forceGroup.add(this.windArrow);
    this.forceGroup.add(this.thermalArrow);
    this.forceGroup.add(this.gravityArrow);

    // Set initial visibility to true by default
    this.forceGroup.visible = true;
  }

  update(
    wingPosition: THREE.Vector3,
    pilotPosition: THREE.Vector3,
    liftForce: CANNON.Vec3,
    dragForce: CANNON.Vec3,
    windForce: CANNON.Vec3,
    thermalForce: CANNON.Vec3 | null,
    gravityForce: CANNON.Vec3
  ) {
    // Update lift force visualization
    const liftDirection = new THREE.Vector3(liftForce.x, liftForce.y, liftForce.z).normalize();
    const liftLength = liftForce.length() * FORCE_SCALE * 5;
    this.liftArrow.setDirection(liftDirection);
    this.liftArrow.setLength(liftLength);
    this.liftArrow.position.copy(wingPosition);

    // Update drag force visualization
    const dragDirection = new THREE.Vector3(dragForce.x, dragForce.y, dragForce.z).normalize();
    const dragLength = dragForce.length() * FORCE_SCALE * 5;
    this.dragArrow.setDirection(dragDirection);
    this.dragArrow.setLength(dragLength);
    this.dragArrow.position.copy(wingPosition);

    // Update wind force visualization
    const windDirection = new THREE.Vector3(windForce.x, windForce.y, windForce.z).normalize();
    const windLength = windForce.length() * FORCE_SCALE * 5;
    this.windArrow.setDirection(windDirection);
    this.windArrow.setLength(windLength);
    this.windArrow.position.copy(wingPosition);

    // Update thermal force visualization
    if (thermalForce) {
      const thermalDirection = new THREE.Vector3(thermalForce.x, thermalForce.y, thermalForce.z).normalize();
      const thermalLength = thermalForce.length() * FORCE_SCALE * 5;
      this.thermalArrow.setDirection(thermalDirection);
      this.thermalArrow.setLength(thermalLength);
      this.thermalArrow.position.copy(wingPosition);
      this.thermalArrow.visible = true;
    } else {
      this.thermalArrow.visible = false;
    }

    // Update gravity force visualization
    const gravityDirection = new THREE.Vector3(0, -1, 0);
    const gravityLength = gravityForce.length() * FORCE_SCALE * 5;
    this.gravityArrow.setDirection(gravityDirection);
    this.gravityArrow.setLength(gravityLength);
    this.gravityArrow.position.copy(pilotPosition);
  }

  setVisible(visible: boolean) {
    this.forceGroup.visible = visible;
  }

  isVisible(): boolean {
    return this.forceGroup.visible;
  }
} 