import * as CANNON from "cannon-es";
import * as THREE from "three";

// Force visualization constants with better scaling
const FORCE_SCALE = 0.01; // Base scale factor for force visualization

// Vector colors with better distinction
const COLORS = {
  LIFT: 0x00ff00,     // Green
  DRAG: 0xff0000,     // Red
  WEIGHT: 0xffff00,   // Yellow
  GLIDE_DIRECTION: 0x0000ff,    // Blue
  LEFT_BREAK: 0xff00ff,   // Magenta
  RIGHT_BREAK: 0x00ffff,  // Cyan
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

interface ForceDefinition {
  name: string;
  color: number;
  position: THREE.Vector3;
  vector: CANNON.Vec3;
  scale?: number;
}

export class VectorVisualizater {
  private forces: Map<string, {
    arrow: THREE.ArrowHelper;
    label: THREE.Sprite;
    group: THREE.Group;
    scale: number;
  }> = new Map();

  // Arrow helpers
  private liftArrow: THREE.ArrowHelper;
  private dragArrow: THREE.ArrowHelper;
  private glideDirectionArrow: THREE.ArrowHelper;
  private weightArrow: THREE.ArrowHelper;
  private leftBreakArrow: THREE.ArrowHelper;
  private rightBreakArrow: THREE.ArrowHelper;

  // Text labels for forces
  private forceLabels: { [key: string]: THREE.Sprite } = {};

  // Groups to organize forces by where they're applied
  private gliderForceGroup: THREE.Group;
  private pilotForceGroup: THREE.Group;
  private forceGroup: THREE.Group;

  // Scale factors
  private customScaleFactor: number = 1.0;

  constructor(parent: THREE.Object3D) {
    // Create main force group
    this.forceGroup = new THREE.Group();
    parent.add(this.forceGroup);

    // Create separate groups for wing and pilot forces
    this.gliderForceGroup = new THREE.Group();
    this.pilotForceGroup = new THREE.Group();

    this.forceGroup.add(this.gliderForceGroup);
    this.forceGroup.add(this.pilotForceGroup);

    this.setupArrows();
    this.setupLabels();
  }

  private createArrow(color: number): THREE.ArrowHelper {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      color,
      3,
      1.5
    );
    arrow.line.material = new THREE.LineBasicMaterial({ color, linewidth: 3 });
    return arrow;
  }

  private createTextSprite(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    // Draw text with larger font size
    context.font = "Bold 48px Arial"; // Slightly smaller for title
    context.fillStyle = colorToHexString(color);
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.textAlign = 'left';
    context.fillText(text, 20, 80);
    context.strokeText(text, 20, 80);

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(25, 12.5, 1);

    return sprite;
  }

  private setupLabels() {
    // Create text labels for each force
    this.forceLabels['lift'] = this.createTextSprite("LIFT", COLORS.LIFT);
    this.forceLabels['drag'] = this.createTextSprite("DRAG", COLORS.DRAG);
    this.forceLabels['weight'] = this.createTextSprite("WEIGHT", COLORS.WEIGHT);
    this.forceLabels['glideDirection'] = this.createTextSprite("GLIDE", COLORS.GLIDE_DIRECTION);
    this.forceLabels['leftBreak'] = this.createTextSprite("L-BREAK", COLORS.LEFT_BREAK);
    this.forceLabels['rightBreak'] = this.createTextSprite("R-BREAK", COLORS.RIGHT_BREAK);

    // Add labels to their respective groups
    this.gliderForceGroup.add(this.forceLabels['lift']);
    this.gliderForceGroup.add(this.forceLabels['drag']);
    this.gliderForceGroup.add(this.forceLabels['glideDirection']);
    this.gliderForceGroup.add(this.forceLabels['leftBreak']);
    this.gliderForceGroup.add(this.forceLabels['rightBreak']);
    this.pilotForceGroup.add(this.forceLabels['weight']);

    // Hide labels by default
    Object.keys(this.forceLabels).forEach(key => {
      this.forceLabels[key].visible = false;
    });
  }

  private setupArrows() {
    // Create materials for different forces with thicker lines
    const liftMaterial = new THREE.LineBasicMaterial({ color: COLORS.LIFT, linewidth: 3 });
    const dragMaterial = new THREE.LineBasicMaterial({ color: COLORS.DRAG, linewidth: 3 });
    const glideDirectionMaterial = new THREE.LineBasicMaterial({ color: COLORS.GLIDE_DIRECTION, linewidth: 3 });
    const weightMaterial = new THREE.LineBasicMaterial({ color: COLORS.WEIGHT, linewidth: 3 });
    const leftBreakMaterial = new THREE.LineBasicMaterial({ color: COLORS.LEFT_BREAK, linewidth: 3 });
    const rightBreakMaterial = new THREE.LineBasicMaterial({ color: COLORS.RIGHT_BREAK, linewidth: 3 });

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

    this.weightArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.WEIGHT,
      3,
      1.5
    );
    this.weightArrow.line.material = weightMaterial;

    this.glideDirectionArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      10,
      COLORS.GLIDE_DIRECTION,
      3,
      1.5
    );
    this.glideDirectionArrow.line.material = glideDirectionMaterial;

    // Create left break arrow
    this.leftBreakArrow = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-5, 0, 0), // Position offset to the left side of the wing
      10,
      COLORS.LEFT_BREAK,
      3,
      1.5
    );
    this.leftBreakArrow.line.material = leftBreakMaterial;

    // Create right break arrow
    this.rightBreakArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(5, 0, 0), // Position offset to the right side of the wing
      10,
      COLORS.RIGHT_BREAK,
      3,
      1.5
    );
    this.rightBreakArrow.line.material = rightBreakMaterial;

    // Add wing-related forces to wing force group
    this.gliderForceGroup.add(this.liftArrow);
    this.gliderForceGroup.add(this.dragArrow);
    this.gliderForceGroup.add(this.glideDirectionArrow);
    this.gliderForceGroup.add(this.leftBreakArrow);
    this.gliderForceGroup.add(this.rightBreakArrow);
    this.pilotForceGroup.add(this.weightArrow);

    // Set initial visibility to true by default
    this.forceGroup.visible = true;
  }

  private updateLabel(
    label: THREE.Sprite,
    name: string,
    color: number,
    position: THREE.Vector3,
    direction: THREE.Vector3,
    length: number
  ) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    // Format the magnitude to 2 decimal places
    const magnitude = (length / this.customScaleFactor).toFixed(2);

    // Draw the title
    context.font = "Bold 48px Arial";
    context.fillStyle = colorToHexString(color);
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.textAlign = 'left';

    context.fillText(name, 20, 80);
    context.strokeText(name, 20, 80);

    // Draw the magnitude below the title
    context.font = "40px Arial";
    context.fillText(`${magnitude}N`, 20, 140);
    context.strokeText(`${magnitude}N`, 20, 140);

    // Update the sprite's texture
    const texture = new THREE.CanvasTexture(canvas);
    (label.material as THREE.SpriteMaterial).map = texture;
    (label.material as THREE.SpriteMaterial).map.needsUpdate = true;

    // Position the label at the end of the arrow
    const targetPosition = position.clone().add(direction.clone().multiplyScalar(length + 8));
    label.position.copy(targetPosition);
    label.visible = length > 0.1;
  }

  /**
   * Add or update a force vector visualization
   * @param force Force definition containing name, color, position, and vector
   */
  addForce(force: ForceDefinition): void {
    const {
      name,
      color,
      position,
      vector,
      scale = FORCE_SCALE
    } = force;

    let forceData = this.forces.get(name);

    if (!forceData) {
      // Create new force visualization
      const group = new THREE.Group();
      const arrow = this.createArrow(color);
      const label = this.createTextSprite(name, color);

      group.add(arrow);
      group.add(label);
      this.forceGroup.add(group);

      forceData = {
        arrow,
        label,
        group,
        scale
      };
      this.forces.set(name, forceData);
    }

    // Update force visualization
    const effectiveScale = scale * this.customScaleFactor;
    const direction = new THREE.Vector3(vector.x, vector.y, vector.z);

    // Safely normalize the direction
    if (direction.length() > 0.001) {
      direction.normalize();
    }

    const length = vector.length() * effectiveScale;
    forceData.group.position.copy(position);
    forceData.arrow.setDirection(direction);
    forceData.arrow.setLength(Math.max(0, length));
    this.updateLabel(forceData.label, name, color, new THREE.Vector3(), direction, length);
  }

  /**
   * Remove a force vector visualization
   * @param name Name of the force to remove
   */
  removeForce(name: string): void {
    const force = this.forces.get(name);
    if (force) {
      this.forceGroup.remove(force.group);
      this.forces.delete(name);
    }
  }

  /**
   * Clear all force visualizations
   */
  clearForces(): void {
    console.log("clearForces");
    this.forces.forEach((force, name) => {
      this.removeForce(name);
    });
  }

  /**
   * Set the scale factor for all force visualizations
   * @param scale Scale factor to apply to all forces (default: 1.0)
   */
  setScale(scale: number): void {
    this.customScaleFactor = scale;
    // Update all existing forces with new scale
    this.forces.forEach((force, name) => {
      const position = force.group.position.clone();
      // Get the current direction from the arrow's quaternion
      const direction = new THREE.Vector3(0, 1, 0);
      direction.applyQuaternion(force.arrow.quaternion);

      this.addForce({
        name,
        color: (force.arrow.line.material as THREE.LineBasicMaterial).color.getHex(),
        position,
        vector: new CANNON.Vec3(
          direction.x,
          direction.y,
          direction.z
        ),
        scale: force.scale
      });
    });
  }

  /**
   * Set visibility of all force visualizations
   * @param visible Whether the force visualizations should be visible
   */
  setVisible(visible: boolean): void {
    this.forceGroup.visible = visible;
  }

  isVisible(): boolean {
    return this.forceGroup.visible;
  }
} 