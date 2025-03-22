import * as CANNON from "cannon-es";
import * as THREE from "three";

// Force visualization constants with better scaling
const FORCE_SCALE = 0.5; // Base scale factor for force visualization
const WING_FORCE_SCALE = 5; // Wing forces need more visibility
const PILOT_FORCE_SCALE = 1; // Pilot forces scale

// Force colors with better distinction
const COLORS = {
  LIFT: 0x00ff00,     // Green
  DRAG: 0xff0000,     // Red
  WIND: 0x0088ff,     // Blue
  THERMAL: 0xff00ff,  // Magenta
  GRAVITY: 0xffff00   // Yellow
};

// Helper function to convert color number to CSS color string
function colorToHexString(color: number): string {
  // Convert to hex and ensure it has 6 digits
  let hexStr = color.toString(16);
  while (hexStr.length < 6) {
    hexStr = '0' + hexStr;
  }
  return '#' + hexStr;
}

export class ForceVisualization {
  // Arrow helpers
  private liftArrow: THREE.ArrowHelper;
  private dragArrow: THREE.ArrowHelper;
  private windArrow: THREE.ArrowHelper;
  private thermalArrow: THREE.ArrowHelper;
  private gravityArrow: THREE.ArrowHelper;

  // Text labels for forces
  private forceLabels: { [key: string]: THREE.Sprite } = {};

  // Groups to organize forces by where they're applied
  private wingForceGroup: THREE.Group;
  private pilotForceGroup: THREE.Group;
  private forceGroup: THREE.Group;

  constructor(parent: THREE.Object3D) {
    // Create main force group
    this.forceGroup = new THREE.Group();
    parent.add(this.forceGroup);

    // Create separate groups for wing and pilot forces
    this.wingForceGroup = new THREE.Group();
    this.pilotForceGroup = new THREE.Group();

    this.forceGroup.add(this.wingForceGroup);
    this.forceGroup.add(this.pilotForceGroup);

    this.setupArrows();
    this.setupLabels();
  }

  private createTextSprite(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;  // Doubled canvas width
    canvas.height = 256; // Doubled canvas height

    // Draw text with larger font size
    context.font = "Bold 64px Arial"; // Increased from 36px to 64px
    context.fillStyle = colorToHexString(color);
    context.strokeStyle = '#000000'; // Add black outline for better visibility
    context.lineWidth = 3;
    context.fillText(text, 20, 100); // Adjusted position for larger text
    context.strokeText(text, 20, 100);

    // Create sprite with larger scale
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(25, 12.5, 1); // Increased from 10,5,1 to make labels much bigger

    return sprite;
  }

  private setupLabels() {
    // Create text labels for each force
    this.forceLabels['lift'] = this.createTextSprite("LIFT", COLORS.LIFT);
    this.forceLabels['drag'] = this.createTextSprite("DRAG", COLORS.DRAG);
    this.forceLabels['wind'] = this.createTextSprite("WIND", COLORS.WIND);
    this.forceLabels['thermal'] = this.createTextSprite("THERMAL", COLORS.THERMAL);
    this.forceLabels['gravity'] = this.createTextSprite("GRAVITY", COLORS.GRAVITY);

    // Add labels to their respective groups
    this.wingForceGroup.add(this.forceLabels['lift']);
    this.wingForceGroup.add(this.forceLabels['drag']);
    this.wingForceGroup.add(this.forceLabels['wind']);
    this.wingForceGroup.add(this.forceLabels['thermal']);
    this.pilotForceGroup.add(this.forceLabels['gravity']);

    // Hide labels by default (will be positioned in update)
    // Compatible alternative to Object.values
    Object.keys(this.forceLabels).forEach(key => {
      this.forceLabels[key].visible = false;
    });
  }

  private setupArrows() {
    // Create materials for different forces with thicker lines
    const liftMaterial = new THREE.LineBasicMaterial({ color: COLORS.LIFT, linewidth: 3 });
    const dragMaterial = new THREE.LineBasicMaterial({ color: COLORS.DRAG, linewidth: 3 });
    const windMaterial = new THREE.LineBasicMaterial({ color: COLORS.WIND, linewidth: 3 });
    const thermalMaterial = new THREE.LineBasicMaterial({ color: COLORS.THERMAL, linewidth: 3 });
    const gravityMaterial = new THREE.LineBasicMaterial({ color: COLORS.GRAVITY, linewidth: 3 });

    // Create arrows with more distinctive sizing
    this.liftArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.LIFT,
      3, // larger head
      1.5 // wider head
    );
    this.liftArrow.line.material = liftMaterial;

    this.dragArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.DRAG,
      3,
      1.5
    );
    this.dragArrow.line.material = dragMaterial;

    this.windArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.WIND,
      3,
      1.5
    );
    this.windArrow.line.material = windMaterial;

    this.thermalArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.THERMAL,
      3,
      1.5
    );
    this.thermalArrow.line.material = thermalMaterial;

    this.gravityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.GRAVITY,
      3,
      1.5
    );
    this.gravityArrow.line.material = gravityMaterial;

    // Add wing-related forces to wing force group
    this.wingForceGroup.add(this.liftArrow);
    this.wingForceGroup.add(this.dragArrow);
    this.wingForceGroup.add(this.windArrow);
    this.wingForceGroup.add(this.thermalArrow);

    // Add pilot-related forces to pilot force group
    this.pilotForceGroup.add(this.gravityArrow);

    // Set initial visibility to true by default
    this.forceGroup.visible = true;
  }

  private updateLabel(
    labelName: string,
    position: THREE.Vector3,
    direction: THREE.Vector3,
    length: number
  ) {
    const label = this.forceLabels[labelName];
    if (!label) return;

    // Position the label at the end of the arrow
    const targetPosition = position.clone().add(direction.clone().multiplyScalar(length + 8)); // Increased offset from 5 to 8
    label.position.copy(targetPosition);
    label.visible = length > 0.5; // Lowered threshold to show more labels
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
    // Position the force groups at their respective objects
    this.wingForceGroup.position.copy(wingPosition);
    this.pilotForceGroup.position.copy(pilotPosition);

    // Update forces applied to the WING

    // Update lift force visualization - apply from wing center
    const liftDirection = new THREE.Vector3(liftForce.x, liftForce.y, liftForce.z).normalize();
    const liftLength = liftForce.length() * FORCE_SCALE * WING_FORCE_SCALE;
    this.liftArrow.setDirection(liftDirection);
    this.liftArrow.setLength(liftLength);
    this.liftArrow.position.set(0, 0, 0); // Relative to wing group
    this.updateLabel('lift', new THREE.Vector3(0, 0, 0), liftDirection, liftLength);

    // Update drag force visualization - apply from wing center
    const dragDirection = new THREE.Vector3(dragForce.x, dragForce.y, dragForce.z).normalize();
    const dragLength = dragForce.length() * FORCE_SCALE * WING_FORCE_SCALE;
    this.dragArrow.setDirection(dragDirection);
    this.dragArrow.setLength(dragLength);
    this.dragArrow.position.set(0, 0, 0); // Relative to wing group
    this.updateLabel('drag', new THREE.Vector3(0, 0, 0), dragDirection, dragLength);

    // Update wind force visualization - apply from wing with offset to avoid overlap
    const windDirection = new THREE.Vector3(windForce.x, windForce.y, windForce.z).normalize();
    const windLength = windForce.length() * FORCE_SCALE * WING_FORCE_SCALE;
    this.windArrow.setDirection(windDirection);
    this.windArrow.setLength(windLength);
    this.windArrow.position.set(2, 0, 2); // Slight offset to avoid overlap
    this.updateLabel('wind', new THREE.Vector3(2, 0, 2), windDirection, windLength);

    // Update thermal force visualization - apply from wing with offset
    if (thermalForce && thermalForce.length() > 0.01) {
      const thermalDirection = new THREE.Vector3(thermalForce.x, thermalForce.y, thermalForce.z).normalize();
      const thermalLength = thermalForce.length() * FORCE_SCALE * WING_FORCE_SCALE;
      this.thermalArrow.setDirection(thermalDirection);
      this.thermalArrow.setLength(thermalLength);
      this.thermalArrow.position.set(-2, 0, -2); // Offset to avoid overlap
      this.thermalArrow.visible = true;
      this.updateLabel('thermal', new THREE.Vector3(-2, 0, -2), thermalDirection, thermalLength);
    } else {
      this.thermalArrow.visible = false;
      this.forceLabels['thermal'].visible = false;
    }

    // Update forces applied to the PILOT

    // Update gravity force visualization - apply from pilot center
    const gravityDirection = new THREE.Vector3(gravityForce.x, gravityForce.y, gravityForce.z).normalize();
    const gravityLength = gravityForce.length() * FORCE_SCALE * PILOT_FORCE_SCALE;
    this.gravityArrow.setDirection(gravityDirection);
    this.gravityArrow.setLength(gravityLength);
    this.gravityArrow.position.set(0, 0, 0); // Relative to pilot group
    this.updateLabel('gravity', new THREE.Vector3(0, 0, 0), gravityDirection, gravityLength);
  }

  setVisible(visible: boolean) {
    this.forceGroup.visible = visible;
  }

  isVisible(): boolean {
    return this.forceGroup.visible;
  }
} 